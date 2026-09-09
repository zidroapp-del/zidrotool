# ZidroTool production requirements

## 1. Vercel environment variables

Set these in **Vercel → Project → Settings → Environment Variables**:

- `YOUTUBE_API_KEY` — recommended. Required for reliable public YouTube statistics such as views, likes and comments.
- `YTDLP_API_URL` — recommended for the universal/TikTok/Facebook/Instagram/X video downloader.
- `APIFY_TOKEN` — optional fallback for the video downloader.
- `APIFY_VIDEO_ACTOR` — optional; defaults to `miccho27~social-video-downloader`.
- `COBALT_API_URL` — optional, preferably your own/authorized Cobalt instance.
- `COBALT_API_KEY` — optional, if that Cobalt instance requires an API key.
- `TEMPMAIL_API_URL` — optional; defaults to `https://api.mail.tm`.
- `TEMPMAIL_FALLBACK_API_URL` — optional Mail.tm-compatible fallback.

Do not put server-side API keys in `VITE_*` variables. `VITE_*` values are exposed to the browser.

- `VITE_ADS_ENABLED` — set to `true` only after a real, approved advertising provider is wired into `AdInterstitial`/`AdSlot`. It defaults to unset/`false`, so the interstitial ad modal never renders and no placeholder ad content is shown to users or to Google — this avoids Google's Interstitial/UX penalties from showing an empty "ad space" placeholder.

## 2. YouTube

The YouTube tools now use this order:

1. YouTube Data API v3 when `YOUTUBE_API_KEY` is configured.
2. Public YouTube page parsing as a fallback.
3. YouTube oEmbed for basic title/channel/thumbnail metadata if the page parser is unavailable.

Without `YOUTUBE_API_KEY`, exact public statistics cannot be guaranteed. The UI will show `Unavailable` instead of pretending that a missing value is `0`.

## 3. Video downloads

The production downloader is server-side. Deploy `services/yt-dlp-api` as a separate service (Render/Railway/Fly/etc.) and set its HTTPS URL as `YTDLP_API_URL` in Vercel.

The Vercel API tries configured providers in order:

1. Cobalt, if `COBALT_API_URL` is configured.
2. yt-dlp service, if `YTDLP_API_URL` is configured.
3. Apify actor, if `APIFY_TOKEN` is configured.

If neither is configured, the API returns a clear configuration error instead of a misleading generic failure.

## 4. Temporary email

The API uses `TEMPMAIL_API_URL` and retries transient 5xx/429/timeouts. If `TEMPMAIL_FALLBACK_API_URL` is configured, it automatically tries that provider after the primary provider fails.

## 5. After changing environment variables

Redeploy Vercel so the serverless functions receive the new values.
