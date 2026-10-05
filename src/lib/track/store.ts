/**
 * A tiny key/value abstraction over the track cache.
 *
 * Production binds an R2 bucket; local `astro dev` uses a filesystem store so
 * the API can run without Wrangler; tests use an in-memory store. The API never
 * cares which one it is given.
 */

export interface TrackStore {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

/** The subset of the R2 binding the API relies on. */
export interface R2LikeBucket {
  get(key: string): Promise<{ text(): Promise<string> } | null>;
  put(
    key: string,
    value: string,
    options?: { httpMetadata?: { contentType?: string } },
  ): Promise<unknown>;
}

export function r2Store(bucket: R2LikeBucket | undefined): TrackStore {
  return {
    async get(key) {
      if (!bucket) return null;
      const object = await bucket.get(key);
      if (!object) return null;
      try {
        return await object.text();
      } catch {
        return null;
      }
    },
    async put(key, value) {
      if (!bucket) return;
      await bucket.put(key, value, {
        httpMetadata: { contentType: "application/json; charset=utf-8" },
      });
    },
  };
}

/** In-memory store, used by unit tests. */
export function memoryStore(initial: Record<string, string> = {}): TrackStore {
  const map = new Map(Object.entries(initial));
  return {
    async get(key) {
      return map.has(key) ? (map.get(key) as string) : null;
    },
    async put(key, value) {
      map.set(key, value);
    },
  };
}
