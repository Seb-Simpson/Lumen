# Backend integration test results

Executed: 2026-11-05T22:10:42.890Z

Command: `node tests/backend-flow.mjs` against http://localhost:3000.

Uses real HTTP routes, Better Auth, local email outbox and persistent PostgreSQL; temporary accounts are deleted at the end.

- PASS: Protected library rejects signed-out requests
- PASS: New registration creates an unverified account and delivers local verification email
- PASS: Unverified accounts cannot sign in
- PASS: Verification link activates email and creates a real session
- PASS: Logout invalidates the old session and a wrong password is rejected
- PASS: Correct login issues HttpOnly SameSite session cookies
- PASS: Search history is off by default and does not record signed-out or new-user searches
- PASS: Cross-origin mutations are rejected before changing private data
- PASS: Create a collection and persist it across independent requests
- PASS: Save a real Spotify episode with official metadata and collection membership
- PASS: Rename a collection
- PASS: Create and update a learning goal
- PASS: Create and edit a persistent note with inert HTML text
- PASS: Interest and preference changes persist
- PASS: Learning progress is validated and saved
- PASS: Invalid Spotify URLs are rejected
- PASS: Second account cannot read, rename or delete another user’s collection
- PASS: Opted-in search history persists privately and is isolated between accounts
- PASS: Data export includes only the authenticated profile and learning records
- PASS: Disabling search history erases existing records and stops further recording
- PASS: Explicit history deletion clears only the authenticated user’s records
- PASS: Delete collection removes persisted record
- PASS: Delete a saved podcast removes the private persisted record
- PASS: Password recovery delivers a real reset link and revokes previous sessions
- PASS: Account deletion rejects the wrong password
- PASS: Account deletion removes access and invalidates existing session

Not covered by this run: time-based session expiry, delivered external email, external Spotify playback, production PostgreSQL/TLS and multi-instance rate limits.
