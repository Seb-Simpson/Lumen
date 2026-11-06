import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { previewOrigin } from "../../scripts/preview-origin.mjs";
import { validateAuthConfiguration } from "../../src/lib/auth-config";
import { assertSameOrigin } from "../../src/lib/security";
const origin = "https://curious-book-123-3000.app.github.dev";
beforeEach(() => {
  for (const key of [
    "CODESPACES",
    "CODESPACE_NAME",
    "GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN",
  ])
    vi.stubEnv(key, undefined);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});
describe("browser development preview", () => {
  it("uses GitHub forwarding variables instead of a copied localhost setting", () => {
    expect(
      previewOrigin({
        CODESPACES: "true",
        CODESPACE_NAME: "curious-book-123",
        GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN: "app.github.dev",
        BETTER_AUTH_URL: "http://localhost:3000",
      }),
    ).toBe(origin);
  });
  it("derives the same trusted address for auth even when dev was started manually", () => {
    const forwarded = {
      NODE_ENV: "development" as const,
      CODESPACES: "true",
      CODESPACE_NAME: "curious-book-123",
      BETTER_AUTH_URL: "http://localhost:3000",
    };
    expect(previewOrigin(forwarded)).toBe(origin);
    expect(validateAuthConfiguration(forwarded)).toBe(origin);
  });
  it("does not override an explicit production origin from Codespaces variables", () => {
    const production = {
      NODE_ENV: "production" as const,
      CODESPACES: "true",
      CODESPACE_NAME: "curious-book-123",
      BETTER_AUTH_URL: "https://learn.example",
      RESEND_API_KEY: "configured",
      EMAIL_FROM: "hello@example.test",
    };
    expect(validateAuthConfiguration(production)).toBe("https://learn.example");
    expect(() =>
      validateAuthConfiguration({ ...production, BETTER_AUTH_URL: undefined }),
    ).toThrow("required");
  });
  it("keeps ordinary local development working", () => {
    expect(previewOrigin({})).toBe("http://localhost:3000");
    expect(previewOrigin({ BETTER_AUTH_URL: "https://preview.example/" })).toBe(
      "https://preview.example",
    );
  });
  it("rejects malformed forwarding hosts and non-origin URLs", () => {
    expect(() =>
      previewOrigin({
        CODESPACES: "true",
        CODESPACE_NAME: "bad/name",
        GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN: "app.github.dev",
      }),
    ).toThrow();
    expect(() =>
      previewOrigin({
        CODESPACES: "true",
        CODESPACE_NAME: "my-space",
        GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN: "app.github.dev/path",
      }),
    ).toThrow();
    expect(() =>
      previewOrigin({ BETTER_AUTH_URL: "https://user:pass@example.com/path" }),
    ).toThrow();
  });
  it("authorises private mutations from the exact forwarded origin", () => {
    vi.stubEnv("BETTER_AUTH_URL", origin);
    expect(() =>
      assertSameOrigin(
        new Request("http://localhost:3000/api/library", {
          headers: { Origin: origin },
        }),
      ),
    ).not.toThrow();
    expect(() =>
      assertSameOrigin(
        new Request("http://localhost:3000/api/library", {
          headers: { Origin: "https://another-space-3000.app.github.dev" },
        }),
      ),
    ).toThrow();
  });
  it("ignores forged forwarding headers and authorises only this Codespace", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("CODESPACES", "true");
    vi.stubEnv("CODESPACE_NAME", "curious-book-123");
    vi.stubEnv("GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN", "app.github.dev");
    vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3000");
    expect(() =>
      assertSameOrigin(
        new Request("http://127.0.0.1:3000/api/library", {
          headers: {
            Origin: origin,
            "x-forwarded-host": "evil.example",
            "x-forwarded-proto": "http",
          },
        }),
      ),
    ).not.toThrow();
    for (const forged of [
      "http://localhost:3000",
      "https://another-space-3000.app.github.dev",
      "https://curious-book-123-3000.app.github.dev.evil.example",
      "http://curious-book-123-3000.app.github.dev",
    ])
      expect(() =>
        assertSameOrigin(
          new Request("http://127.0.0.1:3000/api/library", {
            headers: { Origin: forged },
          }),
        ),
      ).toThrow();
  });
  it("allows development assets and websockets only for the configured host", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("BETTER_AUTH_URL", origin);
    const { default: config } = await import("../../next.config");
    expect(config.allowedDevOrigins).toEqual([
      "curious-book-123-3000.app.github.dev",
    ]);
    const headers = await config.headers!();
    const policy = headers[0].headers.find(
      (h) => h.key === "Content-Security-Policy",
    )!.value;
    expect(policy).toContain("wss://curious-book-123-3000.app.github.dev");
    expect(policy).not.toContain("*.app.github.dev");
  });
  it("does not expand production origins or permit development websocket/eval access", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("BETTER_AUTH_URL", origin);
    const { default: config } = await import("../../next.config");
    expect(config.allowedDevOrigins).toEqual([]);
    const headers = await config.headers!();
    const policy = headers[0].headers.find(
      (h) => h.key === "Content-Security-Policy",
    )!.value;
    expect(policy).not.toContain("wss://");
    expect(policy).not.toContain("unsafe-eval");
  });
});
