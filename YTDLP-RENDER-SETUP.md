# ZidroTool: free yt-dlp fallback

This V4 now contains a Render-ready `services/yt-dlp-api` service and a Vercel provider router.

## Render service

Deploy **only** `services/yt-dlp-api` as a Render Web Service using Docker and the Free plan for testing.

After deployment, set this Vercel environment variable:

`YTDLP_API_URL=https://YOUR-SERVICE.onrender.com`

For the Cobalt primary provider, set:

`COBALT_API_URL=https://YOUR-PERMITTED-COBALT-INSTANCE/`

Do not put API keys in frontend code.

## Local API test

```powershell
curl.exe "http://localhost:10000/health"
```

Then:

```powershell
curl.exe "http://localhost:10000/extract?url=https%3A%2F%2Fwww.tiktok.com%2F@USER%2Fvideo%2FVIDEO_ID"
```

## ZidroTool test after deployment

```powershell
curl.exe "https://YOUR-ZIDRO-DOMAIN.vercel.app/api/video-download?platform=auto&url=ENCODED_VIDEO_URL"
```

The Vercel function first tries the configured Cobalt instance. If it returns no usable download URL, it calls the Render yt-dlp service. The frontend keeps the existing Facebook/TikTok tools intact.
