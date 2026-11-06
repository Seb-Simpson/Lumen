# Media integration boundaries

## Implemented now

- Video/channel records model publication, moderation and processing independently. Watch and channel routes expose only public, approved, ready content and approved channels. No videos or creator channels are seeded.
- Unpublished, private, removed and unknown IDs share an unavailable page without revealing draft metadata.
- `VideoPlayer` renders no controls without a real `VideoSource`. Given a source, native HTML video provides play/pause, seek, volume, fullscreen and supplied captions. Lumen adds playback speed, theatre, focus mode, chapters and keyboard shortcuts (K/Space, arrows, M, F, T).
- Authenticated playback progress persists in `watch_history` through `/api/video-progress`; server queries and mutations use the session user and check video publication before saving. Anonymous playback is not recorded. Progress updates are throttled to 15 seconds.
- The watch route currently resolves only explicitly supplied same-origin `/media/*.mp4` and `.webm` assets. Storage keys and remote streaming URLs do not silently become playable.
- Studio visibly disables upload. There is no public upload or comment endpoint.

## Future adapter sequence

1. Authorize an approved creator and enforce per-user/storage quotas.
2. Validate declared size/type and issue a short-lived, scoped signed upload URL from a storage provider. Never put signing credentials in client code.
3. On provider callback, verify signature, ownership and object size; inspect media with a trusted service and malware checks where appropriate.
4. Send an idempotent processing job to an established video service (e.g. Mux, Cloudflare Stream or another reviewed provider). Do not transcode inside a web request.
5. Process signed callbacks into `processing_status`, renditions, captions and thumbnails. Keep drafts private and moderation pending.
6. Review content and channel approval in an authenticated administrator queue. Only approved, ready public content enters discovery/search.
7. A media resolver exchanges an authorized asset reference for a short-lived playback manifest. Add the reviewed media CDN to CSP `media-src`/`connect-src`.
8. Add an adaptive player adapter with HLS/DASH feature detection. Quality controls appear only when the adapter exposes supported renditions. Test captions, seeking, expiry, mobile fullscreen, error recovery and private-asset access.

`VideoSource`, `VideoChapter` and the schema are interfaces, not an active transcoding, DRM or adaptive-streaming service. Chapter metadata is validated before being passed to the player. Transcript and AI interfaces must operate only on genuine provider/source content.

## Spotify

The optional `SPOTIFY_APPROVED_URLS` environment variable is an administrator-maintained, comma-separated list of approved official show/episode URLs. An empty value produces an honest empty public catalogue. oEmbed metadata is fetched from a fixed endpoint, with strict URL validation, a timeout, redirect rejection and image host checks. Allowed CDN artwork is served through a size-limited same-origin image proxy so loading a cover does not disclose a visitor’s IP address to Spotify. Unavailable entries are omitted from public discovery; saved private links receive actionable errors.

The detail player uses Spotify’s official iFrame API (`https://open.spotify.com/embed/iframe-api/v1`) after explicit Load action or consent to third-party embeds. API play/pause controls enable when Spotify reports ready. If the API cannot load, a standard official iframe provides an honest fallback. Episode selection remains in Spotify’s interface where Spotify supports it. Revoking consent destroys the player. No third-party player request occurs before user action/consent. Metadata requests occur after submitted lookup or when a podcast detail page is deliberately opened; they are server-to-server.

Spotify determines previews, sign-in requirements, region, content availability and autoplay. A metadata response does not guarantee full playback. Playback currently stops during route navigation. Persisting it requires a root player provider with deliberate close/revoke behavior and a reviewed privacy policy.

Official references checked 2026-11-05:
- https://developer.spotify.com/documentation/embeds/tutorials/using-the-iframe-api
- https://developer.spotify.com/documentation/embeds/references/iframe-api
- https://developer.spotify.com/documentation/embeds/reference/oembed
