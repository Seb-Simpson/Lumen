import { fileURLToPath } from "node:url";
import path from "node:path";
import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
import { previewOrigin } from "../src/lib/app-origin.mjs";
export { previewOrigin } from "../src/lib/app-origin.mjs";

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
) {
  try {
    loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");
    process.stdout.write(previewOrigin() + "\n");
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
