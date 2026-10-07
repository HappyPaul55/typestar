import { describe, expect, test } from "bun:test";
import { TRACK_VERSION, type Track } from "../src/lib/track/types";
import worker from "./index";

const ID = "dQw4w9WgXcQ";

const TRACK: Track = {
  version: TRACK_VERSION,
  id: ID,
  title: "Test song",
  description: "",
  lang: "en",
  source: { captions: "manual", fetchedAt: "2026-01-01T00:00:00.000Z" },
  offset: 0,
  lines: [{ start: 0, end: 1, from: 0, to: 1 }],
  words: [{ text: "Hi", match: "hi", start: 0, end: 1, line: 0 }],
};

const PAGE = [
  "<!doctype html><html><head>",
  '<title data-seo="title">Play TypeStar</title>',
  '<meta name="description" data-seo="description" content="generic" />',
  '<link rel="canonical" data-seo="canonical" href="https://typestar.happypaul55.com/play" />',
  "</head><body>play</body></html>",
].join("");

type Env = Parameters<typeof worker.fetch>[1];

/** An env whose asset binding serves the page and (optionally) a seed track. */
function envWithSeed(seed: string | null): Env {
  return {
    ASSETS: {
      async fetch(request: Request) {
        const { pathname } = new URL(request.url);
        if (pathname.startsWith("/tracks/")) {
          return seed
            ? new Response(seed)
            : new Response("missing", { status: 404 });
        }
        return new Response(PAGE, {
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      },
    },
  } as Env;
}

function get(path: string, env: Env) {
  return worker.fetch(
    new Request(`https://typestar.happypaul55.com${path}`),
    env,
  );
}

describe("worker /play/<id>", () => {
  test("injects the track title and social tags when it is seeded", async () => {
    const response = await get(`/play/${ID}`, envWithSeed(JSON.stringify(TRACK)));
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toContain("<title data-seo=\"title\">Test song — TypeStar</title>");
    expect(html).toContain(
      'data-seo="canonical" href="https://typestar.happypaul55.com/play/dQw4w9WgXcQ"',
    );
  });

  test("serves the generic page for an unknown song", async () => {
    const response = await get(`/play/${ID}`, envWithSeed(null));
    const html = await response.text();
    expect(html).toContain("<title data-seo=\"title\">Play TypeStar</title>");
    expect(html).not.toContain("Test song");
  });
});
