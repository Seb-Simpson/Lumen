import { loadEnvConfig } from "@next/env";
import { getDb, closeDb } from "../src/lib/db";
loadEnvConfig(process.cwd());
await getDb();
console.log(
  "Editorial learning journeys from src/lib/catalog.ts are synchronised to PostgreSQL. No videos, users, channels or engagement metrics are seeded.",
);
await closeDb();
