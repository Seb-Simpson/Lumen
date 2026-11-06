import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
import { previewOrigin } from "./preview-origin.mjs";

/** Read an explicitly selected recipient's local mailbox. Never served over HTTP.
 * @param {string} email
 * @param {string} directory
 */
export async function latestDevelopmentMail(email, directory) {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error(
      "Use npm run mail -- your@email.example after registering or requesting recovery.",
    );
  let files;
  try {
    files = await readdir(directory);
  } catch (error) {
    if (error.code === "ENOENT")
      throw new Error(
        "No local email has been written yet. Register, resend verification, or request recovery first.",
      );
    throw error;
  }
  const messages = [];
  for (const filename of files.filter((name) =>
    /^\d+-[a-f0-9]+\.json$/.test(name),
  )) {
    try {
      const message = JSON.parse(
        await readFile(path.join(directory, filename), "utf8"),
      );
      if (
        typeof message.to !== "string" ||
        message.to.toLowerCase() !== email.toLowerCase() ||
        typeof message.subject !== "string" ||
        typeof message.url !== "string"
      )
        continue;
      const url = new URL(message.url);
      if (
        !["http:", "https:"].includes(url.protocol) ||
        url.username ||
        url.password
      )
        continue;
      messages.push({
        to: message.to,
        subject: message.subject,
        url: url.href,
        sentAt: message.sentAt,
        timestamp: Number(filename.split("-")[0]),
      });
    } catch {
      /* An incomplete or unrelated file must not hide a genuine message. */
    }
  }
  messages.sort((a, b) => b.timestamp - a.timestamp);
  if (!messages[0])
    throw new Error(
      "No local message matches that email. Check the address and request a fresh verification or recovery message.",
    );
  return messages[0];
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
) {
  try {
    loadEnvConfig(process.cwd(), true);
    if (process.env.NODE_ENV === "production")
      throw new Error(
        "This command is for the private development mailbox. Production email is delivered through the configured provider.",
      );
    const email = process.argv[2];
    if (process.argv.length !== 3)
      throw new Error("Usage: npm run mail -- your@email.example");
    const directory = path.join(
      process.env.LUMEN_DATA_DIR || path.join(process.cwd(), ".data"),
      "mail",
    );
    const message = await latestDevelopmentMail(email, directory);
    const origin = previewOrigin();
    if (new URL(message.url).origin !== origin) {
      throw new Error(
        "This message uses an older preview address. Restart Lumen, then request a fresh verification or recovery email from the current preview.",
      );
    }
    console.log("Private development email — do not share this link.");
    console.log(`To: ${message.to}\n${message.subject}\n${message.url}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
