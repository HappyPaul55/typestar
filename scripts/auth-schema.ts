/**
 * CLI-only Better Auth configuration, used by `bunx auth generate` to emit the
 * SQL schema into `migrations/`.
 *
 * The real instance talks to Cloudflare D1, which the CLI cannot reach. Better
 * Auth's `generate` command only supports a Kysely adapter, so this file hands
 * it an in-memory `node:sqlite` database through Better Auth's own
 * `NodeSqliteDialect`. The schema is built from the auth options; the database
 * starts empty, so every table is reported as new.
 *
 * Regenerate after changing `src/lib/auth/server.ts` (a new field or plugin):
 *
 *   bun run auth:schema
 */

import { Kysely } from "kysely";
import { NodeSqliteDialect } from "@better-auth/kysely-adapter/node-sqlite-dialect";
import { DatabaseSync } from "node:sqlite";
import { createAuth } from "../src/lib/auth/server";

export const auth = createAuth({
  database: {
    db: new Kysely({
      dialect: new NodeSqliteDialect({ database: new DatabaseSync(":memory:") }),
    }),
    type: "sqlite",
  },
  secret: "cli-schema-generation-placeholder-secret-0000",
});
