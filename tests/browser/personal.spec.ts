import { test, expect } from "@playwright/test";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

test("registration, verified account and persisted personal learning UI", async ({
  page,
}) => {
  test.setTimeout(120000);
  const email = `browser-${Date.now()}@lumen.example`;
  const password = "A thoughtful password 2026!";
  await page.goto("/sign-up");
  await page
    .getByRole("button", { name: "Reject optional", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Your name", exact: true })
    .fill("Browser Learner");
  await page
    .getByRole("textbox", { name: "Email address", exact: true })
    .fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page
    .getByRole("button", { name: "Create your account", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Your account has been created",
  );
  const folder = path.join(process.env.LUMEN_DATA_DIR || ".data", "mail");
  let verify = "";
  for (const file of (await readdir(folder)).sort().reverse()) {
    const mail = JSON.parse(await readFile(path.join(folder, file), "utf8"));
    if (mail.to === email && mail.subject.includes("Verify")) {
      verify = mail.url;
      break;
    }
  }
  expect(verify).toContain("/verify-email");
  await page.goto(verify);
  try {
    await expect(page).toHaveURL(/\/space$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Your curiosity",
    );
    await page
      .getByRole("button", { name: "New collection", exact: true })
      .click();
    await page
      .getByRole("textbox", { name: "Collection name", exact: true })
      .fill("The night sky");
    await page
      .getByRole("button", { name: "Save changes", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Rename The night sky", exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("button", { name: "Rename The night sky", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Rename The night sky", exact: true })
      .click();
    await page
      .getByRole("textbox", { name: "Collection name", exact: true })
      .fill("Celestial questions");
    await page
      .getByRole("button", { name: "Save changes", exact: true })
      .click();
    await expect(
      page.getByRole("button", {
        name: "Rename Celestial questions",
        exact: true,
      }),
    ).toBeVisible();
    await page.getByRole("tab", { name: "Your learning", exact: true }).click();
    await page.getByRole("button", { name: "Add a goal", exact: true }).click();
    await page
      .getByRole("textbox", {
        name: "What would you like to learn?",
        exact: true,
      })
      .fill("Understand stellar evolution");
    await page
      .getByRole("button", { name: "Save changes", exact: true })
      .click();
    await page
      .getByRole("button", {
        name: "Complete goal: Understand stellar evolution",
        exact: true,
      })
      .click();
    await expect(
      page.getByRole("button", {
        name: "Reopen goal: Understand stellar evolution",
        exact: true,
      }),
    ).toBeVisible();
    await page
      .getByRole("tab", { name: "Learning notes", exact: true })
      .click();
    await page.getByRole("button", { name: "New note", exact: true }).click();
    await page
      .getByRole("textbox", { name: "Note title", exact: true })
      .fill("A question about stars");
    await page
      .getByRole("textbox", { name: "Your notes", exact: true })
      .fill("How do we know what a star is made of?");
    await page
      .getByRole("button", { name: "Save changes", exact: true })
      .click();
    await expect(
      page.getByRole("heading", {
        name: "A question about stars",
        exact: true,
      }),
    ).toBeVisible();
    await page.reload();
    await page
      .getByRole("tab", { name: "Learning notes", exact: true })
      .click();
    await expect(
      page.getByRole("heading", {
        name: "A question about stars",
        exact: true,
      }),
    ).toBeVisible();
    await page.screenshot({
      path: "docs/screenshots/space-notes.png",
      fullPage: true,
    });
    await page.goto("/learning-paths/a-place-in-the-universe");
    await page
      .getByRole("button", { name: "Mark as explored", exact: true })
      .first()
      .click();
    await expect(
      page.getByRole("button", { name: "Explored · Undo", exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("button", { name: "Explored · Undo", exact: true }),
    ).toBeVisible();
    await page.goto("/space");
    await page.getByRole("tab", { name: "Your learning", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Continue learning", exact: true }),
    ).toBeVisible();
    await page.getByRole("tab", { name: "Your library", exact: true }).click();
    page.once("dialog", (d) => d.accept());
    await page
      .getByRole("button", { name: "Delete Celestial questions", exact: true })
      .click();
    await expect(
      page.getByRole("button", {
        name: "Rename Celestial questions",
        exact: true,
      }),
    ).toHaveCount(0);
    const preference = await page.request.post("/api/library", {
      headers: { Origin: "http://localhost:3000" },
      data: { entity: "preferences", values: { searchHistory: true } },
    });
    expect(preference.ok()).toBe(true);
    await page.request.post("/api/search-history", {
      headers: { Origin: "http://localhost:3000" },
      data: { query: "A private question" },
    });
    await page
      .getByRole("textbox", { name: "Search Lumen", exact: true })
      .fill("");
    await page
      .getByRole("textbox", { name: "Search Lumen", exact: true })
      .focus();
    await expect(
      page.getByRole("link", { name: "A private question", exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await page
      .getByRole("button", { name: "Open account menu", exact: true })
      .click();
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await expect(
      page.getByRole("link", { name: "Sign in", exact: true }).first(),
    ).toBeVisible();
    await page
      .getByRole("textbox", { name: "Search Lumen", exact: true })
      .focus();
    await expect(
      page.getByRole("link", { name: "A private question", exact: true }),
    ).toHaveCount(0);
  } finally {
    const current = await page.request.get("/api/auth/get-session");
    if (!(await current.json())?.user)
      await page.request.post("/api/auth/sign-in/email", {
        headers: { Origin: "http://localhost:3000" },
        data: { email, password },
      });
    const response = await page.request.delete("/api/account", {
      headers: { Origin: "http://localhost:3000" },
      data: { password },
    });
    expect(response.ok()).toBe(true);
  }
});
