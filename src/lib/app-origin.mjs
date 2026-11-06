/** GitHub supplies these values; no public wildcard origins are trusted.
 * @param {Record<string, string | undefined>} env
 */
export function previewOrigin(env = process.env) {
  let value = env.BETTER_AUTH_URL || "http://localhost:3000";
  if (env.CODESPACES === "true" && env.NODE_ENV !== "production") {
    const name = env.CODESPACE_NAME || "";
    const domain =
      env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN || "app.github.dev";
    if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(name) || name.length > 58)
      throw new Error("GitHub must provide a valid CODESPACE_NAME.");
    if (
      !/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}$/i.test(domain) ||
      domain.length > 190
    )
      throw new Error("GitHub must provide its port-forwarding domain.");
    value = `https://${name}-3000.${domain}`;
  }
  const url = new URL(value);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new Error(
      "The preview address must be an HTTP(S) origin without credentials or a path.",
    );
  return url.origin;
}
