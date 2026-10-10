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
  '<meta property="og:image" data-seo="og:image" content="https://typestar.happypaul55.com/og-image.png" />',
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

describe("worker /play routes", () => {
  test("injects the track title and social tags when it is seeded", async () => {
    const response = await get(`/play/youtube/${ID}`, envWithSeed(JSON.stringify(TRACK)));
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toContain("<title data-seo=\"title\">Test song — TypeStar</title>");
    expect(html).toContain(
      'data-seo="canonical" href="https://typestar.happypaul55.com/play/youtube/dQw4w9WgXcQ"',
    );
  });

  test("serves the generic page for an unknown song", async () => {
    const response = await get(`/play/youtube/${ID}`, envWithSeed(null));
    const html = await response.text();
    expect(html).toContain("<title data-seo=\"title\">Play TypeStar</title>");
    expect(html).not.toContain("Test song");
  });

  test("redirects the legacy /play/<id> to the typed URL", async () => {
    const response = await get(`/play/${ID}`, envWithSeed(null));
    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe(
      `https://typestar.happypaul55.com/play/youtube/${ID}`,
    );
  });

  test("injects SEO for a seeded UltraStar chart", async () => {
    const url = "https://example.com/songs/song.txt";
    const track: Track = {
      ...TRACK,
      id: "ultrastar-abc",
      title: "Code Monkey",
      origin: "ultrastar",
      sourceUrl: url,
      artist: "Jonathan Coulton",
      media: { cover: "https://example.com/songs/cover.jpg" },
    };
    const response = await get(
      `/play/ultrastar/${encodeURIComponent(url)}`,
      envWithSeed(JSON.stringify(track)),
    );
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toContain("<title data-seo=\"title\">Code Monkey — TypeStar</title>");
    expect(html).toContain("https://example.com/songs/cover.jpg");
    expect(html).toContain(
      `data-seo="canonical" href="https://typestar.happypaul55.com/play/ultrastar/${encodeURIComponent(url)}"`,
    );
  });
});
