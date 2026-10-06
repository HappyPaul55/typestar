import { describe, expect, test } from "bun:test";
import { memoryStore, r2Store, type R2LikeBucket } from "./store";

describe("memoryStore", () => {
  test("gets, puts and misses", async () => {
    const store = memoryStore({ a: "1" });
    expect(await store.get("a")).toBe("1");
    expect(await store.get("b")).toBeNull();
    await store.put("b", "2");
    expect(await store.get("b")).toBe("2");
  });
});

describe("r2Store", () => {
  test("without a bucket every read misses and every write is a no-op", async () => {
    const store = r2Store(undefined);
    expect(await store.get("a")).toBeNull();
    await store.put("a", "1");
  });

  test("reads and writes through the bucket", async () => {
    const map = new Map<string, string>();
    const bucket: R2LikeBucket = {
      async get(key) {
        const value = map.get(key);
        return value === undefined ? null : { text: async () => value };
      },
      async put(key, value) {
        map.set(key, value);
      },
    };
    const store = r2Store(bucket);
    await store.put("tracks/x/en.json", "{}");
    expect(await store.get("tracks/x/en.json")).toBe("{}");
    expect(await store.get("missing")).toBeNull();
  });

  test("treats an unreadable object as a miss", async () => {
    const bucket: R2LikeBucket = {
      async get() {
        return {
          text: async () => {
            throw new Error("object is gone");
          },
        };
      },
      async put() {},
    };
    expect(await r2Store(bucket).get("a")).toBeNull();
  });
});
