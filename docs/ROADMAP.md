# Roadmap

## Before inviting public users

1. Complete independent security/accessibility/legal review, production PostgreSQL isolation tests, backup recovery, shared rate limiting and production email delivery tests.
2. Establish editorial governance, approved podcast curation and a real moderation team/administrator queue.
3. Verify end-to-end Spotify player availability and consent behaviour across mobile browsers and regions.
4. Add production monitoring with appropriate privacy/retention controls and a documented incident response process.

## Content and learning

- Publish commissioned or licensed educational video through a managed video service. Integrate signed uploads, processing callbacks, moderation, HLS/DASH, quality selection, captions, chapters and accessible transcripts. Preserve zero-content honesty until publication.
- Support richer resource bookmarks, collection ordering/membership UI, private playlist curation and note organisation tied directly to path/media context.
- Expand subject guides, languages and level-specific paths with editorial evidence and accessible alternatives.
- Surface continue-learning only from actual stored progress; extend explicit-interest recommendations with clear reasons and easy opt-out.

## Scale and platform

- Move the public catalogue/index to a database-backed publishing workflow and use PostgreSQL text/trigram indexing as content grows. Include only public approved records.
- Add provider-neutral object storage/video/email interfaces, queues, idempotent webhooks and signed asset references.
- Expand automated browser coverage to Firefox/WebKit, screen readers, email provider sandbox and external PostgreSQL; add CI gates and dependency review.
- Add operational administration with narrow roles, audit trails, report handling and abuse prevention before enabling creator publishing or public interaction.

## Optional future services

AI summaries, transcript search, learning assistants and quizzes are future interfaces only. Evaluate provenance, accuracy, cost, safeguarding and consent before integrating any model. Avoid fabricated transcripts, opaque learner profiling or engagement-time optimisation.
