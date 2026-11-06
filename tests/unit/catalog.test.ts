import { describe, it, expect } from "vitest";
import { subjects, paths, getSearchResults } from "../../src/lib/catalog";
describe("editorial catalogue and backend search", () => {
  it("has unique subject identifiers and valid knowledge connections", () => {
    const slugs = new Set(subjects.map((s) => s.slug));
    expect(slugs.size).toBe(subjects.length);
    for (const s of subjects)
      for (const related of s.related) expect(slugs.has(related)).toBe(true);
    for (const p of paths) {
      expect(slugs.has(p.subject)).toBe(true);
      expect(p.steps.length).toBeGreaterThan(1);
    }
  });
  it("finds real subjects and paths, tolerates a minor typo, and does not invent results", async () => {
    expect(
      (await getSearchResults("astronomy")).some((r) => r.id === "astronomy"),
    ).toBe(true);
    expect(
      (await getSearchResults("astronmy")).some((r) => r.id === "astronomy"),
    ).toBe(true);
    expect(await getSearchResults("flibbertigibbetzx")).toEqual([]);
    expect(
      (await getSearchResults("planet", "path")).every(
        (r) => r.type === "path",
      ),
    ).toBe(true);
  });
  it("applies subject and alphabetical filters", async () => {
    const results = await getSearchResults(
      "",
      "",
      "astronomy",
      "",
      "alphabetical",
    );
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.subject === "astronomy")).toBe(true);
    const all = await getSearchResults("", "", "", "", "alphabetical");
    expect(all.map((r) => r.title)).toEqual(
      all.map((r) => r.title).sort((a, b) => a.localeCompare(b)),
    );
  });
});
