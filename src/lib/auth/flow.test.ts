import { describe, expect, test } from "bun:test";
import { memoryAdapter } from "better-auth/adapters/memory";
import { createAuth } from "./server";

/**
 * The whole magic-link round trip, against Better Auth's in-memory adapter:
 * request a link, read the token out of the emailed URL, verify it, and check
 * that a session (and user) come back.
 */
function makeAuth() {
  let link: string | null = null;
  const auth = createAuth({
    database: memoryAdapter({
      user: [],
      session: [],
      account: [],
      verification: [],
    }),
    secret: "test-secret-that-is-at-least-32-characters-long",
    sendMagicLink: async ({ url }) => {
      link = url;
    },
  });
  return { auth, link: () => link };
}

function tokenFrom(url: string): string {
  return new URL(url).searchParams.get("token") ?? "";
}

describe("magic-link sign-in", () => {
  test("issues a link and signs the user in", async () => {
    const { auth, link } = makeAuth();
    const sent = await auth.api.signInMagicLink({
      body: { email: "player@example.com" },
      headers: new Headers(),
    });
    expect(sent.status).toBe(true);

    const url = link();
    expect(url).toBeTruthy();
    const token = tokenFrom(url as string);
    expect(token.length).toBeGreaterThan(0);

    const verified = await auth.api.magicLinkVerify({
      query: { token },
      headers: new Headers(),
    });
    expect(verified?.user.email).toBe("player@example.com");
    expect(verified?.session.token.length).toBeGreaterThan(0);
  });

  test("a token can only be redeemed once", async () => {
    const { auth, link } = makeAuth();
    await auth.api.signInMagicLink({
      body: { email: "player@example.com" },
      headers: new Headers(),
    });
    const token = tokenFrom(link() as string);
    await auth.api.magicLinkVerify({
      query: { token },
      headers: new Headers(),
    });
    await expect(
      auth.api.magicLinkVerify({ query: { token }, headers: new Headers() }),
    ).rejects.toThrow();
  });
});
