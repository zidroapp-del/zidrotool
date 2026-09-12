import os
import re
from urllib.parse import urlparse
from urllib.request import Request

import yt_dlp
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse


APP_VERSION = "1.2.0"


app = FastAPI(
    title="ZidroTool yt-dlp API",
    version=APP_VERSION,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


ALLOWED_HOSTS = {
    # YouTube
    "youtube.com",
    "www.youtube.com",
    "m.youtube.com",
    "youtu.be",
    "www.youtu.be",
    "youtube-nocookie.com",
    "www.youtube-nocookie.com",

    # TikTok
    "tiktok.com",
    "www.tiktok.com",
    "m.tiktok.com",
    "vm.tiktok.com",

    # Facebook
    "facebook.com",
    "www.facebook.com",
    "m.facebook.com",
    "fb.watch",

    # Instagram
    "instagram.com",
    "www.instagram.com",

    # X / Twitter
    "x.com",
    "www.x.com",
    "twitter.com",
    "www.twitter.com",
}


def host_allowed(host: str) -> bool:
    host = (host or "").lower().strip(".")

    if not host:
        return False

    if host in ALLOWED_HOSTS:
        return True

    return any(
        host.endswith("." + allowed)
        for allowed in ALLOWED_HOSTS
    )


def get_platform(url: str) -> str:
    host = (
        urlparse(url).hostname
        or ""
    ).lower()

    if (
        "youtube.com" in host
        or "youtu.be" in host
        or "youtube-nocookie.com" in host
    ):
        return "youtube"

    if "tiktok.com" in host:
        return "tiktok"

    if (
        "facebook.com" in host
        or "fb.watch" in host
    ):
        return "facebook"

    if "instagram.com" in host:
        return "instagram"

    if (
        "twitter.com" in host
        or "x.com" in host
    ):
        return "x"

    return "unknown"


def get_ydl_options(
    platform: str | None = None,
) -> dict:
    options = {
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,

        # Use curl-cffi browser impersonation.
        # This is especially important for TikTok.
        "impersonate": "chrome",

        # Prefer a progressive MP4.
        # This avoids requiring ffmpeg to merge
        # separate audio/video streams.
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
        options["extractor_args"] = {
            "youtube": {
                "player_client": [
                    "android",
                    "web_safari",
                    "web",
                ],
            }
        }

    return options


def is_youtube_bot_check(
    message: str,
) -> bool:
    text = (message or "").lower()

    patterns = [
        "sign in to confirm",
        "confirm you're not a bot",
        "confirm you are not a bot",
        "not a bot",
        "bot verification",
        "bot check",
        "captcha",
        "automated queries",
        "automated request",
        "cookies to continue",
        "use this application",
    ]

    return any(
        pattern in text
        for pattern in patterns
    )


def extract(url: str) -> dict:
    platform = get_platform(url)

    opts = get_ydl_options(platform)

    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(
                url,
                download=False,
            )

        if not info:
            raise RuntimeError(
                "yt-dlp returned no information."
            )

        video_url = info.get("url")

        if not video_url:
            formats = info.get("formats") or []

            candidates = []

            for fmt in formats:
                fmt_url = fmt.get("url")

                if not fmt_url:
                    continue

                ext = (
                    fmt.get("ext")
                    or ""
                ).lower()

                protocol = (
                    fmt.get("protocol")
                    or ""
                ).lower()

                vcodec = (
                    fmt.get("vcodec")
                    or "none"
                )

                acodec = (
                    fmt.get("acodec")
                    or "none"
                )

                if vcodec == "none":
                    continue

                if (
                    "m3u8" in protocol
                    or "m3u8" in fmt_url
                ):
                    continue

                score = 0

                if ext == "mp4":
                    score += 100

                if acodec != "none":
                    score += 50

                try:
                    score += int(
                        fmt.get("height") or 0
                    )
                except Exception:
                    pass

                candidates.append(
                    (
                        score,
                        fmt_url,
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
                "No direct video URL returned."
            )

        return {
            "success": True,
            "video_url": video_url,
            "title": (
                info.get("title")
                or "video"
            ),
            "author": (
                info.get("uploader")
                or info.get("channel")
                or ""
            ),
            "thumbnail": (
                info.get("thumbnail")
                or ""
            ),
            "duration": (
                info.get("duration")
            ),
            "platform": platform,
            "ext": (
                info.get("ext")
                or "mp4"
            ),
            "webpage_url": (
                info.get("webpage_url")
                or url
            ),
            "timestamp": (
                info.get("timestamp")
            ),
        }

    except Exception as exc:
        message = str(exc)

        # IMPORTANT:
        # Some exceptions can have an empty str(exc).
        # repr(exc) lets us see the actual exception.
        exc_type = type(exc).__name__
        message_for_log = repr(exc)

        bot_check = is_youtube_bot_check(
            message
        )

        print(
            "yt-dlp extraction failed:",
            exc_type,
            message_for_log,
            {
                "platform": platform,
                "bot_check": bot_check,
                "url": url,
            },
            flush=True,
        )

        if (
            platform == "youtube"
            and bot_check
        ):
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
                    f"{exc_type}: "
                    f"{message_for_log[:1000]}"
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


def validate_url(url: str):
    parsed = urlparse(url)

    if (
        parsed.scheme
        not in {"http", "https"}
        or not host_allowed(
            parsed.hostname or ""
        )
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported or invalid video URL."
            ),
        )


@app.get("/")
def root():
    return {
        "ok": True,
        "service": "ZidroTool yt-dlp API",
        "version": APP_VERSION,
    }


@app.get("/health")
def health():
    return {
        "ok": True,
        "version": APP_VERSION,
    }


@app.get("/debug")
def debug():
    return {
        "ok": True,
        "service": "ZidroTool yt-dlp API",
        "version": APP_VERSION,

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
    ),
):
    validate_url(url)

    platform = get_platform(url)

    try:
        print(
            "yt-dlp extraction request:",
            {
                "platform": platform,
                "url": url,
            },
            flush=True,
        )

        result = extract(url)

        return result

    except HTTPException:
        raise

    except Exception as exc:
        message = str(exc)

        print(
            "extract endpoint failed:",
            type(exc).__name__,
            repr(exc),
            {
                "platform": platform,
                "url": url,
            },
            flush=True,
        )

        raise HTTPException(
            status_code=502,
            detail=(
                "Video provider could not "
                "extract this URL."
            ),
        )


@app.get("/download")
def download_endpoint(
    url: str = Query(
        ...,
        min_length=8,
        max_length=4096,
    ),
):
    """
    Download/stream the video directly from Render.
    """

    validate_url(url)

    platform = get_platform(url)

    # YouTube file downloads remain disabled.
    # Metadata extraction is still supported.
    if platform == "youtube":
        raise HTTPException(
            status_code=404,
            detail=(
                "YouTube file downloads are "
                "currently disabled."
            ),
            headers={
                "X-ZidroTool-Error-Code":
                    "YOUTUBE_DOWNLOAD_DISABLED"
            },
        )

    ydl = None
    result = None

    try:
        opts = get_ydl_options(platform)

        opts["quiet"] = True
        opts["no_warnings"] = True

        # Force a single-file format.
        opts["format"] = (
            "best[ext=mp4][vcodec!=none][acodec!=none]"
            "/best[ext=mp4][vcodec!=none]"
            "/best"
        )

        ydl = yt_dlp.YoutubeDL(opts)

        info = ydl.extract_info(
            url,
            download=False,
        )

        if not info:
            raise RuntimeError(
                "yt-dlp returned no information."
            )

        video_url = info.get("url")

        if not video_url:
            formats = info.get("formats") or []

            candidates = []

            for fmt in formats:
                fmt_url = fmt.get("url")

                if not fmt_url:
                    continue

                ext = (
                    fmt.get("ext")
                    or ""
                ).lower()

                protocol = (
                    fmt.get("protocol")
                    or ""
                ).lower()

                vcodec = (
                    fmt.get("vcodec")
                    or "none"
                )

                acodec = (
                    fmt.get("acodec")
                    or "none"
                )

                if vcodec == "none":
                    continue

                if (
                    "m3u8" in protocol
                    or "m3u8" in fmt_url
                ):
                    continue

                score = 0

                if ext == "mp4":
                    score += 100

                if acodec != "none":
                    score += 50

                try:
                    score += int(
                        fmt.get("height") or 0
                    )
                except Exception:
                    pass

                candidates.append(
                    (
                        score,
                        fmt_url,
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
                "No direct video URL returned."
            )

        title = (
            info.get("title")
            or "video"
        )

        ext = (
            info.get("ext")
            or "mp4"
        )

        filename = (
            re.sub(
                r"[^A-Za-z0-9._-]+",
                "_",
                title,
            ).strip("_")
            or f"{platform}-video"
        )

        filename = (
            f"{filename}.{ext}"
        )

        # TikTok CDN links can require the exact
        # headers returned by yt-dlp.
        stream_headers = dict(
            opts.get("http_headers") or {}
        )

        info_headers = (
            info.get("http_headers")
            or {}
        )

        stream_headers.update(
            info_headers
        )

        request = Request(
            video_url,
            headers=stream_headers,
        )

        result = ydl.urlopen(request)

        content_type = (
            result.headers.get(
                "Content-Type"
            )
            or "video/mp4"
        )

        content_length = (
            result.headers.get(
                "Content-Length"
            )
        )

        response_headers = {
            "Content-Disposition": (
                f'attachment; filename="{filename}"'
            ),
            "Cache-Control": "no-store",
        }

        if content_length:
            response_headers[
                "Content-Length"
            ] = content_length

        return StreamingResponse(
            result,
            media_type=content_type,
            headers=response_headers,
        )

    except Exception as exc:
        message = str(exc)

        bot_check = is_youtube_bot_check(
            message
        )

        print(
            "yt-dlp download failed:",
            type(exc).__name__,
            message,
            {
                "platform": platform,
                "bot_check": bot_check,
                "url": url,
            },
            flush=True,
        )

        if result is not None:
            try:
                result.close()
            except Exception:
                pass

        if ydl is not None:
            try:
                ydl.close()
            except Exception:
                pass

        if (
            platform == "youtube"
            and bot_check
        ):
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
                    "TikTok download failed: "
                    f"{type(exc).__name__}: "
                    f"{repr(exc)[:1000]}"
                ),
                headers={
                    "X-ZidroTool-Error-Code":
                        "TIKTOK_DOWNLOAD_FAILED"
                },
            )

        raise HTTPException(
            status_code=502,
            detail=(
                "Video download failed."
            ),
            headers={
                "X-ZidroTool-Error-Code":
                    "VIDEO_DOWNLOAD_FAILED"
            },
        )