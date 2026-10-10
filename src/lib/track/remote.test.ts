import { describe, expect, test } from "bun:test";
import { fetchRemoteUltraStar, isAllowedRemoteUrl, RemoteError } from "./remote";

const SONG_URL = "https://example.com/songs/Code Monkey/song.txt";

const CHART = [
  "#TITLE:Code Monkey",
  "#ARTIST:Jonathan Coulton",
  "#MP3:audio.mp3",
  "#VIDEO:bg.mp4",
  "#COVER:cover.jpg",
  "#BACKGROUND:background.jpg",
  "#BPM:320",
  "#GAP:675",
  "#VIDEOGAP:4",
  ": 0 6 -4 Code",
  ": 8 3 -4  Mon",
  "- 52",
  "E",
].join("\n");

function chartFetch(body: string, status = 200): typeof fetch {
  return (async () => new Response(body, { status })) as unknown as typeof fetch;
}

describe("isAllowedRemoteUrl", () => {
  test("allows public http(s)", () => {
    expect(isAllowedRemoteUrl(SONG_URL)).toBe(true);
    expect(isAllowedRemoteUrl("http://example.com/x.txt")).toBe(true);
  });

  test("blocks non-http, credentials, private hosts and literals", () => {
    expect(isAllowedRemoteUrl("ftp://example.com/x")).toBe(false);
    expect(isAllowedRemoteUrl("https://user:pass@example.com/x")).toBe(false);
    expect(isAllowedRemoteUrl("http://localhost/x")).toBe(false);
    expect(isAllowedRemoteUrl("http://127.0.0.1/x")).toBe(false);
    expect(isAllowedRemoteUrl("http://10.0.0.1/x")).toBe(false);
    expect(isAllowedRemoteUrl("http://192.168.1.1/x")).toBe(false);
    expect(isAllowedRemoteUrl("http://169.254.169.254/latest")).toBe(false);
    expect(isAllowedRemoteUrl("http://[::1]/x")).toBe(false);
    expect(isAllowedRemoteUrl("not a url")).toBe(false);
  });
});

describe("fetchRemoteUltraStar", () => {
  test("parses the chart and resolves media against its URL", async () => {
    const remote = await fetchRemoteUltraStar(SONG_URL, { fetchImpl: chartFetch(CHART) });
    expect(remote.song.title).toBe("Code Monkey");
    expect(remote.media.audio).toBe("https://example.com/songs/Code%20Monkey/audio.mp3");
    expect(remote.media.video).toBe("https://example.com/songs/Code%20Monkey/bg.mp4");
    expect(remote.media.cover).toBe("https://example.com/songs/Code%20Monkey/cover.jpg");
    expect(remote.media.background).toBe(
      "https://example.com/songs/Code%20Monkey/background.jpg",
    );
    expect(remote.media.videoGap).toBe(4);
  });

  test("rejects a chart with no lyric notes", async () => {
    const empty = ["#TITLE:x", "#MP3:a.mp3", "E"].join("\n");
    await expect(
      fetchRemoteUltraStar(SONG_URL, { fetchImpl: chartFetch(empty) }),
    ).rejects.toBeInstanceOf(RemoteError);
  });

  test("rejects a chart with no audio", async () => {
    const noAudio = ["#TITLE:x", "#BPM:120", ": 0 4 0  hi", "E"].join("\n");
    await expect(
      fetchRemoteUltraStar(SONG_URL, { fetchImpl: chartFetch(noAudio) }),
    ).rejects.toMatchObject({ status: 422 });
  });

  test("rejects an over-large response", async () => {
    await expect(
      fetchRemoteUltraStar(SONG_URL, { fetchImpl: chartFetch(CHART), maxBytes: 10 }),
    ).rejects.toMatchObject({ status: 413 });
  });

  test("follows a redirect and resolves media against the final URL", async () => {
    const fetchImpl = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("example.com/songs")) {
        return new Response(null, {
          status: 302,
          headers: { location: "https://cdn.example.com/song.txt" },
        });
      }
      return new Response(CHART, { status: 200 });
    }) as unknown as typeof fetch;

    const remote = await fetchRemoteUltraStar(SONG_URL, { fetchImpl });
    expect(remote.sourceUrl).toBe("https://cdn.example.com/song.txt");
    expect(remote.media.audio).toBe("https://cdn.example.com/audio.mp3");
  });

  test("rejects a redirect to a blocked host", async () => {
    const fetchImpl = (async () =>
      new Response(null, {
        status: 302,
        headers: { location: "http://127.0.0.1/song.txt" },
      })) as unknown as typeof fetch;
    await expect(
      fetchRemoteUltraStar(SONG_URL, { fetchImpl }),
    ).rejects.toMatchObject({ status: 400 });
  });
});
