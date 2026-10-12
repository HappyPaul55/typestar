/**
 * Dev-only auth database.
 *
 * `astro dev` runs without Wrangler or D1, so local sign-in uses a file-backed
 * SQLite database through Better Auth's own Kysely `NodeSqliteDialect` (which
 * speaks `node:sqlite`). The file lives in `.cache/`, so a session survives a
 * hot reload instead of being lost with every change.
 *
 * This module is imported only by the dev server in `astro.config.mjs`; it is
 * never part of the Worker or the browser bundle.
 */

import { Kysely } from "kysely";
import { NodeSqliteDialect } from "@better-auth/kysely-adapter/node-sqlite-dialect";
import { DatabaseSync } from "node:sqlite";
import { getMigrations } from "better-auth/db/migration";
import type { BetterAuthOptions } from "better-auth";

/** Open (or create) the local auth database at `file`. */
export function createDevDatabase(file: string): Kysely<unknown> {
  return new Kysely({
    dialect: new NodeSqliteDialect({ database: new DatabaseSync(file) }),
  });
}

/**
 * Create any missing Better Auth tables in the dev database. Better Auth owns
 * the schema, so the migration is generated from the auth options rather than
 * hand-written; production applies the committed SQL with Wrangler instead.
 */
export async function migrateDevAuth(options: BetterAuthOptions): Promise<void> {
  const { runMigrations } = await getMigrations(options);
  await runMigrations();
}
