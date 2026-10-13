/**
 * Dev-only score store: a {@link SqlStore} over `node:sqlite`.
 *
 * `astro dev` has no D1, so the score API runs against a local SQLite database.
 * It lives in the same file as the dev auth database, so the `userId` foreign
 * key resolves (production D1 cascades on account deletion).
 *
 * Imported only by the dev server and the tests; never part of the Worker.
 */

import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import type { SqlStore } from "./store";

interface StatementLike {
  all(...params: unknown[]): unknown[];
  get(...params: unknown[]): unknown;
  run(...params: unknown[]): unknown;
}

interface DatabaseLike {
  prepare(sql: string): StatementLike;
  exec(sql: string): void;
}

/** The score migrations, applied to the dev database on open, in order. */
const MIGRATIONS = ["0002_scores.sql", "0003_challenge.sql"];

/** The score schema, applied to the dev database on open. */
const SCHEMA = MIGRATIONS.map((file) =>
  readFileSync(new URL(`../../../migrations/${file}`, import.meta.url), "utf8"),
).join("\n");

/** Open (or create) a SQLite database at `file` and ensure the score schema. */
export function createDevScoreStore(file: string): SqlStore {
  const db = new DatabaseSync(file) as unknown as DatabaseLike;
  db.exec(SCHEMA);
  return {
    async all<T>(sql: string, params: unknown[] = []): Promise<T[]> {
      return db.prepare(sql).all(...params) as T[];
    },
    async first<T>(sql: string, params: unknown[] = []): Promise<T | null> {
      return (db.prepare(sql).get(...params) ?? null) as T | null;
    },
    async run(sql: string, params: unknown[] = []): Promise<void> {
      db.prepare(sql).run(...params);
    },
  };
}
