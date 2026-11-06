import { PGlite } from "@electric-sql/pglite";
import { drizzle as embeddedDrizzle } from "drizzle-orm/pglite";
import { drizzle as postgresDrizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { sql } from "drizzle-orm";
import { readFile, readdir, mkdir } from "node:fs/promises";
import path from "node:path";
import * as schema from "./schema";
import { paths } from "./catalog";

type Database = ReturnType<typeof embeddedDrizzle<typeof schema>>;
const globalDb = globalThis as unknown as {
  lumenDb?: Promise<Database>;
  lumenPool?: Pool;
  lumenPglite?: PGlite;
};
export function getDb(): Promise<Database> {
  if (!globalDb.lumenDb) globalDb.lumenDb = initialise();
  return globalDb.lumenDb;
}
async function initialise(): Promise<Database> {
  let db: Database;
  const building = process.env.NEXT_PHASE === "phase-production-build";
  if (process.env.DATABASE_URL) {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
    });
    globalDb.lumenPool = pool;
    db = postgresDrizzle(pool, { schema }) as unknown as Database;
  } else {
    if (process.env.NODE_ENV === "production" && !building)
      throw new Error("DATABASE_URL is required in production.");
    const folder =
      process.env.LUMEN_DATA_DIR || path.join(process.cwd(), ".data");
    if (!building) await mkdir(folder, { recursive: true, mode: 0o700 });
    const pg = new PGlite(
      building ? "memory://" : path.join(folder, "postgres"),
    );
    globalDb.lumenPglite = pg;
    db = embeddedDrizzle(pg, { schema });
  }
  // Checked-in, ledger-tracked SQL migrations support embedded and external PostgreSQL.
  // Production operators should run npm run db:migrate before accepting traffic.
  const directory = path.join(process.cwd(), "drizzle");
  const files = (await readdir(directory))
    .filter((file) => /^\d+.*\.sql$/.test(file))
    .sort();
  await db.transaction(async (tx) => {
    if (process.env.DATABASE_URL)
      await tx.execute(sql`select pg_advisory_xact_lock(81281961)`);
    await tx.execute(
      sql`CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY,applied_at timestamp NOT NULL DEFAULT now())`,
    );
    for (const file of files) {
      const version = file.replace(/\.sql$/, "");
      const applied = await tx.execute(
        sql`select version from schema_migrations where version=${version}`,
      );
      if (applied.rows.length) continue;
      const migration = await readFile(path.join(directory, file), "utf8");
      for (const statement of migration
        .split(";")
        .map((value) => value.trim())
        .filter(Boolean))
        await tx.execute(sql.raw(statement));
      await tx.execute(
        sql`INSERT INTO schema_migrations(version) VALUES(${version}) ON CONFLICT DO NOTHING`,
      );
    }
  });
  for (const journey of paths) {
    await db
      .insert(schema.learningPaths)
      .values({
        id: journey.slug,
        slug: journey.slug,
        title: journey.title,
        description: journey.description,
        subject: journey.subject,
        level: journey.level,
        published: true,
      })
      .onConflictDoUpdate({
        target: schema.learningPaths.id,
        set: {
          title: journey.title,
          description: journey.description,
          subject: journey.subject,
          level: journey.level,
          published: true,
        },
      });
    for (const [position, step] of journey.steps.entries()) {
      await db
        .insert(schema.pathSteps)
        .values({
          id: `${journey.slug}:${position}`,
          pathId: journey.slug,
          position,
          title: step.title,
          description: step.description,
          subjectSlug: journey.subject,
        })
        .onConflictDoUpdate({
          target: schema.pathSteps.id,
          set: { title: step.title, description: step.description, position },
        });
    }
  }
  return db;
}
export async function closeDb() {
  if (globalDb.lumenPool) await globalDb.lumenPool.end();
  if (globalDb.lumenPglite) await globalDb.lumenPglite.close();
  delete globalDb.lumenDb;
}
