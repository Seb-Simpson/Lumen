import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { getTableConfig } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import * as schema from "../src/lib/schema";
const directory = await mkdtemp(path.join(os.tmpdir(), "lumen-schema-"));
// This review must never connect to an inherited production database.
delete process.env.DATABASE_URL;
process.env.LUMEN_DATA_DIR = directory;
const { getDb, closeDb } = await import("../src/lib/db");
let mismatches = 0;
try {
  const db = await getDb();
  for (const table of Object.values(schema)) {
    const definition = getTableConfig(table);
    const columns = (
      await db.execute(
        sql`select column_name,is_nullable,data_type from information_schema.columns where table_schema='public' and table_name=${definition.name}`,
      )
    ).rows;
    const actualNames = new Set(columns.map((column) => column.column_name));
    for (const column of definition.columns) {
      const actual = columns.find((value) => value.column_name === column.name);
      if (!actual) {
        console.error(`Missing ${definition.name}.${column.name}`);
        mismatches++;
        continue;
      }
      if (column.notNull !== (actual.is_nullable === "NO")) {
        console.error(`Nullability mismatch ${definition.name}.${column.name}`);
        mismatches++;
      }
      actualNames.delete(column.name);
    }
    if (actualNames.size) {
      console.error(
        `Unexpected columns ${definition.name}: ${Array.from(actualNames).join(",")}`,
      );
      mismatches++;
    }
  }
  console.log(
    `Reviewed ${Object.keys(schema).length} PostgreSQL models against actual migrations: ${mismatches} column/nullability mismatches.`,
  );
  if (mismatches) process.exitCode = 1;
} finally {
  await closeDb();
  await rm(directory, { recursive: true, force: true });
}
