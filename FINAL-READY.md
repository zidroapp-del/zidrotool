# ZidroTool 2.5.5 — Clean Working Release

This archive is the clean working source release for continuing ZidroTool development.

## Before `npm run dev` / deployment

1. Install Node.js 22.x.
2. Run `npm ci` from the project root.
3. Copy `.env.example` to `.env.local` for local development and fill only the values you actually use.
4. Run `npm run check` to run TypeScript + production build.
5. Run `npm run dev` for local testing.

## Production environment variables

Server-side values belong in Vercel Environment Variables, not in `VITE_*` variables:

- `YOUTUBE_API_KEY`
- `YTDLP_API_URL`
- `APIFY_TOKEN` (optional)
- `APIFY_VIDEO_ACTOR` (optional)
- `COBALT_API_URL` (optional)
- `COBALT_API_KEY` (optional)
- `TEMPMAIL_API_URL` (optional)
- `TEMPMAIL_FALLBACK_API_URL` (optional)

Deploy `services/yt-dlp-api` separately as a Docker Web Service, then put its HTTPS URL into `YTDLP_API_URL`.

## Important

The archive intentionally does not include `node_modules`, build output, local environment secrets, or TypeScript incremental cache files.
