# Test report

Execution dates: 5–6 November 2026; final full browser regression passed on 6 November. Environment: Node.js 24, Next.js 16.4.5, persistent local PGlite PostgreSQL, Chromium 145, desktop 1440×1000 and mobile 390×844. Results below distinguish executed tests from configuration and external dependencies.

## Executed and passing

### Real backend integration

`node tests/backend-flow.mjs` runs against an already-running local development server. All **26 checks passed**, with real Better Auth, HTTP cookies, PostgreSQL and verification/recovery tokens read from the private development outbox. Temporary users are deleted by the test. [Detailed results](BACKEND-TEST-RESULTS.md).

Verified: signed-out private access rejection; registration; unverified login rejection; email verification and auto-session; logout/session invalidation; wrong/right password login; HttpOnly/SameSite cookie attributes; cross-origin mutation rejection; collection create/rename/delete and independent-request persistence; goal create/update; notes create/update with inert HTML text; interests/preferences; path progress validation; invalid Spotify URL rejection; real Spotify oEmbed save and collection membership/rename/deletion behaviour; opt-in search-history recording/private isolation/export/erasure; another user cannot read/update/delete a private collection; private export; recovery token/password reset/session revocation; wrong-password account deletion rejection; actual account deletion and stale-session rejection.

### Browser tests

`npm run test:e2e` uses Playwright Chromium against an existing server. The functional browser flows passed:

- Real signup form, local email verification, session transition into Your Space, collection create/refresh/rename/delete, goal creation/completion, note creation and refresh persistence, signed-in path step marking with refresh persistence, actual Continue Learning display and account cleanup.
- Homepage artwork loads, optional cookies reject correctly, logo returns home, browser back/forward work.
- Cookie customisation/accept/revoke, theme change and reload persistence.
- No invented video player on an unavailable watch route; signed-out Your Space has a working sign-in prompt.
- Mobile drawer closes after navigation; global keyboard search shortcut; home/podcast pages have no horizontal overflow at 390 px.

Subject search (including a typo and zero results), connected subject navigation, self-directed paths, the custom 404 and mobile subject browsing also passed. Automated accessibility results are recorded in the final verification update below.

### Unit tests

`npm test`: **31 tests passed in six files**, including the isolated real provider expiry test and disabled future-media boundary. Coverage includes catalogue identifier/relationship integrity, real search results/typos/filters/sorting, Spotify canonical URL validation, unsafe host/protocol/credentials/path rejection, fixed oEmbed endpoint/no redirects/no untrusted HTML or artwork, provider failure, private mutation origin checks, malformed/oversized JSON and request limiting.

## Requested-flow coverage

| Flow | Result |
| --- | --- |
| Registration, failed/successful login, logout, protected access | Passed real backend and browser checks |
| Session persistence | Passed independent requests, browser refresh and provider session checks |
| Session expiry | Passed isolated real Better Auth/PostgreSQL test: expired database session rejects the original signed cookie |
| Email verification and recovery | Passed end to end using real local outbox tokens; external delivery not configured/tested |
| Existing-subject search, no matches, typo tolerance | Passed unit and browser checks |
| Collection create, rename, delete | Passed backend and browser with refresh persistence |
| Valid Spotify link saving | Passed real Spotify oEmbed metadata save, persistence and collection association |
| Invalid Spotify URL rejection | Passed backend and unit checks |
| Official Spotify embed interaction | Passed official iFrame API preview load, play/pause commands and revocation teardown; audible/full-length playback not established |
| Learning goal create/update | Passed backend and browser completion interaction |
| Cross-user private content access | Passed two-user ownership checks |
| Accept/reject/customise/revoke cookies | Passed browser checks |
| Logo, back/forward, keyboard search | Passed browser checks |
| Mobile layout | Passed measured overflow and drawer navigation; screenshots inspected |
| Zero published videos | Passed; no fabricated stream/player |

## Visual evidence

Screenshots are in [screenshots](screenshots/): desktop/mobile home, paper light theme, subject/search pages, signed-out personal space, signed-in notes and mobile podcasts. Original artwork renders without broken remote links. Review included page composition, mobile cropping, navigation and long-page overflow. Automated accessibility checks supplement visual inspection; they do not replace assistive-technology review.

## Not established by local tests

Production PostgreSQL, HTTPS/TLS/secure cookies behind a real proxy, external email delivery, multiple-instance distributed rate limiting, full Spotify audio/region/account behaviour, paid media processing, public creator publishing and human moderation operations have not been production-tested. No independent penetration test, legal compliance certification or manual screen-reader audit is claimed. Uploads/comments/AI remain disabled or future work.

## Final verification update

- Unit/integration-in-isolation: **31 passed** across six files (`npm test`), including production configuration guards.
- Functional browser flows: **8 passed**, including search/subjects/paths, persisted signed-in learning progress, search-history clearance on sign-out and device theme changes.
- Accessibility browser flow: **1 passed** after correcting search ARIA attributes; zero automatically detectable WCAG 2/2.1 A/AA violations across home, sign-in, subjects and podcasts. Raw results: `screenshots/accessibility-results.json`.
- Backend HTTP integration: **26 passed**, including a real Spotify oEmbed save and opt-in search-history privacy.
- Spotify browser check: no third-party player network requests before user load; official iFrame API preview loaded; play/pause commands enabled and exercised; consent revocation removed the iframe. Audible output/full-length playback was not established. Evidence: `podcast-desktop.png`, `podcast-mobile.png`.
- Dependency audit: **zero known vulnerabilities** after dependency updates (`npm audit`).
- Final `npm run typecheck`: **passed**.
- Final `npm run build`: **passed**, generating all routes successfully with no required external service at build time.

During QA, an eager embedded-database initialisation issue, overrestrictive session-read rate limit and search ARIA defects were reproduced, corrected and retested. Initial audit advisories were resolved. A transient unit resolver failure during a concurrent package-file write was rerun successfully against the stable tree.

The final stable-server Playwright run passed all **9 tests together** (8 functional flows and 1 accessibility flow). Earlier runs interrupted by development hot reloads were rerun without concurrent source edits. The full final suite includes private search-history removal on logout and system-theme changes.

GitHub CI initially reached the browser installation step after passing typecheck, unit tests, build and audit, but `ubuntu-latest` resolved to Ubuntu 26.04, which pinned Playwright 1.58.2 does not support. CI now pins supported Ubuntu 24.04.

## Browser-only setup update (6 November 2026)

Added a GitHub Codespaces dev container, automatic private port-3000 startup and exact forwarded-origin configuration. Six additional tests cover forwarded address derivation, malformed-host rejection, private mutation origins and development-only asset/WebSocket permissions. The current unit suite has **37 tests across seven files**. Shell syntax and local launcher execution were checked; a user-owned Codespace was not created or billed to validate provisioning. See OPEN-IN-BROWSER.md.
