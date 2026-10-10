import { describe, expect, test } from "bun:test";
import { injectTrackSeo, trackSeo } from "./seo";

const SEO = trackSeo(
  { id: "dQw4w9WgXcQ", title: "Never Gonna Give You Up" },
  "https://typestar.happypaul55.com",
);

const HTML = [
  "<head>",
  '<title data-seo="title">Play TypeStar</title>',
  '<meta name="description" data-seo="description" content="generic" />',
  '<link rel="canonical" data-seo="canonical" href="https://typestar.happypaul55.com/play" />',
  '<meta property="og:title" data-seo="og:title" content="generic" />',
  '<meta property="og:image:width" data-seo="og:image:width" content="1200" />',
  '<meta name="twitter:image" data-seo="twitter:image" content="generic" />',
  '<meta property="og:site_name" content="TypeStar" />',
  "</head>",
].join("");

describe("trackSeo", () => {
  test("builds the title, canonical and cover art", () => {
    expect(SEO.title).toBe("Never Gonna Give You Up — TypeStar");
    expect(SEO.canonical).toBe(
      "https://typestar.happypaul55.com/play/youtube/dQw4w9WgXcQ",
    );
    expect(SEO.image).toBe(
      "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    );
  });

  test("normalises a trailing slash on the origin", () => {
    const seo = trackSeo({ id: "dQw4w9WgXcQ", title: "x" }, "https://example.com/");
    expect(seo.canonical).toBe("https://example.com/play/youtube/dQw4w9WgXcQ");
  });

  test("falls back to a title for an empty one", () => {
    expect(trackSeo({ id: "dQw4w9WgXcQ", title: "  " }, "https://x.test").title).toBe(
      "Untitled track — TypeStar",
    );
  });

  test("builds an UltraStar canonical from its source URL and uses its cover", () => {
    const url = "https://example.com/songs/Code Monkey/song.txt";
    const seo = trackSeo(
      {
        id: "ultrastar-abc",
        title: "Code Monkey",
        origin: "ultrastar",
        sourceUrl: url,
        artist: "Jonathan Coulton",
        media: { cover: "https://example.com/songs/Code Monkey/cover.png" },
      },
      "https://typestar.happypaul55.com",
    );
    expect(seo.canonical).toBe(
      `https://typestar.happypaul55.com/play/ultrastar/${encodeURIComponent(url)}`,
    );
    expect(seo.image).toBe("https://example.com/songs/Code Monkey/cover.png");
    expect(seo.imageType).toBe("image/png");
    expect(seo.description).toContain("Jonathan Coulton");
    // Unknown cover size: no width/height hint is forced.
    expect(seo.imageWidth).toBeUndefined();
  });

  test("falls back to the site card when an UltraStar chart has no cover", () => {
    const seo = trackSeo(
      {
        id: "ultrastar-abc",
        title: "Code Monkey",
        origin: "ultrastar",
        sourceUrl: "https://example.com/song.txt",
      },
      "https://typestar.happypaul55.com",
    );
    expect(seo.image).toBe("https://typestar.happypaul55.com/og-image.png");
    expect(seo.imageType).toBe("image/png");
  });
});

describe("injectTrackSeo", () => {
  test("fills the marked tags and leaves the rest alone", () => {
    const out = injectTrackSeo(HTML, SEO);
    expect(out).toContain(
      '<title data-seo="title">Never Gonna Give You Up — TypeStar</title>',
    );
    expect(out).toContain('data-seo="canonical" href="https://typestar.happypaul55.com/play/youtube/dQw4w9WgXcQ"');
    expect(out).toContain('data-seo="og:image:width" content="1280"');
    expect(out).toContain(
      'data-seo="twitter:image" content="https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"',
    );
    expect(out).toContain('property="og:site_name" content="TypeStar"');
  });

  test("escapes quotes and ampersands in attribute values", () => {
    const seo = trackSeo({ id: "dQw4w9WgXcQ", title: 'Rock & "Roll"' }, "https://x.test");
    const out = injectTrackSeo(HTML, seo);
    expect(out).toContain("Rock &amp; &quot;Roll&quot;");
    expect(out).not.toContain('content="Play Rock & "Roll"');
  });

  test("leaves html with no markers unchanged", () => {
    const bare = "<head><title>Hi</title></head>";
    expect(injectTrackSeo(bare, SEO)).toBe(bare);
  });
});
