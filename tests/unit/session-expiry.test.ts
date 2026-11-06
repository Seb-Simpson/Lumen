import { test, expect, vi } from "vitest";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { eq } from "drizzle-orm";

/** Runs against an isolated real PostgreSQL database, never the running app's data. */
test("Better Auth refuses a database-expired session even with its original signed cookie", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "lumen-expiry-"));
  const isolatedKeys = [
    "DATABASE_URL",
    "LUMEN_DATA_DIR",
    "BETTER_AUTH_URL",
    "BETTER_AUTH_SECRET",
    "RESEND_API_KEY",
    "EMAIL_FROM",
    "NEXT_PHASE",
    "NODE_ENV",
  ] as const;
  for (const key of isolatedKeys) vi.stubEnv(key, undefined);
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3000");
  vi.stubEnv("LUMEN_DATA_DIR", directory);
  const { getAuth } = await import("../../src/lib/auth");
  const { getDb, closeDb } = await import("../../src/lib/db");
  const { session } = await import("../../src/lib/schema");
  try {
    const auth = await getAuth();
    const post = (endpoint: string, body: unknown) =>
      auth.handler(
        new Request(`http://localhost:3000/api/auth/${endpoint}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Origin: "http://localhost:3000",
          },
          body: JSON.stringify(body),
        }),
      );
    const registered = await post("sign-up/email", {
      name: "Expiry Test",
      email: "expiry@example.test",
      password: "Expiry-test-password-471!",
    });
    expect(registered.status).toBe(200);
    const outbox = path.join(directory, "mail");
    const [file] = await readdir(outbox);
    const mail = JSON.parse(
      await readFile(path.join(outbox, file), "utf8"),
    ) as { url: string };
    const verified = await auth.handler(new Request(mail.url));
    expect(verified.status).toBe(302);
    const cookie = verified.headers
      .getSetCookie()
      .map((value) => value.split(";")[0])
      .join("; ");
    expect(cookie).toContain("session_token=");
    const get = () =>
      auth.handler(
        new Request("http://localhost:3000/api/auth/get-session", {
          headers: { Cookie: cookie },
        }),
      );
    const current = await (await get()).json();
    expect(current.user.email).toBe("expiry@example.test");
    const db = await getDb();
    await db
      .update(session)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(session.userId, current.user.id));
    const expired = await get();
    expect(expired.status).toBe(200);
    expect(await expired.json()).toBeNull();
  } finally {
    await closeDb();
    vi.unstubAllEnvs();
    await rm(directory, { recursive: true, force: true });
  }
}, 20000);
