import { test, expect, vi } from "vitest";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { eq } from "drizzle-orm";

/** Real auth provider and PostgreSQL, isolated from every running preview/account. */
test("Codespaces auth pins the HTTPS origin, rejects callback attacks and keeps a Secure session through verification/recovery", async () => {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), "lumen-forwarded-auth-"),
  );
  const origin = "https://lumen-preview-3000.app.github.dev";
  for (const key of [
    "DATABASE_URL",
    "BETTER_AUTH_SECRET",
    "RESEND_API_KEY",
    "EMAIL_FROM",
    "NEXT_PHASE",
  ])
    vi.stubEnv(key, undefined);
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("LUMEN_DATA_DIR", directory);
  vi.stubEnv("CODESPACES", "true");
  vi.stubEnv("CODESPACE_NAME", "lumen-preview");
  vi.stubEnv("GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN", "app.github.dev");
  vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3000");
  const { getAuth } = await import("../../src/lib/auth");
  const { getDb, closeDb } = await import("../../src/lib/db");
  const { user } = await import("../../src/lib/schema");
  const email = "forwarded@example.test";
  const password = "A careful preview password 2026!";
  const mailbox = path.join(directory, "mail");
  async function messages() {
    const files = await readdir(mailbox).catch(() => []);
    return Promise.all(
      files
        .sort()
        .map(
          async (file) =>
            JSON.parse(await readFile(path.join(mailbox, file), "utf8")) as {
              url: string;
              subject: string;
            },
        ),
    );
  }
  try {
    const auth = await getAuth();
    const post = (endpoint: string, body: unknown, cookie = "") =>
      auth.handler(
        new Request(`http://127.0.0.1:3000/api/auth/${endpoint}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Origin: origin,
            "x-forwarded-host": "evil.example",
            "x-forwarded-proto": "http",
            ...(cookie ? { Cookie: cookie } : {}),
          },
          body: JSON.stringify(body),
        }),
      );
    const credentials = { name: "Forwarded learner", email, password };
    const rejected = await post("sign-up/email", {
      ...credentials,
      callbackURL: "https://evil.example/steal",
    });
    expect(rejected.status).toBe(403);
    expect(await messages()).toHaveLength(0);
    const registered = await post("sign-up/email", {
      ...credentials,
      callbackURL: origin + "/space",
    });
    expect(registered.status).toBe(200);
    const verification = (await messages())[0];
    expect(new URL(verification.url).origin).toBe(origin);
    expect(new URL(verification.url).searchParams.get("callbackURL")).toBe(
      origin + "/space",
    );
    for (const callback of [
      "https://evil.example/steal",
      "https://lumen-preview-3000.app.github.dev.evil.example/space",
      "http://lumen-preview-3000.app.github.dev/space",
      origin + ":8443/space",
      "//evil.example/steal",
    ]) {
      const tampered = new URL(verification.url);
      tampered.searchParams.set("callbackURL", callback);
      const response = await auth.handler(new Request(tampered));
      expect(response.status).toBe(403);
      expect(response.headers.getSetCookie()).toHaveLength(0);
    }
    const db = await getDb();
    const [unverified] = await db
      .select({ verified: user.emailVerified })
      .from(user)
      .where(eq(user.email, email));
    expect(unverified.verified).toBe(false);
    const verified = await auth.handler(new Request(verification.url));
    expect(verified.status).toBe(302);
    expect(verified.headers.get("location")).toBe(origin + "/space");
    const sessionCookie = verified.headers
      .getSetCookie()
      .find((cookie) =>
        cookie.startsWith("__Secure-better-auth.session_token="),
      );
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie).toMatch(/; Secure/i);
    expect(sessionCookie).toMatch(/; HttpOnly/i);
    expect(sessionCookie).toMatch(/SameSite=Lax/i);
    expect(sessionCookie).not.toMatch(/; Domain=/i);
    const cookie = verified.headers
      .getSetCookie()
      .map((value) => value.split(";")[0])
      .join("; ");
    const getSession = () =>
      auth.handler(
        new Request("http://127.0.0.1:3000/api/auth/get-session", {
          headers: { Cookie: cookie },
        }),
      );
    expect((await (await getSession()).json()).user.emailVerified).toBe(true);
    const unsafeReset = await post("request-password-reset", {
      email,
      redirectTo: "https://evil.example/reset",
    });
    expect(unsafeReset.status).toBe(403);
    expect(await messages()).toHaveLength(1);
    const reset = await post("request-password-reset", {
      email,
      redirectTo: origin + "/reset-password",
    });
    expect(reset.status).toBe(200);
    const resetMail = (await messages()).find((message) =>
      message.subject.includes("Reset"),
    )!;
    expect(new URL(resetMail.url).origin).toBe(origin);
    const tampered = new URL(resetMail.url);
    tampered.searchParams.set("callbackURL", "https://evil.example/reset");
    const badReset = await auth.handler(new Request(tampered));
    expect(badReset.status).toBe(403);
    expect(badReset.headers.get("location")).toBeNull();
    const callback = await auth.handler(new Request(resetMail.url));
    expect(callback.status).toBe(302);
    const target = new URL(callback.headers.get("location")!);
    expect(target.origin).toBe(origin);
    expect(target.pathname).toBe("/reset-password");
    const completed = await post("reset-password", {
      token: target.searchParams.get("token"),
      newPassword: password + "changed",
    });
    expect(completed.status).toBe(200);
    expect(await (await getSession()).json()).toBeNull();
    const loggedIn = await post("sign-in/email", {
      email,
      password: password + "changed",
    });
    expect(loggedIn.status).toBe(200);
    const newCookie = loggedIn.headers
      .getSetCookie()
      .map((value) => value.split(";")[0])
      .join("; ");
    const loggedOut = await post("sign-out", {}, newCookie);
    expect(loggedOut.status).toBe(200);
    const afterLogout = await auth.handler(
      new Request("http://127.0.0.1:3000/api/auth/get-session", {
        headers: { Cookie: newCookie },
      }),
    );
    expect(await afterLogout.json()).toBeNull();
  } finally {
    await closeDb();
    vi.unstubAllEnvs();
    await rm(directory, { recursive: true, force: true });
  }
}, 20000);
