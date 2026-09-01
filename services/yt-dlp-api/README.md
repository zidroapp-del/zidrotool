# ZidroTool yt-dlp API

Small Render-ready FastAPI service used as a fallback provider for ZidroTool.

## Local test

```bash
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 10000
```

Then open:

`http://localhost:10000/health`

Extraction:

`http://localhost:10000/extract?url=https%3A%2F%2Fwww.tiktok.com%2F...`

## Render

Create a **Web Service** from this folder, choose the Free plan for testing, and use Docker. Render requires the service to listen on `0.0.0.0`; this Dockerfile uses the `PORT` environment variable. Free services spin down after 15 minutes without inbound traffic and are intended for testing/hobby use, not production.

After deployment, copy the service URL into ZidroTool's `YTDLP_API_URL` environment variable, for example:

`https://your-service.onrender.com`
