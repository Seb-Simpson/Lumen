import { it, expect } from "vitest";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { latestDevelopmentMail } from "../../scripts/read-mail.mjs";

it("private mail CLI selects only the newest message for the explicitly requested recipient", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "lumen-mail-test-"));
  try {
    await writeFile(
      path.join(dir, "100-aa.json"),
      JSON.stringify({
        to: "one@example.test",
        subject: "Verify",
        url: "https://preview.example/api/auth/verify-email?token=old",
      }),
    );
    await writeFile(
      path.join(dir, "200-bb.json"),
      JSON.stringify({
        to: "two@example.test",
        subject: "Verify",
        url: "https://preview.example/api/auth/verify-email?token=other-user",
      }),
    );
    await writeFile(
      path.join(dir, "300-cc.json"),
      JSON.stringify({
        to: "one@example.test",
        subject: "Reset",
        url: "https://preview.example/api/auth/reset-password/new?callbackURL=%2Freset-password",
      }),
    );
    await writeFile(path.join(dir, "400-dd.json"), "malformed");
    expect(
      (await latestDevelopmentMail("ONE@example.test", dir)).url,
    ).toContain("/reset-password/new");
    expect(
      (await latestDevelopmentMail("two@example.test", dir)).url,
    ).toContain("other-user");
    await expect(
      latestDevelopmentMail("missing@example.test", dir),
    ).rejects.toThrow("No local message matches");
    await expect(latestDevelopmentMail("", dir)).rejects.toThrow(
      "npm run mail",
    );
    await expect(
      latestDevelopmentMail("one@example.test", path.join(dir, "absent")),
    ).rejects.toThrow("No local email");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

it("runs the real Node CLI with private fixture email and refuses stale origins without printing their token", async () => {
  const { spawnSync } = await import("node:child_process");
  const directory = await mkdtemp(
    path.join(os.tmpdir(), "lumen-mail-cli-test-"),
  );
  const { mkdir } = await import("node:fs/promises");
  try {
    const mailbox = path.join(directory, "mail");
    await mkdir(mailbox);
    const origin = "https://private-preview.example";
    const url =
      origin +
      "/api/auth/verify-email?token=fixture-not-a-real-token&callbackURL=%2Fspace";
    await writeFile(
      path.join(mailbox, "100-aa.json"),
      JSON.stringify({
        to: "fixture@example.test",
        subject: "Verify your Lumen email",
        url,
      }),
    );
    const executable = path.resolve("scripts/read-mail.mjs");
    const env: NodeJS.ProcessEnv = {
      NODE_ENV: "development",
      LUMEN_DATA_DIR: directory,
      BETTER_AUTH_URL: origin,
      PATH: process.env.PATH,
    };
    const run = (args: string[], overrides: Partial<NodeJS.ProcessEnv> = {}) =>
      spawnSync(process.execPath, [executable, ...args], {
        cwd: directory,
        env: {
          ...env,
          ...overrides,
          NODE_ENV: overrides.NODE_ENV ?? env.NODE_ENV,
        },
        encoding: "utf8",
        timeout: 10000,
      });
    const delivered = run(["fixture@example.test"]);
    expect(delivered.status, delivered.stderr).toBe(0);
    expect(delivered.stdout).toContain(url);
    expect(delivered.stdout).toContain("Private development email");
    const wrongRecipient = run(["other@example.test"]);
    expect(wrongRecipient.status).toBe(1);
    expect(wrongRecipient.stdout).not.toContain("fixture-not-a-real-token");
    const stale = run(["fixture@example.test"], {
      BETTER_AUTH_URL: "https://new-preview.example",
    });
    expect(stale.status).toBe(1);
    expect(stale.stderr).toContain("older preview address");
    expect(stale.stdout).not.toContain("fixture-not-a-real-token");
    const production = run(["fixture@example.test"], {
      NODE_ENV: "production",
    });
    expect(production.status).toBe(1);
    expect(production.stderr).toContain("development mailbox");
    expect(production.stdout).not.toContain("fixture-not-a-real-token");
    const noRecipient = run([]);
    expect(noRecipient.status).toBe(1);
    expect(noRecipient.stderr).toContain("Usage: npm run mail");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
