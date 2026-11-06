# Forwarded HTTPS authentication regression

Executed: 2026-11-06T13:35:23.563Z

Command: `node tests/forwarded-auth.mjs`. Result: **PASSED** (9/9 checks passed).

This is a local HTTPS reverse-proxy simulation, not a deployed or paid GitHub Codespace. It launches a real Next.js development server on loopback port 3000 with isolated persistent PGlite data. GitHub-style environment values select `https://lumen-preview-3000.app.github.dev` despite a copied `BETTER_AUTH_URL=http://localhost:3000`. Chromium maps that hostname to loopback, uses an ephemeral self-signed TLS certificate, and accesses the proxy on port 443. The proxy forwards the real Host and HTTPS protocol and tunnels HMR WebSockets. Certificate exceptions apply only to this test browser context and hard-coded local HTTPS transport. Database/provider/secret variables are cleared; no external email, podcast or hosting service is used.

- PASS: HTTPS forwarded browser registration with copied localhost configuration
- PASS: Verification email and callback use the HTTPS forwarded origin
- PASS: Forwarded session cookies are Secure, HttpOnly, SameSite Lax and host-only
- PASS: Authenticated Settings renders and profile/preferences persist through refresh
- PASS: Forwarded sign-out/sign-in and cold 1.6-second RSC Settings navigation retain authentication
- PASS: External password-reset callback is rejected without delivering mail
- PASS: Forged password-reset Origin is rejected without delivering mail
- PASS: Browser has no console errors, React suspension warnings or uncaught errors
- PASS: Isolated account deletion invalidates the forwarded session

Verification tokens, cookie values, test passwords and private outbox URLs are not printed or retained in this report. The browser, proxy, spawned process group, certificate, logs and isolated database are removed on completion, including failure. This does not establish production TLS infrastructure, live Codespaces forwarding, external email delivery or cross-browser support.
