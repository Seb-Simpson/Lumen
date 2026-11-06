/**
 * Standalone HTTPS forwarded-preview regression. Requires Linux/macOS, openssl,
 * Playwright Chromium, and free loopback ports 3000 and 443. Never uses a paid
 * Codespace: the GitHub-style hostname is resolved to this machine by Chromium.
 * Run only when the ordinary development server is stopped:
 *   node tests/forwarded-auth.mjs
 *
 * The self-signed TLS exceptions below apply only to this local test transport.
 * No global TLS settings, hosts files, real providers or application data change.
 */
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import {
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { openSync, closeSync } from "node:fs";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, expect as baseExpect } from "@playwright/test";
const expect = baseExpect.configure({ timeout: 15000 });

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const hostname = "lumen-preview-3000.app.github.dev";
const origin = `https://${hostname}`;
const password = "Forwarded regression password 2026!";
const email = `forwarded-${Date.now()}@lumen.example`;
const checks = [];
const diagnostics = [];
const browserErrors = [];
const consoleTasks = [];
const sessionHeaders = [];
const sockets = new Set();
let temporary;
let server;
let child;
let browser;
let context;
let cleanupPromise;
let failure;
let serverLog;

function redact(input) {
  return String(input)
    .replaceAll(password, "[test password redacted]")
    .replace(
      /([?&](?:token|code|verification_token|session_token)=)[^&#\s)]+/gi,
      "$1[redacted]",
    )
    .replace(
      /((?:__Secure-|__Host-)?better-auth\.session_token=)[^;\s]+/g,
      "$1[redacted]",
    );
}
async function check(name, run) {
  try {
    await run();
    checks.push({ name, status: "PASS" });
    process.stdout.write(`PASS ${name}\n`);
  } catch (error) {
    checks.push({ name, status: "FAIL", detail: redact(error.message) });
    throw error;
  }
}
async function assertFreePort(port) {
  const probe = net.createServer();
  await new Promise((resolve, reject) => {
    probe.once("error", () =>
      reject(
        new Error(
          `Loopback port ${port} must be free before this isolated regression runs.`,
        ),
      ),
    );
    probe.listen(port, "127.0.0.1", resolve);
  });
  await new Promise((resolve) => probe.close(resolve));
}
function proxyHeaders(request) {
  return {
    ...request.headers,
    host: hostname,
    "x-forwarded-host": hostname,
    "x-forwarded-proto": "https",
    "x-forwarded-port": "443",
  };
}
async function startProxy() {
  server = https.createServer(
    {
      key: await readFile(path.join(temporary, "tls.key")),
      cert: await readFile(path.join(temporary, "tls.crt")),
    },
    (request, response) => {
      if (![hostname, `${hostname}:443`].includes(request.headers.host)) {
        response.writeHead(421).end("Unexpected test host");
        return;
      }
      const upstream = http.request(
        {
          hostname: "127.0.0.1",
          port: 3000,
          method: request.method,
          path: request.url,
          headers: proxyHeaders(request),
        },
        (result) => {
          response.writeHead(result.statusCode || 502, result.headers);
          result.pipe(response);
        },
      );
      upstream.on("error", () => {
        if (!response.headersSent) response.writeHead(502);
        response.end("Test upstream unavailable");
      });
      request.on("aborted", () => upstream.destroy());
      request.pipe(upstream);
    },
  );
  server.on("connection", (socket) => {
    sockets.add(socket);
    socket.once("close", () => sockets.delete(socket));
  });
  server.on("upgrade", (request, socket, head) => {
    if (![hostname, `${hostname}:443`].includes(request.headers.host)) {
      socket.destroy();
      return;
    }
    // Preserve HMR WebSocket handshakes and frames through the TLS termination.
    const upstream = net.connect({ host: "127.0.0.1", port: 3000 });
    sockets.add(upstream);
    upstream.once("close", () => sockets.delete(upstream));
    upstream.on("error", () => socket.destroy());
    socket.on("error", () => upstream.destroy());
    socket.once("close", () => upstream.destroy());
    upstream.once("connect", () => {
      const headers = Object.entries(proxyHeaders(request)).flatMap(
        ([key, value]) =>
          (Array.isArray(value) ? value : [value])
            .filter((value) => value !== undefined)
            .map((value) => `${key}: ${value}`),
      );
      upstream.write(
        `${request.method} ${request.url} HTTP/${request.httpVersion}\r\n${headers.join("\r\n")}\r\n\r\n`,
      );
      if (head.length) upstream.write(head);
      socket.pipe(upstream).pipe(socket);
    });
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(443, "127.0.0.1", resolve);
  });
}
function localHttps(route, method = "GET", body, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? undefined : JSON.stringify(body);
    // The endpoint is hard-coded loopback. SNI/Host preserve the simulated public
    // origin, while this one test transport accepts its ephemeral self-signed CA.
    const request = https.request(
      {
        hostname: "127.0.0.1",
        port: 443,
        servername: hostname,
        rejectUnauthorized: false,
        method,
        path: route,
        headers: {
          Host: hostname,
          ...(payload === undefined
            ? {}
            : {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(payload),
              }),
          ...headers,
        },
      },
      (response) => {
        let text = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          text += chunk;
        });
        response.on("end", () => {
          let json;
          try {
            json = JSON.parse(text);
          } catch {}
          resolve({
            status: response.statusCode,
            headers: response.headers,
            json,
          });
        });
      },
    );
    request.setTimeout(15000, () =>
      request.destroy(new Error("Local HTTPS test request timed out.")),
    );
    request.on("error", reject);
    request.end(payload);
  });
}
async function waitReady() {
  const deadline = Date.now() + 90000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null)
      throw new Error(
        "The isolated Next.js development server exited before readiness.",
      );
    try {
      if ((await localHttps("/sign-up")).status === 200) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(
    "The isolated Next.js development server did not become ready.",
  );
}
async function findMail(subject) {
  const folder = path.join(temporary, "data", "mail");
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    for (const name of (await readdir(folder).catch(() => []))
      .sort()
      .reverse()) {
      const mail = JSON.parse(await readFile(path.join(folder, name), "utf8"));
      if (mail.to === email && mail.subject.includes(subject)) return mail;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(
    "The isolated local email outbox did not receive the expected message.",
  );
}
async function mailCount() {
  return (await readdir(path.join(temporary, "data", "mail")).catch(() => []))
    .length;
}
async function cookieHeader() {
  return (await context.cookies(origin))
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
}
async function cleanup() {
  if (cleanupPromise) return cleanupPromise;
  cleanupPromise = (async () => {
    await browser?.close().catch(() => {});
    for (const socket of sockets) socket.destroy();
    if (server?.listening)
      await new Promise((resolve) => server.close(resolve));
    if (child && child.exitCode === null) {
      const exited = once(child, "exit").catch(() => {});
      try {
        process.kill(-child.pid, "SIGTERM");
      } catch {}
      await Promise.race([
        exited,
        new Promise((resolve) => setTimeout(resolve, 5000)),
      ]);
      if (child.exitCode === null) {
        try {
          process.kill(-child.pid, "SIGKILL");
        } catch {}
        await exited;
      }
    }
    if (temporary) {
      serverLog = redact(
        (
          await readFile(path.join(temporary, "next.log"), "utf8").catch(
            () => "",
          )
        )
          .split("\n")
          .slice(-45)
          .join("\n"),
      );
      await rm(temporary, { recursive: true, force: true });
    }
  })();
  return cleanupPromise;
}
for (const signal of ["SIGINT", "SIGTERM"])
  process.once(signal, () => {
    void cleanup().finally(() => process.exit(signal === "SIGINT" ? 130 : 143));
  });

try {
  await assertFreePort(3000);
  await assertFreePort(443);
  temporary = await mkdtemp(path.join(os.tmpdir(), "lumen-forwarded-auth-"));
  await mkdir(path.join(temporary, "data"), { mode: 0o700 });
  const tls = spawnSync(
    "openssl",
    [
      "req",
      "-x509",
      "-newkey",
      "rsa:2048",
      "-nodes",
      "-days",
      "1",
      "-subj",
      `/CN=${hostname}`,
      "-addext",
      `subjectAltName=DNS:${hostname}`,
      "-keyout",
      path.join(temporary, "tls.key"),
      "-out",
      path.join(temporary, "tls.crt"),
    ],
    { stdio: "ignore" },
  );
  assert.equal(
    tls.status,
    0,
    "openssl must create the ephemeral test certificate",
  );
  const log = openSync(path.join(temporary, "next.log"), "w", 0o600);
  try {
    child = spawn(
      process.execPath,
      [
        path.join(root, "node_modules/next/dist/bin/next"),
        "dev",
        "--hostname",
        "127.0.0.1",
        "--port",
        "3000",
      ],
      {
        cwd: root,
        detached: true,
        stdio: ["ignore", log, log],
        env: {
          ...process.env,
          NODE_ENV: "development",
          NEXT_PHASE: "",
          CODESPACES: "true",
          CODESPACE_NAME: "lumen-preview",
          GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN: "app.github.dev",
          BETTER_AUTH_URL: "http://localhost:3000",
          DATABASE_URL: "",
          RESEND_API_KEY: "",
          EMAIL_FROM: "",
          BETTER_AUTH_SECRET: "",
          SPOTIFY_APPROVED_URLS: "",
          LUMEN_DATA_DIR: path.join(temporary, "data"),
        },
      },
    );
  } finally {
    closeSync(log);
  }
  child.on("error", (error) => {
    diagnostics.push(redact(error.message));
  });
  await startProxy();
  await waitReady();
  const inheritedProxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  const browserProxy = inheritedProxy
    ? { server: new URL(inheritedProxy).origin, bypass: hostname }
    : undefined;
  browser = await chromium.launch({
    headless: true,
    proxy: browserProxy,
    args: [`--host-resolver-rules=MAP ${hostname} 127.0.0.1`],
  });
  context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1440, height: 1000 },
  });
  // This context's only permitted origin is the local HTTPS test proxy. No third
  // party player, analytics, remote font, metadata or real email service is used.
  await context.route("**/*", (route) =>
    new URL(route.request().url()).origin === origin
      ? route.continue()
      : route.abort("blockedbyclient"),
  );
  await context.addInitScript(() =>
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
  const page = await context.newPage();
  page.on("pageerror", (error) =>
    browserErrors.push(redact(error.stack || error.message)),
  );
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    consoleTasks.push(
      Promise.all(
        message
          .args()
          .map((arg) =>
            arg
              .evaluate((value) =>
                value &&
                typeof value === "object" &&
                typeof value.stack === "string"
                  ? value.stack
                  : typeof value === "string"
                    ? value
                    : JSON.stringify(value),
              )
              .catch(() => "Unserializable browser console argument"),
          ),
      ).then((args) => browserErrors.push(redact(args.join(" ")))),
    );
  });
  page.on("response", (response) => {
    const url = new URL(response.url());
    if (url.origin === origin && url.pathname.startsWith("/api/auth/"))
      consoleTasks.push(
        response.headerValues("set-cookie").then((values) => {
          sessionHeaders.push(
            ...values.filter((value) => /^[^=]*session_token=/.test(value)),
          );
        }),
      );
  });
  page.setDefaultTimeout(20000);
  page.setDefaultNavigationTimeout(60000);
  await check(
    "HTTPS forwarded browser registration with copied localhost configuration",
    async () => {
      const initialResponse = await page.goto(`${origin}/sign-up`);
      const initialStatus = initialResponse?.status();
      if (initialStatus !== 200) {
        diagnostics.push(
          `Initial browser response: ${initialStatus}; title: ${await page.title()}; body: ${(await page.locator("body").innerText()).slice(0, 900)}`,
        );
      }
      assert.equal(
        initialStatus,
        200,
        "The browser must reach the actual local HTTPS application, not a network proxy error.",
      );
      await page
        .getByRole("textbox", { name: "Your name", exact: true })
        .fill("Forwarded Learner");
      await page
        .getByRole("textbox", { name: "Email address", exact: true })
        .fill(email);
      await page.getByLabel("Password", { exact: true }).fill(password);
      await page
        .getByRole("button", { name: "Create your account", exact: true })
        .click();
      await expect(page.getByRole("status")).toContainText(
        "Your account has been created",
        { timeout: 30000 },
      );
    },
  );
  await check(
    "Verification email and callback use the HTTPS forwarded origin",
    async () => {
      const mail = await findMail("Verify");
      const verification = new URL(mail.url);
      assert.equal(verification.origin, origin);
      assert.equal(verification.pathname, "/api/auth/verify-email");
      const callback = new URL(
        verification.searchParams.get("callbackURL"),
        origin,
      );
      assert.equal(callback.origin, origin);
      assert.equal(callback.pathname, "/space");
      await page.goto(mail.url);
      await expect(page).toHaveURL(`${origin}/space`);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(
        "Your curiosity",
        { timeout: 20000 },
      );
    },
  );
  await check(
    "Forwarded session cookies are Secure, HttpOnly, SameSite Lax and host-only",
    async () => {
      const cookies = (await context.cookies(origin)).filter((cookie) =>
        cookie.name.includes("session_token"),
      );
      assert.equal(cookies.length, 1);
      for (const cookie of cookies) {
        assert.equal(cookie.secure, true);
        assert.equal(cookie.httpOnly, true);
        assert.equal(cookie.sameSite, "Lax");
        assert.equal(cookie.domain, hostname);
        assert.equal(cookie.path, "/");
      }
      assert.equal(
        await page.evaluate(() => document.cookie.includes("session_token")),
        false,
      );
      await Promise.all(consoleTasks);
      assert.ok(
        sessionHeaders.length > 0,
        "The provider must issue a session Set-Cookie header.",
      );
      for (const header of sessionHeaders) {
        assert.match(header, /;\s*Secure(?:;|$)/i);
        assert.match(header, /;\s*HttpOnly(?:;|$)/i);
        assert.match(header, /;\s*SameSite=Lax(?:;|$)/i);
        assert.doesNotMatch(header, /;\s*Domain=/i);
      }
    },
  );
  await check(
    "Authenticated Settings renders and profile/preferences persist through refresh",
    async () => {
      await page.goto(`${origin}/settings`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        "Your preferences.",
      );
      await page
        .getByRole("textbox", { name: "Display name", exact: true })
        .fill("Forwarded Curiosity");
      await page
        .getByRole("button", { name: "Save profile", exact: true })
        .click();
      await expect(page.getByRole("status")).toHaveText(
        "Your profile has been updated.",
      );
      await page
        .getByRole("combobox", { name: "Learning level", exact: true })
        .selectOption("beginner");
      await expect(page.getByRole("status")).toHaveText("Preference saved.");
      await page.reload();
      await expect(
        page.getByRole("textbox", { name: "Display name", exact: true }),
      ).toHaveValue("Forwarded Curiosity");
      await expect(
        page.getByRole("combobox", { name: "Learning level", exact: true }),
      ).toHaveValue("beginner");
    },
  );
  await check(
    "Forwarded sign-out/sign-in and cold 1.6-second RSC Settings navigation retain authentication",
    async () => {
      await page.getByRole("button", { name: "Sign out", exact: true }).click();
      await expect(page).toHaveURL(`${origin}/`);
      await page
        .getByRole("link", { name: "Sign in", exact: true })
        .first()
        .click();
      await page
        .getByRole("textbox", { name: "Email address", exact: true })
        .fill(email);
      await page.getByLabel("Password", { exact: true }).fill(password);
      await page.getByRole("button", { name: "Sign in", exact: true }).click();
      await expect(page).toHaveURL(`${origin}/space`);
      let delayedSettingsRequests = 0;
      await page.route("**/settings*", async (route) => {
        if (route.request().headers().rsc === "1") {
          delayedSettingsRequests += 1;
          await new Promise((resolve) => setTimeout(resolve, 1600));
        }
        await route.continue();
      });
      // A document reload clears the router's in-memory page cache. Intercept
      // before reloading so any prefetch is slow too, then use the actual Link.
      await page.goto(`${origin}/space`);
      await page
        .getByRole("link", { name: "Settings", exact: true })
        .first()
        .click();
      await expect(page).toHaveURL(`${origin}/settings`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        "Your preferences.",
      );
      await expect(
        page.getByRole("textbox", { name: "Display name", exact: true }),
      ).toHaveValue("Forwarded Curiosity");
      assert.ok(
        delayedSettingsRequests > 0,
        "The cold Settings navigation must exercise an actual delayed RSC request.",
      );
      await page.unroute("**/settings*");
    },
  );
  await check(
    "External password-reset callback is rejected without delivering mail",
    async () => {
      const before = await mailCount();
      const result = await localHttps(
        "/api/auth/request-password-reset",
        "POST",
        { email, redirectTo: "https://evil.example/reset-password" },
        { Origin: origin, Cookie: await cookieHeader() },
      );
      assert.ok(
        [400, 403].includes(result.status),
        "Untrusted callback must be rejected.",
      );
      assert.equal(await mailCount(), before);
    },
  );
  await check(
    "Forged password-reset Origin is rejected without delivering mail",
    async () => {
      const before = await mailCount();
      const result = await localHttps(
        "/api/auth/request-password-reset",
        "POST",
        { email, redirectTo: `${origin}/reset-password` },
        { Origin: "https://evil.example", Cookie: await cookieHeader() },
      );
      assert.equal(result.status, 403);
      assert.equal(await mailCount(), before);
    },
  );
  await check(
    "Browser has no console errors, React suspension warnings or uncaught errors",
    async () => {
      await Promise.all(consoleTasks);
      assert.equal(
        browserErrors.length,
        0,
        browserErrors.map(redact).join("\n"),
      );
    },
  );
  await check(
    "Isolated account deletion invalidates the forwarded session",
    async () => {
      const result = await localHttps(
        "/api/account",
        "DELETE",
        { password },
        { Origin: origin, Cookie: await cookieHeader() },
      );
      assert.equal(result.status, 200);
      const session = await localHttps(
        "/api/auth/get-session",
        "GET",
        undefined,
        { Cookie: await cookieHeader() },
      );
      assert.equal(session.status, 200);
      assert.equal(session.json, null);
    },
  );
} catch (error) {
  failure = redact(error.stack || error.message);
  process.exitCode = 1;
} finally {
  await cleanup();
  const passed = checks.filter((check) => check.status === "PASS").length;
  const report = `# Forwarded HTTPS authentication regression\n\nExecuted: ${new Date().toISOString()}\n\nCommand: \`node tests/forwarded-auth.mjs\`. Result: **${failure ? "FAILED" : "PASSED"}** (${passed}/${checks.length} checks passed).\n\nThis is a local HTTPS reverse-proxy simulation, not a deployed or paid GitHub Codespace. It launches a real Next.js development server on loopback port 3000 with isolated persistent PGlite data. GitHub-style environment values select \`${origin}\` despite a copied \`BETTER_AUTH_URL=http://localhost:3000\`. Chromium maps that hostname to loopback, uses an ephemeral self-signed TLS certificate, and accesses the proxy on port 443. The proxy forwards the real Host and HTTPS protocol and tunnels HMR WebSockets. Certificate exceptions apply only to this test browser context and hard-coded local HTTPS transport. Database/provider/secret variables are cleared; no external email, podcast or hosting service is used.\n\n${checks.map((check) => `- ${check.status}: ${check.name}${check.detail ? ` — ${check.detail.split("\n")[0]}` : ""}`).join("\n")}\n\nVerification tokens, cookie values, test passwords and private outbox URLs are not printed or retained in this report. The browser, proxy, spawned process group, certificate, logs and isolated database are removed on completion, including failure. This does not establish production TLS infrastructure, live Codespaces forwarding, external email delivery or cross-browser support.\n${failure ? `\n## Failure diagnostics (redacted)\n\n\`\`\`text\n${failure}\n${browserErrors.join("\n")}\n${diagnostics.join("\n")}\n\`\`\`\n` : ""}`;
  await writeFile(path.join(root, "docs/FORWARDED-AUTH-TEST.md"), report);
  if (failure) {
    process.stderr.write(`FAIL forwarded HTTPS regression: ${failure}\n`);
    if (serverLog)
      process.stderr.write(`Redacted local server log tail:\n${serverLog}\n`);
  } else
    process.stdout.write(
      `Forwarded HTTPS regression: ${passed} checks passed; isolated resources removed.\n`,
    );
}
