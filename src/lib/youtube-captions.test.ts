import { describe, expect, test } from "bun:test";
import { CaptionError, fetchTrackSource } from "./youtube-captions";

const FALLBACK_URL = "https://youtube.weblinq.dev/api/videoDetails";

function mockFetch(
  handler: (url: string) => Response | Promise<Response>,
): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    return handler(url);
  }) as unknown as typeof fetch;
}

const youtubePlayer = {
  playabilityStatus: { status: "OK" },
  videoDetails: { title: "YT title", shortDescription: "desc" },
  captions: {
    playerCaptionsTracklistRenderer: {
      captionTracks: [
        {
          baseUrl: "https://www.youtube.com/api/timedtext?v=x&lang=en",
          vssId: ".en",
          languageCode: "en",
        },
      ],
    },
  },
};

const json3 = {
  events: [{ tStartMs: 1000, dDurationMs: 500, segs: [{ utf8: "hello world" }] }],
};

describe("fetchTrackSource", () => {
  test("prefers YouTube and captures the raw json3", async () => {
    const seen: string[] = [];
    const fetchImpl = mockFetch((url) => {
      seen.push(url);
      if (url.includes("youtubei")) {
        return new Response(JSON.stringify(youtubePlayer), { status: 200 });
      }
      if (url.includes("timedtext")) {
        return new Response(JSON.stringify(json3), { status: 200 });
      }
      throw new Error(`unexpected ${url}`);
    });

    const source = await fetchTrackSource("DyDfgMOUjCI", "en", { fetchImpl, attempts: 1 });
    expect(source.provider).toBe("youtube");
    expect(source.json3).not.toBeNull();
    expect(source.captionKind).toBe("manual");
    expect(seen.some((url) => url.includes("weblinq"))).toBe(false);
  });

  test("uses the fallback when YouTube fails", async () => {
    const seen: string[] = [];
    const fetchImpl = mockFetch((url) => {
      seen.push(url);
      if (url.includes("weblinq")) {
        return new Response(
          JSON.stringify({
            videoDetails: {
              title: "Fallback title",
              description: "d",
              subtitles: [{ start: "1", dur: "2", text: "hello world" }],
            },
          }),
          { status: 200 },
        );
      }
      throw new Error("network down");
    });

    const source = await fetchTrackSource("DyDfgMOUjCI", "en", {
      fetchImpl,
      attempts: 1,
      fallbackUrl: FALLBACK_URL,
    });
    expect(source.provider).toBe("fallback");
    expect(source.subtitles).toHaveLength(1);
    expect(source.title).toBe("Fallback title");
    expect(seen.some((url) => url.includes("weblinq"))).toBe(true);
  });

  test("reports no captions when the fallback answers with an empty list", async () => {
    const fetchImpl = mockFetch((url) => {
      if (url.includes("weblinq")) {
        return new Response(JSON.stringify({ videoDetails: { title: "T", subtitles: [] } }), {
          status: 200,
        });
      }
      throw new Error("blocked");
    });

    const source = await fetchTrackSource("DyDfgMOUjCI", "en", {
      fetchImpl,
      attempts: 1,
      fallbackUrl: FALLBACK_URL,
    });
    expect(source.subtitles).toEqual([]);
    expect(source.provider).toBe("fallback");
  });

  test("throws only when no provider can be reached", async () => {
    const fetchImpl = mockFetch(() => {
      throw new Error("blocked");
    });
    await expect(
      fetchTrackSource("DyDfgMOUjCI", "en", {
        fetchImpl,
        attempts: 1,
        fallbackUrl: FALLBACK_URL,
      }),
    ).rejects.toBeInstanceOf(CaptionError);
  });
});
