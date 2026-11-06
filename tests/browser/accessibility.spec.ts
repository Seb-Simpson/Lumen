import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { writeFile } from "node:fs/promises";

test("home and authentication have no automatically detectable WCAG A/AA violations", async ({
  page,
}) => {
  test.setTimeout(180000);
  await page.addInitScript(() =>
    localStorage.setItem(
      "lumen-consent",
      JSON.stringify({
        necessary: true,
        analytics: false,
        personalisation: false,
        embeds: false,
      }),
    ),
  );
  const findings = [];
  for (const route of ["/", "/sign-in", "/subjects", "/podcasts"]) {
    await page.goto(route);
    await expect(
      page.getByRole("button", { name: "Reject optional", exact: true }),
    ).toBeHidden();
    const results = await new AxeBuilder({ page })
      .exclude("nextjs-portal")
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    findings.push({ route, violations: results.violations });
  }
  await writeFile(
    "docs/screenshots/accessibility-results.json",
    JSON.stringify(findings, null, 2),
  );
  expect(
    findings.flatMap((f) =>
      f.violations.map((v) => ({
        route: f.route,
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => n.target),
      })),
    ),
  ).toEqual([]);
});
