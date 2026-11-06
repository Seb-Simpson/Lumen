import { describe, it, expect, vi, afterEach } from "vitest";
import {
  assertSameOrigin,
  readJson,
  rateLimit,
  HttpError,
} from "../../src/lib/security";
afterEach(() => vi.unstubAllEnvs());
describe("request security", () => {
  it("requires the configured origin for private mutations", () => {
    vi.stubEnv("BETTER_AUTH_URL", "https://lumen.example");
    expect(() =>
      assertSameOrigin(
        new Request("https://lumen.example/api/library", {
          headers: { origin: "https://lumen.example" },
        }),
      ),
    ).not.toThrow();
    expect(() =>
      assertSameOrigin(
        new Request("https://lumen.example/api/library", {
          headers: { origin: "https://attacker.example" },
        }),
      ),
    ).toThrow(HttpError);
    expect(() =>
      assertSameOrigin(new Request("https://lumen.example/api/library")),
    ).toThrow(HttpError);
    expect(() =>
      assertSameOrigin(
        new Request("https://lumen.example/api/library", {
          headers: {
            origin: "https://lumen.example",
            "sec-fetch-site": "cross-site",
          },
        }),
      ),
    ).toThrow(HttpError);
  });
  it("rejects malformed, incorrectly typed and oversized JSON", async () => {
    const request = (body: string, type = "application/json") =>
      new Request("http://localhost:3000", {
        method: "POST",
        headers: { "content-type": type },
        body,
      });
    expect(await readJson(request('{"hello":"world"}'))).toEqual({
      hello: "world",
    });
    await expect(readJson(request("oops"))).rejects.toMatchObject({
      status: 400,
    });
    await expect(readJson(request("{}", "text/plain"))).rejects.toMatchObject({
      status: 415,
    });
    await expect(readJson(request("x".repeat(65537)))).rejects.toMatchObject({
      status: 413,
    });
  });
  it("enforces per-key request limits", () => {
    const key = "test-" + crypto.randomUUID();
    rateLimit(key, 2);
    rateLimit(key, 2);
    expect(() => rateLimit(key, 2)).toThrow(HttpError);
    expect(() => rateLimit(key + "other", 2)).not.toThrow();
  });
});
