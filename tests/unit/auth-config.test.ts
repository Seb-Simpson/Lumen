import { describe, it, expect } from "vitest";
import { validateAuthConfiguration } from "../../src/lib/auth-config";
describe("production auth configuration", () => {
  const production = {
    NODE_ENV: "production" as const,
    BETTER_AUTH_URL: "https://learn.example",
    RESEND_API_KEY: "configured-provider-key",
    EMAIL_FROM: "Lumen <learn@example.test>",
  };
  it("requires an explicit HTTPS application origin", () => {
    expect(() =>
      validateAuthConfiguration({ ...production, BETTER_AUTH_URL: undefined }),
    ).toThrow("required");
    expect(() =>
      validateAuthConfiguration({
        ...production,
        BETTER_AUTH_URL: "http://learn.example",
      }),
    ).toThrow("HTTPS");
    for (const origin of [
      "https://user:pass@learn.example",
      "https://learn.example/path",
      "https://learn.example?redirect=other",
      "https://learn.example#hash",
      "javascript:alert(1)",
    ])
      expect(() =>
        validateAuthConfiguration({ ...production, BETTER_AUTH_URL: origin }),
      ).toThrow();
    expect(
      validateAuthConfiguration({
        ...production,
        BETTER_AUTH_URL: "https://learn.example/",
      }),
    ).toBe("https://learn.example");
  });
  it("requires verification/recovery delivery credentials at runtime", () => {
    expect(() =>
      validateAuthConfiguration({ ...production, RESEND_API_KEY: undefined }),
    ).toThrow("RESEND_API_KEY");
    expect(() =>
      validateAuthConfiguration({ ...production, EMAIL_FROM: " " }),
    ).toThrow("EMAIL_FROM");
    expect(validateAuthConfiguration(production)).toBe("https://learn.example");
  });
  it("allows local development and source-only production builds", () => {
    expect(validateAuthConfiguration({ NODE_ENV: "development" })).toBe(
      "http://localhost:3000",
    );
    expect(
      validateAuthConfiguration({
        NODE_ENV: "production",
        NEXT_PHASE: "phase-production-build",
      }),
    ).toBe("http://localhost:3000");
  });
});
