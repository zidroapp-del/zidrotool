# ZidroTool 2.5.5 — Production Reliability Fixes

## Fixed in source

- Added `api.mail.gw` as an automatic Mail.tm-compatible temporary-email fallback.
- Added an optional Apify video-extraction fallback (`APIFY_TOKEN`) after Cobalt and yt-dlp.
- Video downloader now surfaces the server error instead of hiding it behind a generic toast.
- YouTube thumbnail proxy now falls back from `maxresdefault`/`sddefault` to `hqdefault` when a requested resolution is unavailable.
- YouTube video statistics now preserve missing counts as `Unavailable` instead of converting them to `0`.
- Added local YouTube category-name mapping so category IDs are displayed as readable names when the Data API is enabled.
- Added `/api/youtube?action=config` diagnostics for checking whether `YOUTUBE_API_KEY` is configured.
- Added explicit creator-category translations in French, German, Spanish, Italian and Arabic to prevent raw keys from appearing in breadcrumbs.
- Added deployment documentation for the optional Apify fallback.

## Production configuration required

For the YouTube analytics tools, set `YOUTUBE_API_KEY` in Vercel.

For video downloading, set `YTDLP_API_URL` (recommended) or `APIFY_TOKEN` / an authorized Cobalt instance.

For temporary email, no extra variable is required for the new default fallback; `TEMPMAIL_API_URL` and `TEMPMAIL_FALLBACK_API_URL` remain configurable.

## Verification

- Node syntax checks passed for `api/youtube.js`, `api/video-download.js`, and `api/tempmail.js`.
- All modified locale files were structurally repaired to one `as const` object.
- A full TypeScript build could not be completed in this isolated environment because the dependency installation could not reach the npm registry; run `npm ci` then `npm run check` locally before deploying.
