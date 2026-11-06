# Lumen

A subject-led home for educational discovery, built with Next.js App Router, TypeScript, Better Auth, Drizzle and PostgreSQL. Original observatory-inspired artwork and a warm paper light theme sit around a functioning learning library. No videos, channels, view counts or activity are invented.

## Open in a browser without installing Node.js

[Create a browser Codespace for Lumen](https://codespaces.new/Seb-Simpson/Lumen?ref=feat%2Flumen-foundation). Review your GitHub Codespaces allowance before creating it; no Codespace is created merely by this repository configuration.

The checked-in dev container installs Node.js 24 and dependencies on GitHub's computer, starts Lumen automatically and forwards port 3000. If a new tab does not open, choose **Ports → Lumen / 3000 → Open in Browser**. Keep port visibility **Private**. See [the browser guide](docs/OPEN-IN-BROWSER.md), including verification emails and stopping the Codespace.

## Run locally

Requires Node.js 22+ and npm. No paid API is required for the local application.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Open **http://localhost:3000**. Persistent embedded PostgreSQL (PGlite) is created under `.data/postgres`; account secrets and development email are also private local files under `.data/`. Keep this directory out of version control. Only one process may open the embedded database. Stop the development server before running database CLI scripts. A normal PostgreSQL connection is supported through `DATABASE_URL` and required in production.

Registration sends a real verification token to `.data/mail/*.json` in local development. In the Codespace terminal, `npm run mail -- your@email.example` prints the newest private message for your registered address; see [account verification instructions](docs/DEVELOPMENT-EMAIL.md). Open the `url` field in the newest message for your email to verify; then sign in. Password recovery uses the same outbox. These files contain sensitive single-use links: do not publish them. For real email, configure `RESEND_API_KEY` and `EMAIL_FROM` for a verified sending domain. Production must set `BETTER_AUTH_SECRET` (at least 32 random characters), `BETTER_AUTH_URL` (the exact HTTPS application origin), `DATABASE_URL`, and the email provider. See [.env.example](.env.example).

```bash
# With the server stopped for embedded PostgreSQL:
npm run db:migrate
npm run db:seed

npm run typecheck
npm test
npx playwright install chromium
# Start the dev server first, then in another terminal:
npm run test:e2e
# Local HTTP integration suite (running dev server; includes network Spotify oEmbed):
npm run test:integration
```

In managed Node.js 24 environments that require an inherited HTTP proxy, use `NODE_USE_ENV_PROXY=1 npm run dev` so server-side Spotify metadata requests honour that proxy and its TLS trust. Ordinary local development does not need this flag.

`npm run build` produces the production Next.js build. Production account and data access require external PostgreSQL and configured authentication/email settings; these services fail closed when configuration is missing. Public editorial pages can render independently. The local outbox and embedded development database are never silently used for production.

## Working features

- Editorial subject browsing, connected knowledge and structured self-directed learning paths.
- Server-side search over real subject/path data, approved podcast metadata and eligible database videos/channels, with filters and a small typo-tolerant matcher.
- Email/password accounts, verified email, password reset, session cookies, logout, profile editing, data export and password-confirmed deletion through Better Auth.
- Private persisted collections, learning goals, notes, interests, preferences and path progress.
- Validated Spotify show/episode metadata via official oEmbed, private saved links, explicit consent-gated official embeds and an optional operator-approved catalogue.
- Responsive navigation, dark/light themes, focus mode, reduced-motion support, cookie preferences, useful empty/error states and zero-video watch routes.

Spotify discovery starts with an empty public catalogue. Set `SPOTIFY_APPROVED_URLS` to comma-separated official show/episode links to approve public entries. Provider metadata failures remain honest empty/error states. Playback is controlled by Spotify and may depend on account, region, browser policy and availability. Lumen does not promise full-length playback.

## Scope and next steps

Video/channel/upload/moderation data models and integration seams are present; public video publishing, adaptive streaming, transcoding, public comments, unrestricted uploads, administrator review UI and AI services are **not enabled**. Do not treat this repository as production-approved without the external checks in [SECURITY](docs/SECURITY.md). See [TEST-REPORT](docs/TEST-REPORT.md) for exactly what was executed. `.github/workflows/ci.yml` runs build, unit, audit and browser checks on supported Ubuntu 24.04; see GitHub Actions for the current run results.

- [Product specification](docs/PRODUCT-SPEC.md)
- [Design system](docs/DESIGN-SYSTEM.md)
- [Asset manifest](docs/ASSET-MANIFEST.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Security review](docs/SECURITY.md)
- [Test report](docs/TEST-REPORT.md)
- [Roadmap](docs/ROADMAP.md)

See the [implementation handoff](docs/BUILD-REPORT.md) for completed, tested, configuration-dependent and future functionality. Browser integration tests require a local development server at `http://localhost:3000` with its private local email outbox.
