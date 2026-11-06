import { test, expect } from "@playwright/test";

test("server search finds real knowledge, tolerates typos and handles zero matches", async ({
  page,
}) => {
  await page.goto("/search?q=astronomy");
  await expect(
    page
      .locator(".search-result")
      .filter({
        has: page.getByRole("heading", { name: "Astronomy", exact: true }),
      }),
  ).toBeVisible();
  await page.goto("/search?q=astronmy");
  await expect(
    page.getByRole("heading", { name: "Astronomy", exact: true }),
  ).toBeVisible();
  await page.goto("/search?q=zxnonexistentknowledge");
  await expect(
    page.getByRole("heading", {
      name: "There’s more to discover.",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator(".search-result")).toHaveCount(0);
  await page.goto("/search?q=");
  await page.screenshot({
    path: "docs/screenshots/search-desktop.png",
    fullPage: true,
  });
});

test("subject connections and learning path routes work without videos", async ({
  page,
}) => {
  await page.goto("/subjects/astronomy");
  await expect(
    page.getByRole("heading", { name: "Astronomy", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Physics/ }).last(),
  ).toBeVisible();
  await page.screenshot({
    path: "docs/screenshots/subject-astronomy.png",
    fullPage: true,
  });
  await page.goto("/learning-paths/a-place-in-the-universe");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "place in the universe",
  );
  await expect(
    page.getByRole("heading", { name: "Our solar system", exact: true }),
  ).toBeVisible();
  await page.goto("/explore");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/subjects");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "docs/screenshots/subjects-mobile.png",
    fullPage: true,
  });
  await page.goto("/not-a-lumen-route");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Lumen home", exact: true }),
  ).toBeVisible();
});
