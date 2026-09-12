import os
import re
import time
from urllib.parse import urlparse
from urllib.request import Request

import yt_dlp
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(
    title="ZidroTool yt-dlp API",
    version="1.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)


ALLOWED_HOSTS = {
    "youtube.com",
    "www.youtube.com",
    "m.youtube.com",
    "youtu.be",
    "youtube-nocookie.com",

    "tiktok.com",
    "www.tiktok.com",
    "m.tiktok.com",

    "facebook.com",
    "www.facebook.com",
    "m.facebook.com",
    "fb.watch",

    "instagram.com",
    "www.instagram.com",

    "x.com",
    "www.x.com",
    "twitter.com",
    "www.twitter.com",
}


def host_allowed(host: str) -> bool:
    host = (host or "").lower().split(":", 1)[0]

    return any(
        host == allowed
        or host.endswith("." + allowed)
        for allowed in ALLOWED_HOSTS
    )


def clean_title(value: str | None) -> str:
    value = (value or "").strip()

    value = re.sub(
        r'[<>:"/\\|?*\x00-\x1F]',
        "_",
        value,
    )

    return value[:240] or "video"


def get_platform(url: str) -> str:
    host = (
        urlparse(url).hostname
        or ""
    ).lower()

    if "tiktok.com" in host:
        return "tiktok"

    if (
        "youtube.com" in host
        or "youtu.be" in host
    ):
        return "youtube"

    if (
        "facebook.com" in host
        or "fb.watch" in host
    ):
        return "facebook"

    if "instagram.com" in host:
        return "instagram"

    if (
        "x.com" in host
        or "twitter.com" in host
    ):
        return "x"

    return "video"


def get_ydl_options(platform: str | None = None) -> dict:
    opts = {
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,

        # Prefer a progressive MP4 so we do not need
        # ffmpeg to merge separate audio/video streams.
        "format": (
            "best[ext=mp4][vcodec!=none][acodec!=none]"
            "/best[ext=mp4][vcodec!=none]"
            "/best"
        ),

        "socket_timeout": 30,
        "retries": 3,
        "fragment_retries": 3,
        "extractor_retries": 2,

        "geo_bypass": True,

        "http_headers": {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 "
                "(KHTML, like Gecko) "
                "Chrome/150.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "en-US,en;q=0.9",
        },
    }

    if platform == "youtube":
        opts["extractor_args"] = {
            "youtube": {
                "player_client": [
                    "android",
                    "web_safari",
                    "web",
                ],
            }
        }

    return opts


def is_youtube_bot_check(message: str) -> bool:
    lowered = (message or "").lower()

    return (
        ("confirm you" in lowered and "bot" in lowered)
        or "sign in to confirm" in lowered
    )


def extract(url: str) -> dict:
    platform = get_platform(url)
    opts = get_ydl_options(platform)

    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(
            url,
            download=False,
        )

        if info is None:
            raise RuntimeError(
                "No video information was returned."
            )

        if info.get("_type") == "playlist":
            entries = [
                x
                for x in (info.get("entries") or [])
                if x
            ]

            if not entries:
                raise RuntimeError(
                    "No video was found."
                )

            info = entries[0]

        video_url = info.get("url")

        if not video_url:
            formats = info.get("formats") or []
            candidates = []

            for fmt in formats:
                fmt_url = fmt.get("url")

                if not fmt_url:
                    continue

                if fmt.get("vcodec") in (
                    None,
                    "none",
                ):
                    continue

                protocol = (
                    fmt.get("protocol")
                    or ""
                ).lower()

                if protocol in {
                    "m3u8",
                    "m3u8_native",
                    "http_dash_segments",
                }:
                    continue

                score = 0

                if (
                    fmt.get("ext")
                    or ""
                ).lower() == "mp4":
                    score += 100

                if fmt.get("acodec") not in (
                    None,
                    "none",
                ):
                    score += 50

                score += (
                    int(
                        fmt.get("height")
                        or 0
                    )
                    / 10000
                )

                candidates.append(
                    (
                        score,
                        fmt_url,
                        fmt,
                    )
                )

            if candidates:
                candidates.sort(
                    key=lambda item: item[0],
                    reverse=True,
                )

                video_url = candidates[0][1]

        if not video_url:
            raise RuntimeError(
                "No direct video URL was returned."
            )

        return {
            "success": True,
            "video_url": video_url,

            "title": clean_title(
                info.get("title")
            ),

            "author": (
                info.get("uploader")
                or info.get("channel")
                or ""
            ),

            "thumbnail": (
                info.get("thumbnail")
                or None
            ),

            "duration": info.get(
                "duration"
            ),

            "platform": (
                info.get("extractor_key")
                or info.get("extractor")
                or platform
            ),

            "ext": info.get("ext") or "mp4",

            "webpage_url": (
                info.get("webpage_url")
                or url
            ),

            "timestamp": int(time.time()),
        }


def validate_url(url: str):
    parsed = urlparse(url)

    if (
        parsed.scheme not in {
            "http",
            "https",
        }
        or not host_allowed(
            parsed.hostname or ""
        )
    ):
        raise HTTPException(
            status_code=400,
            detail="Unsupported or invalid video URL.",
        )


@app.get("/")
def root():
    return {
        "ok": True,
        "service": "ZidroTool yt-dlp API",
        "version": "1.2.0",
    }


@app.get("/health")
def health():
    return {
        "ok": True,
    }


@app.get("/debug")
def debug():
    return {
        "ok": True,
        "service": "ZidroTool yt-dlp API",
        "version": "1.2.0",
        "yt_dlp": getattr(
            yt_dlp,
            "__version__",
            "unknown",
        ),
        "python": os.sys.version,
        "render": os.getenv(
            "RENDER",
            "false",
        ),
        "port": os.getenv(
            "PORT",
            "",
        ),
    }


@app.get("/extract")
def extract_endpoint(
    url: str = Query(
        ...,
        min_length=8,
        max_length=4096,
    )
):
    validate_url(url)

    platform = get_platform(url)

    try:
        return extract(url)

    except Exception as exc:
        message = str(exc)

        bot_check = is_youtube_bot_check(
            message
        )

        print(
            "yt-dlp extraction failed:",
            type(exc).__name__,
            message,
            {
                "platform": platform,
                "bot_check": bot_check,
                "url": url,
            },
            flush=True,
        )

        if bot_check:
            raise HTTPException(
                status_code=502,
                detail=(
                    "YouTube is currently showing a "
                    "bot-verification wall to this server. "
                    "This is a known limitation of running "
                    "yt-dlp from cloud/datacenter IP addresses "
                    "and is not something this service can "
                    "force past. Please try again later."
                ),
                headers={
                    "X-ZidroTool-Error-Code":
                        "YOUTUBE_BOT_CHECK"
                },
            )

        if platform == "tiktok":
            raise HTTPException(
                status_code=502,
                detail=(
                    "TikTok/yt-dlp extraction failed: "
                    f"{message[:500]}"
                ),
                headers={
                    "X-ZidroTool-Error-Code":
                        "TIKTOK_EXTRACTION_FAILED"
                },
            )

        raise HTTPException(
            status_code=502,
            detail=(
                "Video provider could not "
                "extract this URL."
            ),
            headers={
                "X-ZidroTool-Error-Code":
                    "VIDEO_EXTRACTION_FAILED"
            },
        )


@app.get("/download")
def download_endpoint(
    url: str = Query(
        ...,
        min_length=8,
        max_length=4096,
    )
):
    """
    Download/stream the video directly from Render.

    This is important because Vercel should not fetch
    temporary TikTok media URLs directly.
    """

    validate_url(url)

    platform = get_platform(url)

    if platform == "youtube":
        raise HTTPException(
            status_code=404,
            detail=(
                "YouTube video file downloads are not "
                "offered by this service. YouTube metadata "
                "(title, author, duration, thumbnail) is "
                "still available via /extract."
            ),
        )

    try:
        opts = get_ydl_options(platform)

        opts["outtmpl"] = "-"
        opts["quiet"] = True
        opts["no_warnings"] = True

        opts["format"] = (
            "best[ext=mp4][vcodec!=none][acodec!=none]"
            "/best[ext=mp4][vcodec!=none]"
            "/best"
        )

        # Keep YoutubeDL alive until streaming finishes.
        ydl = yt_dlp.YoutubeDL(opts)

        info = ydl.extract_info(
            url,
            download=False,
        )

        if not info:
            raise RuntimeError(
                "No video information returned."
            )

        title = clean_title(
            info.get("title")
        )

        ext = (
            info.get("ext")
            or "mp4"
        ).lower()

        if ext not in {
            "mp4",
            "webm",
            "mkv",
            "mov",
        }:
            ext = "mp4"

        filename = (
            f"{platform}-video.{ext}"
        )

        stream_headers = dict(
            opts.get("http_headers") or {}
        )

        stream_headers.update(
            info.get("http_headers") or {}
        )

        result = ydl.urlopen(
            Request(
                info["url"],
                headers=stream_headers,
            )
        )

        def stream():
            try:
                while True:
                    chunk = result.read(
                        1024 * 1024
                    )

                    if not chunk:
                        break

                    yield chunk

            finally:
                try:
                    result.close()
                except Exception:
                    pass

                try:
                    ydl.close()
                except Exception:
                    pass

        return StreamingResponse(
            stream(),
            media_type="video/mp4",
            headers={
                "Content-Disposition": (
                    f'attachment; filename="{filename}"'
                ),
                "Cache-Control": "no-store",
                "X-ZidroTool-Platform": platform,
                "X-ZidroTool-Title": title,
            },
        )

    except Exception as exc:
        message = str(exc)

        bot_check = is_youtube_bot_check(
            message
        )

        print(
            "yt-dlp download failed:",
            {
                "type": type(exc).__name__,
                "error": message,
                "platform": platform,
                "url": url,
                "bot_check": bot_check,
            },
            flush=True,
        )

        if bot_check:
            raise HTTPException(
                status_code=502,
                detail=(
                    "YouTube is currently showing a "
                    "bot-verification wall to this server."
                ),
                headers={
                    "X-ZidroTool-Error-Code":
                        "YOUTUBE_BOT_CHECK"
                },
            )

        if platform == "tiktok":
            raise HTTPException(
                status_code=502,
                detail=(
                    "TikTok/yt-dlp download failed: "
                    f"{message[:500]}"
                ),
                headers={
                    "X-ZidroTool-Error-Code":
                        "TIKTOK_DOWNLOAD_FAILED"
                },
            )

        raise HTTPException(
            status_code=502,
            detail=(
                "Video provider could not "
                "download this URL."
            ),
            headers={
                "X-ZidroTool-Error-Code":
                    "VIDEO_DOWNLOAD_FAILED"
            },
        )