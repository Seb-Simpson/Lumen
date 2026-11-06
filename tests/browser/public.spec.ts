import { test, expect } from "@playwright/test";

test("desktop home, actual artwork, cookie rejection and logo navigation", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "whole world",
  );
  await page
    .getByRole("button", { name: "Reject optional", exact: true })
    .click();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("lumen-consent") || "{}").embeds,
    ),
  ).toBe(false);
  const hero = page.locator(".hero-art");
  await expect(hero).toBeVisible();
  expect(
    await hero.evaluate((img: HTMLImageElement) => img.naturalWidth),
  ).toBeGreaterThan(1000);
  await page.screenshot({
    path: "docs/screenshots/home-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("link", { name: "Podcasts", exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/podcasts$/);
  await page.getByRole("link", { name: "Lumen home", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/podcasts$/);
  await page.goForward();
  await expect(page).toHaveURL(/\/$/);
  expect(errors).toEqual([]);
});

test("cookie customisation and theme survive reload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Customise", exact: true }).click();
  await page
    .getByRole("checkbox", { name: /Allow third-party Spotify embeds/ })
    .check();
  await page
    .getByRole("button", { name: "Save preferences", exact: true })
    .click();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("lumen-consent") || "{}").embeds,
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Use light theme", exact: true })
    .click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.screenshot({
    path: "docs/screenshots/home-light.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Cookie preferences", exact: true })
    .click();
  await page
    .getByRole("checkbox", { name: /Allow third-party Spotify embeds/ })
    .uncheck();
  await page
    .getByRole("button", { name: "Save preferences", exact: true })
    .click();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("lumen-consent") || "{}").embeds,
    ),
  ).toBe(false);
});

test("zero video and private-space empty states are honest", async ({
  page,
}) => {
  await page.goto("/watch/no-published-video");
  await expect(page.locator("video")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.goto("/space");
  await expect(
    page.getByRole("link", { name: /sign in/i }).last(),
  ).toBeVisible();
  await page.screenshot({
    path: "docs/screenshots/space-signed-out.png",
    fullPage: true,
  });
});

test("mobile navigation, keyboard access and no overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Reject optional", exact: true })
    .click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "docs/screenshots/home-mobile.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Toggle navigation", exact: true })
    .click();
  await expect(page.locator(".sidebar")).toHaveClass(/mobile-open/);
  await page
    .getByRole("link", { name: "Podcasts", exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/podcasts$/);
  await expect(page.locator(".sidebar")).not.toHaveClass(/mobile-open/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.keyboard.press("Control+k");
  await expect(page.getByLabel("Search Lumen", { exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await page.screenshot({
    path: "docs/screenshots/podcasts-mobile.png",
    fullPage: true,
  });
});

test("device theme follows system preference after reload and changes", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.addInitScript(() => {
    localStorage.setItem("lumen-theme", "system");
    localStorage.setItem(
      "lumen-consent",
      JSON.stringify({ necessary: true, embeds: false }),
    );
  });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});
