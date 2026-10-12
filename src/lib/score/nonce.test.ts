import { describe, expect, test } from "bun:test";
import { issueNonce, MAX_OFFSET, NONCE_TTL_SECONDS, verifyNonce } from "./nonce";

const SECRET = "test-secret-that-is-at-least-32-characters-long";
const BASE = {
  u: "user-1",
  t: "youtube-abcdefghijk",
  s: "type" as const,
  d: "normal" as const,
  rm: "fun" as const,
  sp: 1 as const,
  o: 0,
};

describe("run nonce", () => {
  test("round-trips the run settings", async () => {
    const token = await issueNonce(SECRET, BASE, 1000);
    const payload = await verifyNonce(SECRET, token, 1000);
    expect(payload?.u).toBe("user-1");
    expect(payload?.t).toBe("youtube-abcdefghijk");
    expect(payload?.d).toBe("normal");
    expect(payload?.rm).toBe("fun");
  });

  test("rejects a tampered or wrongly-signed token", async () => {
    const token = await issueNonce(SECRET, BASE, 1000);
    expect(await verifyNonce(SECRET, `${token}x`, 1000)).toBeNull();
    expect(await verifyNonce("a-different-secret-that-is-long-enough", token, 1000)).toBeNull();
    expect(await verifyNonce(SECRET, "not-a-token", 1000)).toBeNull();
  });

  test("expires", async () => {
    const token = await issueNonce(SECRET, BASE, 1000);
    expect(await verifyNonce(SECRET, token, 1000 + NONCE_TTL_SECONDS + 1)).toBeNull();
  });

  test("caps the sync offset", async () => {
    const token = await issueNonce(SECRET, { ...BASE, o: 99 }, 1000);
    const payload = await verifyNonce(SECRET, token, 1000);
    expect(Math.abs(payload?.o ?? 0)).toBeLessThanOrEqual(MAX_OFFSET);
  });
});
