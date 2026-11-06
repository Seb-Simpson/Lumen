# Lumen implementation handoff

Built in the existing `Seb-Simpson/Lumen` repository on `feat/lumen-foundation`. This is a working local application and an extensible first release, not a production launch certification or a claim that every future platform feature is enabled.

## Completed

- Next.js App Router, strict TypeScript, self-hosted fonts, reusable shell and discovery/personal/media components, responsive sidebar and mobile drawer, search shortcut, keyboard focus, loading/error/not-found states.
- Distinct observatory/library visual direction, dark and paper light themes, focus and reduced-motion settings, 40 original local assets with provenance and optimisation manifest.
- Twelve original editorial subject guides with explicit related-subject links, connected-knowledge exploration and four self-directed learning journeys. No videos, channels, metrics or learner progress are seeded.
- Real server-powered search over editorial subjects/paths, configured approved Spotify metadata, and eligible public/approved database media. Suggestions, filters, sorting, conservative typo tolerance and private opt-in search history work.
- Better Auth email accounts, mandatory verification, login/logout, recovery/reset, database-backed session checks, profile editing, password-confirmed deletion and private JSON export. Local email tokens are delivered to a protected outbox; no pretend email flow.
- Your Space with database-persisted collection creation/rename/deletion, saved podcast membership, learning goals, notes, interests, settings and path progress. Genuine progress supports continue-learning and learning history. Homepage suggestions explain explicitly selected interests.
- Validated Spotify show/episode links, genuine official oEmbed metadata, private saving, an operator-maintained approved catalogue, detail pages, official iFrame API and player controls. A local artwork proxy and player consent gate prevent browser requests to Spotify before a user action/consent. Revoking consent removes the player.
- PostgreSQL schema/migrations for accounts, library, learning, videos, channels, subscriptions, watch progress, saved resources, reports, moderation, blocking and upload jobs. Reusable native player only activates for an actual supported source. Upload/processing/moderation/AI adapters are explicitly unavailable by default.
- Server ownership checks, origin validation, bounded/validated inputs, safe database queries, provider password handling, rate limits, safe errors, CSP/security headers, production configuration guards and a documented launch checklist.
- Automated tests, screenshots, asset/design/product/architecture/security/roadmap documentation, environment template and GitHub CI workflow.

## Tested

See [TEST-REPORT.md](TEST-REPORT.md) and [BACKEND-TEST-RESULTS.md](BACKEND-TEST-RESULTS.md) for executed commands and results. Tests exercise real provider sessions, local verification/recovery tokens and real PostgreSQL persistence; browser evidence covers desktop, mobile and light mode. External Spotify metadata and player API commands were exercised. Full-length or audible playback is not established.

## Configuration required

Local development needs no paid service. `npm ci` and `npm run dev` create persistent embedded PostgreSQL under `.data/`. Follow the README for the local email outbox and proxy-aware managed environment startup.

Production requires an external PostgreSQL database, an HTTPS origin, a strong authentication secret and a configured verified email sender/provider. Production authentication and database access fail closed when required configuration is absent; public editorial pages can render independently. Operator-approved Spotify links are supplied through `SPOTIFY_APPROVED_URLS`; an empty catalogue is intentional. External email delivery, hosted PostgreSQL operations and production TLS/cookie behaviour need deployment-specific end-to-end tests.

## Prepared or deferred

- Real video publishing, cloud storage, transcoding, adaptive streaming, captions/transcript delivery and a full creator dashboard need a managed media integration. Publishing is disabled.
- Public comments/uploads and a staffed administrator moderation/review workflow are not enabled. Report/block/moderation models are infrastructure, not an operational safety programme.
- Video playlists, creator subscriptions UI, arbitrary resource bookmarks, richer note-to-resource organisation, recently visited subjects and collection ordering remain future work. Current collections genuinely organise saved podcasts.
- Spotify playback stops on navigation; persistent cross-route listening is not implemented. Spotify controls account, region, preview and playback availability.
- Learning paths are self-directed exploration prompts, not video courses, assessments or qualifications. AI summaries, transcript search, quizzes and assistants are interfaces only.
- Multi-instance shared rate limits, production observability/retention/backups, independent security/accessibility review and UK privacy/Children’s Code assessment are launch prerequisites. No legal compliance claim is made.

The roadmap prioritises these gaps explicitly rather than presenting disabled infrastructure as finished product behaviour.
