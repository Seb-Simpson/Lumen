import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchSpotifyMetadata,
  validateSpotifyUrl,
} from "../../src/lib/spotify";
const id = "7makk4oTQel546B0PZlDM5";
describe("Spotify URL validation", () => {
  it("canonicalizes genuine show/episode URLs without sharing parameters", () => {
    expect(
      validateSpotifyUrl(
        ` https://open.spotify.com/episode/${id}?si=private#t=4 `,
      ),
    ).toEqual({
      kind: "episode",
      spotifyId: id,
      url: `https://open.spotify.com/episode/${id}`,
    });
    expect(
      validateSpotifyUrl(`https://open.spotify.com/show/${id}/`)?.kind,
    ).toBe("show");
  });
  it.each([
    `http://open.spotify.com/episode/${id}`,
    `https://open.spotify.com.attacker.test/episode/${id}`,
    `https://open.spotify.com@attacker.test/episode/${id}`,
    `https://user:pass@open.spotify.com/episode/${id}`,
    `https://open.spotify.com:444/episode/${id}`,
    `https://open.spotify.com/track/${id}`,
    `https://open.spotify.com/episode/${id}/extra`,
    "https://open.spotify.com/episode/short",
    "javascript:alert(1)",
    "file:///etc/passwd",
  ])("rejects invalid or unsafe link %s", (url) =>
    expect(validateSpotifyUrl(url)).toBeNull(),
  );
});
describe("Spotify metadata boundary", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("uses fixed endpoint, rejects redirects and ignores supplied HTML", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({
        ok: true,
        json: async () => ({
          title: "A genuine idea",
          thumbnail_url: "https://attacker.test/pixel",
          html: "<script>bad()</script>",
        }),
      });
    vi.stubGlobal("fetch", fetchMock);
    const result = await fetchSpotifyMetadata(
      validateSpotifyUrl(`https://open.spotify.com/episode/${id}`)!,
    );
    const [endpoint, options] = fetchMock.mock.calls[0];
    expect(endpoint.origin).toBe("https://open.spotify.com");
    expect(endpoint.pathname).toBe("/oembed");
    expect(options.redirect).toBe("error");
    expect(result.thumbnailUrl).toBeNull();
    expect(result).not.toHaveProperty("html");
    expect(result.title).toBe("A genuine idea");
  });
  it("does not fetch invalid URLs", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      fetchSpotifyMetadata({
        kind: "episode",
        spotifyId: id,
        url: "https://attacker.test/",
      }),
    ).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("returns actionable errors for unavailable metadata", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    await expect(
      fetchSpotifyMetadata(
        validateSpotifyUrl(`https://open.spotify.com/episode/${id}`)!,
      ),
    ).rejects.toThrow("could not find");
  });
});
