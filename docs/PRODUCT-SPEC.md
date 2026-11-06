# Lumen product specification

Curiosity deserves a better platform. Lumen is a subject-led educational discovery platform for students and independent learners. Editorial subject guides and self-directed paths are the initial content: there are no seeded videos, creators, engagement counts or progress claims.

## Implementation plan
1. Establish a Next.js App Router application, typed domain catalogue, Drizzle/PostgreSQL persistence and Better Auth email accounts.
2. Build responsive editorial discovery, connected subject pages, backend search, and private collections, goals and notes.
3. Integrate validated Spotify links and consent-gated official playback; provide honest unpublished video and creator surfaces.
4. Persist learning progress, preferences and interests; refine accessibility, theme, focus and navigation.
5. Run type/build/unit/integration/browser checks and record limitations before public launch.

The platform must protect private data by session and ownership on the server. Optional third-party embeds require explicit consent or a user-initiated load. No analytics, unrestricted uploads, public comments or AI generation are active.
