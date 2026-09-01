# ZidroTool 2.5.4 — Reliability Fix Release

## Fixed

- YouTube video statistics now prefer the official YouTube Data API v3 when `YOUTUBE_API_KEY` is configured.
- YouTube metadata has page-parser and oEmbed fallbacks.
- Missing YouTube statistics are displayed as `Unavailable`, not fake `0` values.
- Added like/comment statistics when the YouTube Data API is available.
- YouTube thumbnail downloads now go through a same-origin server proxy to avoid browser CORS/download failures and unavailable resolutions return a proper error.
- Fixed the TikTok downloader translation key (`tool.tiktok-downloader.name`).
- Video downloader now returns actionable provider configuration/extraction errors and supports Cobalt API keys.
- Video downloader provider order is explicit: Cobalt (if configured), then yt-dlp (if configured).
- Temporary email now retries transient provider failures and supports an optional fallback provider.
- Temporary email sessions remember the provider used to create the inbox; subsequent inbox calls are restricted to configured providers to avoid SSRF.
- Added a translation missing-key safety net so raw keys such as `category.creator.name` are never shown to users.
- Added the missing creator/category English fallback labels.
- Added production environment/deployment documentation.

## Required production configuration

For reliable production behavior, configure at least:

- `YOUTUBE_API_KEY`
- `YTDLP_API_URL`

Optional:

- `COBALT_API_URL`
- `COBALT_API_KEY`
- `TEMPMAIL_API_URL`
- `TEMPMAIL_FALLBACK_API_URL`

See `DEPLOYMENT-REQUIREMENTS.md` and `.env.example`.

## Verification

- JavaScript syntax checks passed for all modified server/API files.
- TypeScript parser checks passed for all modified TS/TSX files; the isolated build environment could not complete a full dependency installation because the npm registry was unavailable, so a final `npm run check` must be run locally/CI after `npm ci`.
