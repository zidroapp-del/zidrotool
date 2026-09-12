import os
import re
from urllib.parse import urlparse

import requests
import yt_dlp
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse


APP_VERSION = "1.3.1"


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
    host = (urlparse(url).hostname or "").lower()

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


def get_ydl_options(platform: str | None = None) -> dict:
    options = {
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,

        "format": (
            "best[ext=mp4][vcodec!=none][acodec!=none]"
            "/best[ext=mp4][vcodec!=none]"
            "/best"
        ),

        "socket_timeout": 30,
        "retries": 5,
        "fragment_retries": 5,
        "extractor_retries": 3,

        "geo_bypass": True,

        "http_headers": {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 "
                "(KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            "Accept": (
                "text/html,application/xhtml+xml,"
                "application/xml;q=0.9,image/avif,"
                "image/webp,*/*;q=0.8"
            ),
            "Accept-Language": "en-US,en;q=0.9",
        },
    }

    # TikTok:
    # Do NOT use yt-dlp "impersonate" here.
    # Earlier testing showed that impersonation caused
    # an AssertionError with the current environment.
    if platform == "tiktok":
        options["http_headers"]["Referer"] = (
            "https://www.tiktok.com/"
        )

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


def is_youtube_bot_check(message: str) -> bool:
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


def extract_tiktok_fallback(url: str) -> dict:
    """
    TikWM fallback for TikTok.

    This is used when yt-dlp cannot extract the TikTok URL,
    for example when TikTok returns HTTP 403 to the Render IP.
    """

    try:
        response = requests.post(
            "https://www.tikwm.com/api/",
            data={
                "url": url,
                "hd": 1,
            },
            headers={
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 "
                    "(KHTML, like Gecko) "
                    "Chrome/124.0.0.0 Safari/537.36"
                ),
                "Accept": "application/json",
            },
            timeout=20,
        )

        response.raise_for_status()

        data = response.json()

        if data.get("code") != 0:
            raise RuntimeError(
                f"TikWM API error: {data.get('msg')}"
            )

        result = data.get("data") or {}

        video_url = (
            result.get("play")
            or result.get("wmplay")
        )

        if not video_url:
            raise RuntimeError(
                "TikWM returned no video URL."
            )

        author = result.get("author") or {}

        return {
            "success": True,
            "video_url": video_url,
            "title": (
                result.get("title")
                or "TikTok Video"
            ),
            "author": (
                author.get("nickname")
                or author.get("unique_id")
                or ""
            ),
            "thumbnail": (
                result.get("cover")
                or result.get("origin_cover")
                or ""
            ),
            "duration": result.get("duration"),
            "platform": "tiktok",
            "ext": "mp4",
            "webpage_url": url,
            "timestamp": result.get("create_time"),
            "provider": "tikwm",
        }

    except Exception as exc:
        print(
            "TikWM fallback failed:",
            type(exc).__name__,
            repr(exc),
            flush=True,
        )

        raise RuntimeError(
            f"TikTok fallback failed: {repr(exc)}"
        )


def select_video_url(info: dict) -> str | None:
    video_url = info.get("url")

    if video_url:
        return video_url

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

    if not candidates:
        return None

    candidates.sort(
        key=lambda item: item[0],
        reverse=True,
    )

    return candidates[0][1]


def extract(url: str) -> dict:
    platform = get_platform(url)
    options = get_ydl_options(platform)

    try:
        with yt_dlp.YoutubeDL(options) as ydl:
            info = ydl.extract_info(
                url,
                download=False,
            )

        if not info:
            raise RuntimeError(
                "yt-dlp returned no information."
            )

        video_url = select_video_url(info)

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
            "duration": info.get("duration"),
            "platform": platform,
            "ext": (
                info.get("ext")
                or "mp4"
            ),
            "webpage_url": (
                info.get("webpage_url")
                or url
            ),
            "timestamp": info.get("timestamp"),
            "provider": "yt-dlp",
        }

    except Exception as exc:
        message = str(exc)
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

        # TikTok fallback
        if platform == "tiktok":
            print(
                "Attempting TikWM fallback...",
                flush=True,
            )

            try:
                return extract_tiktok_fallback(
                    url
                )

            except Exception as fallback_exc:
                print(
                    "All TikTok providers failed:",
                    repr(fallback_exc),
                    flush=True,
                )

                raise HTTPException(
                    status_code=502,
                    detail=(
                        "TikTok extraction failed on "
                        "all providers: "
                        f"{repr(fallback_exc)[:1000]}"
                    ),
                    headers={
                        "X-ZidroTool-Error-Code":
                            "TIKTOK_EXTRACTION_FAILED"
                    },
                )

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
        parsed.scheme not in {"http", "https"}
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
            "Video extraction request:",
            {
                "platform": platform,
                "url": url,
            },
            flush=True,
        )

        return extract(url)

    except HTTPException:
        raise

    except Exception as exc:
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
    validate_url(url)

    platform = get_platform(url)

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

    try:
        extracted_info = extract(url)

        video_url = extracted_info.get(
            "video_url"
        )

        if not video_url:
            raise RuntimeError(
                "No video URL available."
            )

        title = (
            extracted_info.get("title")
            or "video"
        )

        ext = (
            extracted_info.get("ext")
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

        filename = f"{filename}.{ext}"

        request_headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 "
                "(KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
        }

        if platform == "tiktok":
            request_headers["Referer"] = (
                "https://www.tiktok.com/"
            )

        response = requests.get(
            video_url,
            headers=request_headers,
            stream=True,
            timeout=30,
        )

        response.raise_for_status()

        content_type = (
            response.headers.get(
                "Content-Type"
            )
            or "video/mp4"
        )

        content_length = (
            response.headers.get(
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
            response.iter_content(
                chunk_size=64 * 1024
            ),
            media_type=content_type,
            headers=response_headers,
        )

    except HTTPException:
        raise

    except Exception as exc:
        print(
            "Video download failed:",
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
                "Video download failed: "
                f"{type(exc).__name__}: "
                f"{repr(exc)[:500]}"
            ),
            headers={
                "X-ZidroTool-Error-Code":
                    "VIDEO_DOWNLOAD_FAILED"
            },
        )