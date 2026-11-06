# Architecture

## Runtime and boundaries

Next.js 16 App Router serves React 19 pages and server route handlers. TypeScript runs in strict mode. UI modules live in `src/components`; editorial taxonomy/search ranking lives in `src/lib/catalog.ts`; persistence models and connection lifecycle live in `schema.ts` and `db.ts`; authentication is delegated to Better Auth and its Drizzle PostgreSQL adapter. Standard utility icons use Lucide; fonts are self-hosted OFL packages. The styling system uses named CSS variables and responsive component styles rather than introducing an unnecessary component framework.

Server-sensitive modules are imported by route handlers and server pages only. The public auth client uses provider APIs and session cookies. Private library routes derive ownership from the validated server session, never a caller-supplied user ID.

## Database

Development uses persistent PGlite, an actual embedded PostgreSQL runtime, at `.data/postgres`. It is a single-process development solution; do not open it from CLI scripts while Next runs. Production requires `DATABASE_URL` and a managed or self-hosted PostgreSQL instance. Drizzle uses parameterised queries. Checked-in SQL migrations under `drizzle/` are applied in filename order, guarded by a migration ledger and a PostgreSQL advisory lock for external deployments. Authentication/database initialisation is lazy during actual requests so Next route-analysis workers do not open the same embedded database. Initialisation synchronises editorial path definitions with relational path/step records. There are no seeded accounts, published videos, channels or engagement figures.

Core entities:

- Better Auth: users, sessions, accounts, verification tokens.
- Learning library: collections, notes, goals, saved podcasts, preferences/interests, path steps and user progress.
- Future media: channels, video metadata, saved resources, watch progress/history and subscriptions.
- Safety infrastructure: reports, blocked users, upload jobs and moderation state fields.

User-owned records reference users with cascading deletion. Collections can group podcast items; deleting a collection clears that association rather than destroying saved podcast metadata. Notes can carry resource context. Runtime request schemas enforce allowed fields and limits before queries.

## Discovery and search

The checked-in catalogue is editorial production data describing subjects and self-directed paths, not fake videos. The server search endpoint filters and ranks this catalogue, with conservative single-edit typo tolerance, media/subject/level filters and alphabetical ordering. It also queries only public, approved, ready videos under approved channels and approved channel names through bounded parameterised database queries. Approved Spotify metadata is fetched from official oEmbed when configured. Search history is opt-in, session-owned, capped at 20 recent queries and removable. Subject relationships are explicit and inspectable. Future growth should migrate indexing to PostgreSQL full-text/trigram search or a dedicated service through this backend boundary; never publish draft/private video documents to a public index.

## Spotify

`src/lib/spotify.ts` accepts only HTTPS `open.spotify.com/show/{22-character-ID}` and `episode` URLs. It canonicalises links and fetches from the fixed official Spotify oEmbed endpoint with a timeout and no redirects; caller-controlled destinations are never fetched. Artwork hosts are allowlisted. Optional `SPOTIFY_APPROVED_URLS` is an operator-maintained public catalogue; personal saved links are session-owned. The official player is mounted only after embed consent or a direct load action, and can be removed on consent revocation. Provider terms, account requirements and geographical restrictions apply.

## Video integration seams

Video models include creator/channel, taxonomy, level, language, media reference, captions/transcript reference, visibility, moderation/processing state, chapters and resources. The watch route only exposes eligible public, ready, approved content and otherwise displays a real unavailable state. Native playback controls activate only with a supported source. No sample stream is represented as genuine content.

A future media provider adapter should issue bounded signed upload URLs after authorisation; validate size/MIME/magic bytes; quarantine originals; dispatch asynchronous processing and external transcoding; verify signed webhook events idempotently; moderate before publication; and return adaptive streaming manifests through controlled asset references. Publishing stays disabled until these controls, operational quotas and administrator review are working. No production transcoder is implemented here.

## Optional intelligence

Connected knowledge and self-directed paths use transparent editorial relationships. User goals, interests and saved resources form an explicit recommendation foundation rather than invasive behavioural profiling. Future summaries, transcript search, quizzes and assistants need separate provider interfaces, moderation, provenance and privacy review. No AI feature is claimed active.

## Deployment

Deploy the Node.js Next.js application behind HTTPS with external PostgreSQL, correct origin/secret/email configuration and database backups. Run migrations before accepting traffic. The in-process rate limiter must become a shared service before multiple instances are used. Apply observability with secret/token redaction and retention limits. Verify provider email delivery and Spotify playback from the real deployment origin before launch.
