/** Fail closed before connecting the database when deployment auth is incomplete. */
export function validateAuthConfiguration(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const production =
    env.NODE_ENV === "production" &&
    env.NEXT_PHASE !== "phase-production-build";
  if (production && !env.BETTER_AUTH_URL)
    throw new Error("BETTER_AUTH_URL is required in production.");
  let url: URL;
  try {
    url = new URL(env.BETTER_AUTH_URL || "http://localhost:3000");
  } catch {
    throw new Error("BETTER_AUTH_URL must be a valid application origin.");
  }
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new Error(
      "BETTER_AUTH_URL must be an HTTP(S) origin without credentials, path, query or fragment.",
    );
  if (production && url.protocol !== "https:")
    throw new Error("BETTER_AUTH_URL must use HTTPS in production.");
  if (production && (!env.RESEND_API_KEY?.trim() || !env.EMAIL_FROM?.trim()))
    throw new Error(
      "RESEND_API_KEY and EMAIL_FROM are required for production verification and recovery email.",
    );
  return url.origin;
}
