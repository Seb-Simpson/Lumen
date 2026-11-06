# Security and privacy review

This is an implementation checklist, not a claim of legal compliance or invulnerability. External review is required before public launch, especially because children may access Lumen.

## Implemented controls

- Authentication, password hashing and session token generation are delegated to Better Auth; no custom password or encryption algorithm is used.
- Verified email is required for password login. Password-reset tokens expire and password resets revoke prior sessions. Sessions expire after seven days and are checked against the database without cookie-session caching.
- Auth cookies are HttpOnly, SameSite Lax and secure in production. Production requires a configured secret and external PostgreSQL. Local secrets/outbox are outside source control and written with restrictive filesystem modes.
- Private API routes require authenticated server sessions. Mutations scope record access by both object identifier and authenticated owner. Collection association checks prevent attaching another user’s private collection.
- State-changing application APIs require the configured Origin and reject cross-site fetches. Better Auth provides its own CSRF/origin validation. Redirects used by forms stay on application routes.
- Zod validates private mutations; JSON bodies have bounded streamed sizes (64 KiB). Drizzle uses parameterised queries. Errors avoid exposing SQL, secrets or provider response bodies.
- Single-instance rate limiting covers sensitive/auth routes; provider rate limiting additionally covers sign-in, sign-up and recovery.
- CSP restricts script/frame/image/network destinations, disables objects and framing; additional headers restrict MIME sniffing, referrers and device permissions. Production HTTPS/HSTS and strict nonce CSP should be verified on the deployment.
- Development request logs omit verification/reset URLs, which contain bearer tokens. Production reverse-proxy logging must apply the same redaction.
- React text rendering escapes user-controlled content. No arbitrary rich HTML or public comments are rendered.
- Spotify URLs must match an official podcast show/episode URL. The metadata request destination is fixed; redirects are disabled and artwork hostnames allowlisted. No scraping or arbitrary URL fetching.
- Account export requires authentication and disables caching. Password-confirmed account deletion removes user-owned rows through foreign keys.
- No analytics or advertising tracking runs. Optional embeds stay unloaded until consent or a direct player-load action. Consent can be rejected, customised and reopened; revocation removes active embeds. Local theme/focus settings are functional preferences.
- Public uploads/comments are disabled. Report, moderation, blocking and upload state models provide foundations without implying an operational administrator review service exists.

## Required before public launch

- [ ] Independent authentication, authorisation, session expiry/revocation and tenant isolation review against production PostgreSQL.
- [ ] HTTPS, production secure cookie attributes, HSTS, exact allowed origin, secret rotation and recovery procedures verified at the real domain.
- [ ] End-to-end verification/reset delivery through the production email provider, including bounce/failure handling and sender-domain authentication.
- [ ] Shared rate-limit storage, trusted reverse-proxy client IP policy, abuse monitoring and capacity limits for multiple application instances.
- [ ] Full dependency audit remediation and ongoing automated updates, SAST and secret scanning.
- [ ] Strict CSP nonce/hashes rather than framework-compatible inline script allowance; test Spotify under the final policy.
- [ ] Least-privilege database credentials, encrypted transport/storage, tested backups and restore, migration rollback strategy and connection limits.
- [ ] Appropriate logs, retention periods, incident response and data subject request handling without exposing tokens or sensitive learning data.
- [ ] UK GDPR/PECR privacy/legal review, Children’s Code assessment, high-privacy age-appropriate defaults and accessible privacy information. Consent UX is a technical control, not legal certification.
- [ ] Moderation/admin queue, reporting operations, blocking UI, appeals and safety controls before public publishing or comments.
- [ ] Upload threat model: signed URLs, quota/rate controls, MIME and magic-byte checks, malware scanning, quarantine, signed processing callbacks and moderation gates before enabling uploads.
- [ ] Validate Spotify terms, third-party consent behaviour, region/account limitations and browser playback on the deployment origin.
- [ ] Keyboard/screen-reader review with assistive technology and independent accessibility testing.

## Known operational limits

Embedded PostgreSQL is intentionally local, single-process development storage. In-memory rate limits reset on restart and are not globally coordinated. There is no production moderation operation or external penetration test. Spotify and email provider availability are external dependencies. CSP allowances and headers must be assessed in the actual hosting topology. Development verification messages contain bearer tokens and must remain private.
