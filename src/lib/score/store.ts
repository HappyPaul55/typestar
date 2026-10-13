/**
 * The SQL surface the score API runs on.
 *
 * Both Cloudflare D1 and the dev/test `node:sqlite` database speak SQL, so the
 * API is written once against this tiny interface and the two runtimes provide
 * an implementation. Keeping it to three methods means there is no query
 * builder to diverge between environments.
 */

export interface SqlStore {
  all<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
  first<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T | null>;
  run(sql: string, params?: unknown[]): Promise<void>;
}

/** The subset of a D1 prepared statement the store uses. */
export interface D1StatementLike {
  bind(...values: unknown[]): D1StatementLike;
  all<T = Record<string, unknown>>(): Promise<{ results?: T[] }>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<unknown>;
}

/** The subset of a D1 binding the store uses. */
export interface D1DatabaseLike {
  prepare(query: string): D1StatementLike;
}

/** A {@link SqlStore} over a Cloudflare D1 binding. */
export function d1SqlStore(db: D1DatabaseLike): SqlStore {
  return {
    async all<T>(sql: string, params: unknown[] = []): Promise<T[]> {
      const result = await db.prepare(sql).bind(...params).all<T>();
      return result.results ?? [];
    },
    async first<T>(sql: string, params: unknown[] = []): Promise<T | null> {
      return db.prepare(sql).bind(...params).first<T>();
    },
    async run(sql: string, params: unknown[] = []): Promise<void> {
      await db.prepare(sql).bind(...params).run();
    },
  };
}
