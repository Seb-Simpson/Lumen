import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "./db";
import { validateAuthConfiguration } from "./auth-config";
import * as schema from "./schema";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

async function secret() {
  if (process.env.BETTER_AUTH_SECRET) {
    if (process.env.BETTER_AUTH_SECRET.length < 32)
      throw new Error(
        "BETTER_AUTH_SECRET must contain at least 32 characters.",
      );
    return process.env.BETTER_AUTH_SECRET;
  }
  if (
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PHASE !== "phase-production-build"
  )
    throw new Error("BETTER_AUTH_SECRET is required in production.");
  if (process.env.NEXT_PHASE === "phase-production-build")
    return "build-only-not-used-for-production-sessions-000000000";
  const folder =
    process.env.LUMEN_DATA_DIR || path.join(process.cwd(), ".data");
  await mkdir(folder, { recursive: true, mode: 0o700 });
  const file = path.join(folder, "auth-secret");
  try {
    return await readFile(file, "utf8");
  } catch {
    const value = randomBytes(48).toString("base64url");
    await writeFile(file, value, { mode: 0o600, flag: "wx" }).catch(() => {});
    return readFile(file, "utf8");
  }
}
async function sendMail(email: string, subject: string, url: string) {
  if (process.env.RESEND_API_KEY && process.env.EMAIL_FROM) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: email,
        subject,
        text: `${subject}\n\n${url}\n\nIf you did not request this, you can ignore this email.`,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error("Email delivery failed.");
    return;
  }
  if (process.env.NODE_ENV === "production")
    throw new Error("Email provider is not configured.");
  const folder = path.join(
    process.env.LUMEN_DATA_DIR || path.join(process.cwd(), ".data"),
    "mail",
  );
  await mkdir(folder, { recursive: true, mode: 0o700 });
  await writeFile(
    path.join(folder, `${Date.now()}-${randomBytes(6).toString("hex")}.json`),
    JSON.stringify(
      { to: email, subject, url, sentAt: new Date().toISOString() },
      null,
      2,
    ),
    { mode: 0o600 },
  );
}
type AuthInstance = Awaited<ReturnType<typeof initialiseAuth>>;
const authGlobal = globalThis as unknown as {
  lumenAuth?: Promise<AuthInstance>;
};
export function getAuth(): Promise<AuthInstance> {
  if (!authGlobal.lumenAuth) authGlobal.lumenAuth = initialiseAuth();
  return authGlobal.lumenAuth;
}
async function initialiseAuth() {
  const baseURL = validateAuthConfiguration();
  const database = await getDb();
  return betterAuth({
    appName: "Lumen",
    baseURL,
    secret: await secret(),
    database: drizzleAdapter(database, { provider: "pg", schema }),
    trustedOrigins: [baseURL],
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 10,
      maxPasswordLength: 128,
      requireEmailVerification: true,
      sendResetPassword: async ({ user, url }) =>
        sendMail(user.email, "Reset your Lumen password", url),
      resetPasswordTokenExpiresIn: 3600,
      revokeSessionsOnPasswordReset: true,
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
      expiresIn: 3600,
      sendVerificationEmail: async ({ user, url }) =>
        sendMail(user.email, "Verify your Lumen email", url),
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: { enabled: false },
    },
    user: { deleteUser: { enabled: true } },
    advanced: {
      useSecureCookies: process.env.NODE_ENV === "production",
      defaultCookieAttributes: { httpOnly: true, sameSite: "lax" },
    },
    rateLimit: {
      enabled: true,
      window: 60,
      max: 30,
      storage: "memory",
      customRules: {
        "/get-session": { window: 60, max: 180 },
        "/sign-in/email": { window: 60, max: 8 },
        "/sign-up/email": { window: 60, max: 5 },
        "/request-password-reset": { window: 60, max: 3 },
      },
    },
    logger: { level: "error" },
  });
}
