/** Real HTTP integration test. Requires `npm run dev` and the development mail outbox.
 * Run: node tests/backend-flow.mjs
 * No fixtures are inserted directly into the database; temporary users are deleted.
 */
import assert from "node:assert/strict";
import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
const base = process.env.TEST_BASE_URL || "http://localhost:3000";
const origin = new URL(base).origin;
const dataDir = process.env.LUMEN_DATA_DIR || path.resolve(".data");
const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const password = "Lumen-Integration-19!";
const changedPassword = "Lumen-Recovered-20!";
const results = [];
class Client {
  constructor() {
    this.cookies = new Map();
  }
  async request(route, method = "GET", body, extra = {}) {
    const response = await fetch(new URL(route, base), {
      method,
      redirect: "manual",
      headers: {
        ...(body === undefined
          ? {}
          : { "content-type": "application/json", origin }),
        ...(this.cookies.size
          ? {
              cookie: [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; "),
            }
          : {}),
        ...extra,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    for (const cookie of response.headers.getSetCookie()) {
      const [pair] = cookie.split(";");
      const index = pair.indexOf("=");
      const key = pair.slice(0, index),
        value = pair.slice(index + 1);
      if (/Max-Age=0/i.test(cookie)) this.cookies.delete(key);
      else this.cookies.set(key, value);
    }
    const text = await response.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
    return { status: response.status, json, text, headers: response.headers };
  }
}
async function check(name, fn) {
  try {
    await fn();
    results.push({ name, status: "PASS" });
    console.log(`PASS ${name}`);
  } catch (error) {
    results.push({ name, status: "FAIL", detail: error.message });
    console.error(`FAIL ${name}: ${error.message}`);
    throw error;
  }
}
async function mail(email, subject) {
  for (let attempt = 0; attempt < 40; attempt++) {
    const files = await readdir(path.join(dataDir, "mail")).catch(() => []);
    for (const name of files.sort().reverse()) {
      const value = JSON.parse(
        await readFile(path.join(dataDir, "mail", name), "utf8"),
      );
      if (value.to === email && value.subject.includes(subject)) return value;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(
    `Development ${subject} email was not delivered to the local outbox`,
  );
}
const alice = new Client(),
  bob = new Client(),
  anonymous = new Client();
const aliceEmail = `lumen-qa-a-${stamp}@example.test`,
  bobEmail = `lumen-qa-b-${stamp}@example.test`;
let aliceCreated = false,
  bobCreated = false,
  alicePassword = password,
  collection,
  goal,
  note,
  savedPodcast;
let failure;
try {
  await check("Protected library rejects signed-out requests", async () => {
    assert.equal((await anonymous.request("/api/library")).status, 401);
  });
  await check(
    "New registration creates an unverified account and delivers local verification email",
    async () => {
      const response = await alice.request("/api/auth/sign-up/email", "POST", {
        name: "Lumen QA Alice",
        email: aliceEmail,
        password,
        callbackURL: `${origin}/space`,
      });
      assert.equal(response.status, 200, response.text);
      aliceCreated = true;
      assert.equal(response.json.user.emailVerified, false);
      assert.ok(
        (await mail(aliceEmail, "Verify")).url.startsWith(
          `${origin}/api/auth/verify-email?`,
        ),
      );
    },
  );
  await check("Unverified accounts cannot sign in", async () => {
    const response = await alice.request("/api/auth/sign-in/email", "POST", {
      email: aliceEmail,
      password,
    });
    assert.equal(response.status, 403, response.text);
  });
  await check(
    "Verification link activates email and creates a real session",
    async () => {
      const verification = await mail(aliceEmail, "Verify");
      const response = await alice.request(verification.url);
      assert.ok(
        response.status === 302 || response.status === 200,
        response.text,
      );
      const session = await alice.request("/api/auth/get-session");
      assert.equal(session.status, 200);
      assert.equal(session.json.user.emailVerified, true);
      assert.ok(alice.cookies.size > 0);
    },
  );
  await check(
    "Logout invalidates the old session and a wrong password is rejected",
    async () => {
      const stale = new Client();
      stale.cookies = new Map(alice.cookies);
      assert.equal(
        (await alice.request("/api/auth/sign-out", "POST", {})).status,
        200,
      );
      assert.equal((await stale.request("/api/library")).status, 401);
      const wrong = await alice.request("/api/auth/sign-in/email", "POST", {
        email: aliceEmail,
        password: "Definitely-Wrong-1!",
      });
      assert.equal(wrong.status, 401, wrong.text);
    },
  );
  await check(
    "Correct login issues HttpOnly SameSite session cookies",
    async () => {
      const response = await alice.request("/api/auth/sign-in/email", "POST", {
        email: aliceEmail,
        password,
      });
      assert.equal(response.status, 200, response.text);
      const cookies = response.headers.getSetCookie().join(";");
      assert.match(cookies, /HttpOnly/i);
      assert.match(cookies, /SameSite=Lax/i);
      assert.equal((await alice.request("/api/library")).status, 200);
    },
  );
  await check(
    "Search history is off by default and does not record signed-out or new-user searches",
    async () => {
      const anonymousSearch = await anonymous.request(
        "/api/search-history",
        "POST",
        { query: "astronomy" },
      );
      assert.equal(anonymousSearch.status, 200, anonymousSearch.text);
      assert.equal(anonymousSearch.json.recorded, false);
      const privateSearch = await alice.request("/api/search-history", "POST", {
        query: "physics",
      });
      assert.equal(privateSearch.status, 200, privateSearch.text);
      assert.equal(privateSearch.json.recorded, false);
      assert.deepEqual(
        (await alice.request("/api/search-history")).json.history,
        [],
      );
      assert.deepEqual(
        (await alice.request("/api/library")).json.searchHistory,
        [],
      );
    },
  );
  await check(
    "Cross-origin mutations are rejected before changing private data",
    async () => {
      const response = await alice.request(
        "/api/library",
        "POST",
        { entity: "collection", name: "Must not exist" },
        { origin: "https://attacker.example" },
      );
      assert.equal(response.status, 403, response.text);
    },
  );
  await check(
    "Create a collection and persist it across independent requests",
    async () => {
      const response = await alice.request("/api/library", "POST", {
        entity: "collection",
        name: "Night sky study",
        description: "QA collection",
      });
      assert.equal(response.status, 200, response.text);
      collection = response.json.id;
      assert.ok(
        (await alice.request("/api/library")).json.collections.some(
          (item) => item.id === collection && item.name === "Night sky study",
        ),
      );
    },
  );
  await check(
    "Save a real Spotify episode with official metadata and collection membership",
    async () => {
      const url = "https://open.spotify.com/episode/7makk4oTQel546B0PZlDM5";
      const metadata = await anonymous.request(
        `/api/podcasts/metadata?url=${encodeURIComponent(url)}`,
      );
      assert.equal(metadata.status, 200, metadata.text);
      assert.equal(metadata.json.provider, "Spotify");
      assert.equal(
        metadata.json.title,
        "My Path to Spotify: Women in Engineering",
      );
      const response = await alice.request("/api/library", "POST", {
        entity: "podcast",
        url,
        collectionId: collection,
      });
      assert.equal(response.status, 200, response.text);
      savedPodcast = response.json.id;
      const saved = (
        await alice.request("/api/library")
      ).json.savedPodcasts.find((item) => item.id === savedPodcast);
      assert.equal(saved.title, metadata.json.title);
      assert.equal(saved.collectionId, collection);
      assert.equal(saved.kind, "episode");
      assert.equal(saved.spotifyId, "7makk4oTQel546B0PZlDM5");
      assert.equal(saved.url, url);
    },
  );
  await check("Rename a collection", async () => {
    const response = await alice.request("/api/library", "PATCH", {
      entity: "collection",
      id: collection,
      name: "Observatory notes",
    });
    assert.equal(response.status, 200, response.text);
    assert.equal(
      response.json.collections.find((item) => item.id === collection).name,
      "Observatory notes",
    );
    assert.equal(
      response.json.savedPodcasts.find((item) => item.id === savedPodcast)
        .collectionId,
      collection,
    );
  });
  await check("Create and update a learning goal", async () => {
    const response = await alice.request("/api/library", "POST", {
      entity: "goal",
      title: "Understand stellar evolution",
    });
    assert.equal(response.status, 200, response.text);
    goal = response.json.id;
    const updated = await alice.request("/api/library", "PATCH", {
      entity: "goal",
      id: goal,
      title: "Understand the lives of stars",
      completed: true,
    });
    assert.equal(updated.status, 200, updated.text);
    assert.equal(
      updated.json.goals.find((item) => item.id === goal).completed,
      true,
    );
  });
  await check(
    "Create and edit a persistent note with inert HTML text",
    async () => {
      const response = await alice.request("/api/library", "POST", {
        entity: "note",
        title: "Questions",
        body: "How do stars form?",
      });
      assert.equal(response.status, 200, response.text);
      note = response.json.id;
      const updated = await alice.request("/api/library", "PATCH", {
        entity: "note",
        id: note,
        body: "<script>alert(1)</script> is plain note text",
      });
      assert.equal(updated.status, 200, updated.text);
      assert.equal(
        (await alice.request("/api/library")).json.notes.find(
          (item) => item.id === note,
        ).body,
        "<script>alert(1)</script> is plain note text",
      );
    },
  );
  await check("Interest and preference changes persist", async () => {
    assert.equal(
      (
        await alice.request("/api/library", "POST", {
          entity: "interests",
          values: ["astronomy", "physics"],
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await alice.request("/api/library", "PATCH", {
          entity: "preferences",
          values: { theme: "light", focusMode: true, searchHistory: false },
        })
      ).status,
      200,
    );
    const data = (await alice.request("/api/library")).json;
    assert.deepEqual(data.interests, ["astronomy", "physics"]);
    assert.equal(data.preferences.theme, "light");
    assert.equal(data.preferences.searchHistory, false);
  });
  await check("Learning progress is validated and saved", async () => {
    const response = await alice.request("/api/library", "POST", {
      entity: "progress",
      pathId: "a-place-in-the-universe",
      stepIndex: 0,
      completed: true,
    });
    assert.equal(response.status, 200, response.text);
    assert.ok(
      response.json.progress.some(
        (item) =>
          item.pathId === "a-place-in-the-universe" &&
          item.stepIndex === 0 &&
          item.completed,
      ),
    );
    assert.equal(
      (
        await alice.request("/api/library", "POST", {
          entity: "progress",
          pathId: "unknown-path",
          stepIndex: 0,
          completed: true,
        })
      ).status,
      400,
    );
  });
  await check("Invalid Spotify URLs are rejected", async () => {
    const response = await alice.request("/api/library", "POST", {
      entity: "podcast",
      url: "https://attacker.example/show/1234567890123456789012",
    });
    assert.equal(response.status, 400, response.text);
    assert.equal(
      (await alice.request("/api/library")).json.savedPodcasts.length,
      1,
    );
  });
  await check(
    "Second account cannot read, rename or delete another user’s collection",
    async () => {
      const created = await bob.request("/api/auth/sign-up/email", "POST", {
        name: "Lumen QA Bob",
        email: bobEmail,
        password,
        callbackURL: `${origin}/space`,
      });
      assert.equal(created.status, 200, created.text);
      bobCreated = true;
      await bob.request((await mail(bobEmail, "Verify")).url);
      const own = await bob.request("/api/library");
      assert.equal(own.status, 200);
      assert.equal(own.json.collections.length, 0);
      assert.equal(own.json.savedPodcasts.length, 0);
      assert.equal(
        (
          await bob.request("/api/library", "PATCH", {
            entity: "podcast",
            id: savedPodcast,
            collectionId: null,
          })
        ).status,
        404,
      );
      assert.equal(
        (
          await bob.request("/api/library", "PATCH", {
            entity: "collection",
            id: collection,
            name: "Stolen",
          })
        ).status,
        404,
      );
      assert.equal(
        (
          await bob.request("/api/library", "DELETE", {
            entity: "collection",
            id: collection,
          })
        ).status,
        404,
      );
      assert.equal(
        (await alice.request("/api/library")).json.collections.find(
          (item) => item.id === collection,
        ).name,
        "Observatory notes",
      );
    },
  );
  await check(
    "Opted-in search history persists privately and is isolated between accounts",
    async () => {
      assert.equal(
        (
          await alice.request("/api/library", "PATCH", {
            entity: "preferences",
            values: { searchHistory: true },
          })
        ).status,
        200,
      );
      const recorded = await alice.request("/api/search-history", "POST", {
        query: "stellar evolution",
      });
      assert.equal(recorded.status, 200, recorded.text);
      assert.equal(recorded.json.recorded, true);
      assert.equal(
        (await alice.request("/api/search-history")).json.history[0].query,
        "stellar evolution",
      );
      assert.equal(
        (await alice.request("/api/library")).json.searchHistory[0].query,
        "stellar evolution",
      );
      assert.deepEqual(
        (await bob.request("/api/search-history")).json.history,
        [],
      );
      assert.deepEqual(
        (await bob.request("/api/library")).json.searchHistory,
        [],
      );
    },
  );
  await check(
    "Data export includes only the authenticated profile and learning records",
    async () => {
      const response = await alice.request("/api/account/export");
      assert.equal(response.status, 200, response.text);
      assert.equal(response.json.profile.email, aliceEmail);
      assert.equal(response.json.library.collections.length, 1);
      assert.ok(!("password" in response.json.profile));
      assert.equal(
        response.json.library.searchHistory[0].query,
        "stellar evolution",
      );
      assert.equal(response.json.library.savedPodcasts[0].id, savedPodcast);
      assert.ok(!("session" in response.json));
      assert.match(response.headers.get("content-disposition"), /attachment/);
    },
  );
  await check(
    "Disabling search history erases existing records and stops further recording",
    async () => {
      const disabled = await alice.request("/api/library", "PATCH", {
        entity: "preferences",
        values: { searchHistory: false },
      });
      assert.equal(disabled.status, 200, disabled.text);
      assert.deepEqual(disabled.json.searchHistory, []);
      assert.deepEqual(
        (await alice.request("/api/search-history")).json.history,
        [],
      );
      const ignored = await alice.request("/api/search-history", "POST", {
        query: "cosmology",
      });
      assert.equal(ignored.status, 200, ignored.text);
      assert.equal(ignored.json.recorded, false);
      assert.deepEqual(
        (await alice.request("/api/account/export")).json.library.searchHistory,
        [],
      );
    },
  );
  await check(
    "Explicit history deletion clears only the authenticated user’s records",
    async () => {
      assert.equal(
        (
          await alice.request("/api/library", "PATCH", {
            entity: "preferences",
            values: { searchHistory: true },
          })
        ).status,
        200,
      );
      assert.equal(
        (
          await alice.request("/api/search-history", "POST", {
            query: "astronomy",
          })
        ).json.recorded,
        true,
      );
      assert.equal(
        (await bob.request("/api/search-history", "DELETE", {})).status,
        200,
      );
      assert.equal(
        (await alice.request("/api/search-history")).json.history.length,
        1,
      );
      assert.equal(
        (await alice.request("/api/search-history", "DELETE", {})).status,
        200,
      );
      assert.deepEqual(
        (await alice.request("/api/search-history")).json.history,
        [],
      );
      assert.equal(
        (
          await alice.request("/api/library", "PATCH", {
            entity: "preferences",
            values: { searchHistory: false },
          })
        ).status,
        200,
      );
    },
  );
  await check("Delete collection removes persisted record", async () => {
    const response = await alice.request("/api/library", "DELETE", {
      entity: "collection",
      id: collection,
    });
    assert.equal(response.status, 200, response.text);
    const persisted = (await alice.request("/api/library")).json;
    assert.equal(persisted.collections.length, 0);
    assert.equal(
      persisted.savedPodcasts.find((item) => item.id === savedPodcast)
        .collectionId,
      null,
      "Deleting a collection preserves saved podcasts without stale membership",
    );
  });
  await check(
    "Delete a saved podcast removes the private persisted record",
    async () => {
      const response = await alice.request("/api/library", "DELETE", {
        entity: "podcast",
        id: savedPodcast,
      });
      assert.equal(response.status, 200, response.text);
      assert.deepEqual(
        (await alice.request("/api/library")).json.savedPodcasts,
        [],
      );
    },
  );
  await check(
    "Password recovery delivers a real reset link and revokes previous sessions",
    async () => {
      const response = await anonymous.request(
        "/api/auth/request-password-reset",
        "POST",
        { email: aliceEmail, redirectTo: `${origin}/reset-password` },
      );
      assert.equal(response.status, 200, response.text);
      const recovery = await mail(aliceEmail, "Reset");
      const landing = await anonymous.request(recovery.url);
      assert.ok(landing.status === 302 || landing.status === 200, landing.text);
      const destination = landing.headers.get("location");
      assert.ok(destination, "Reset link redirects to the password form");
      const token = new URL(destination, origin).searchParams.get("token");
      assert.ok(token);
      const reset = await anonymous.request(
        "/api/auth/reset-password",
        "POST",
        { token, newPassword: changedPassword },
      );
      assert.equal(reset.status, 200, reset.text);
      alicePassword = changedPassword;
      assert.equal(
        (await alice.request("/api/library")).status,
        401,
        "Existing session must be revoked",
      );
      const login = await alice.request("/api/auth/sign-in/email", "POST", {
        email: aliceEmail,
        password: changedPassword,
      });
      assert.equal(login.status, 200, login.text);
      assert.ok(
        (await alice.request("/api/library")).json.goals.some(
          (item) => item.id === goal && item.completed,
        ),
      );
    },
  );
  await check("Account deletion rejects the wrong password", async () => {
    const response = await alice.request("/api/account", "DELETE", {
      password: "Definitely-Wrong-1!",
    });
    assert.equal(response.status, 400, response.text);
    assert.equal((await alice.request("/api/library")).status, 200);
  });
  await check(
    "Account deletion removes access and invalidates existing session",
    async () => {
      const stale = new Client();
      stale.cookies = new Map(alice.cookies);
      const response = await alice.request("/api/account", "DELETE", {
        password: alicePassword,
      });
      assert.equal(response.status, 200, response.text);
      aliceCreated = false;
      assert.equal((await stale.request("/api/library")).status, 401);
    },
  );
} catch (error) {
  failure = error;
} finally {
  for (const [client, created, pw] of [
    [alice, aliceCreated, alicePassword],
    [bob, bobCreated, password],
  ]) {
    if (created) {
      const result = await client
        .request("/api/account", "DELETE", { password: pw })
        .catch((error) => ({ status: "network failure", text: error.message }));
      if (result.status !== 200)
        console.error(
          "Test account cleanup failed",
          result.status,
          result.text,
        );
    }
  }
  const report = `# Backend integration test results\n\nExecuted: ${new Date().toISOString()}\n\nCommand: \`node tests/backend-flow.mjs\` against ${base}.\n\nUses real HTTP routes, Better Auth, local email outbox and persistent PostgreSQL; temporary accounts are deleted at the end.\n\n${results.map((result) => `- ${result.status}: ${result.name}${result.detail ? ` — ${result.detail}` : ""}`).join("\n")}\n\nNot covered by this run: time-based session expiry, delivered external email, external Spotify playback, production PostgreSQL/TLS and multi-instance rate limits.\n`;
  await mkdir("docs", { recursive: true });
  await writeFile("docs/BACKEND-TEST-RESULTS.md", report);
}
if (failure) process.exitCode = 1;
