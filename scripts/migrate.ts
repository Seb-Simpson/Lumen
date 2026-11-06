import { loadEnvConfig } from "@next/env";
import { getDb, closeDb } from "../src/lib/db";
loadEnvConfig(process.cwd());
await getDb();
console.log("Lumen PostgreSQL schema is ready.");
await closeDb();
