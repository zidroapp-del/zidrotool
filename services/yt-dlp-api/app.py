import os
import re
import shutil
import time
from typing import Any
from urllib.parse import urlparse

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
    allow_methods=["GET"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# Supported platforms
# ---------------------------------------------------------

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


def validate_url(url: str) -> None:
    parsed = urlparse(url)

    if (
        parsed.scheme not in {"http", "https"}
        or not parsed.hostname
        or not host_allowed(parsed.hostname)
    ):
        raise HTTPException(
            status_code=400,
            detail="Unsupported or invalid video URL.",
        )


# ---------------------------------------------------------
# Helpers
# ---------------------------------------------------------

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

    if "youtube.com" in host or "youtu.be" in host:
        return "youtube"

    if "tiktok.com" in host:
        return "tiktok"

    if "facebook.com" in host or "fb.watch" in host:
        return "facebook"

    if "instagram.com" in host:
        return "instagram"

    if "x.com" in host or "twitter.com" in host:
        return "x"

    return "video"


def find_deno() -> str | None:
    """
    Render normally exposes Deno through PATH.

    We also support the known Render path shown by the
    diagnostic endpoint.
    """

    candidates = [
        os.getenv("DENO_PATH"),
        shutil.which("deno"),
        "/root/.deno/bin/deno",
        "/usr/local/bin/deno",
    ]

    for path in candidates:
        if path and os.path.isfile(path):
            return path

    return None


def build_base_options() -> dict[str, Any]:
    user_agent = (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 "
        "(KHTML, like Gecko) "
        "Chrome/150.0.0.0 Safari/537.36"
    )

    options: dict[str, Any] = {
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,

        "socket_timeout": 30,
        "retries": 3,
        "fragment_retries": 3,
        "extractor_retries": 2,

        "geo_bypass": True,

        "http_headers": {
            "User-Agent": user_agent,
            "Accept-Language": "en-US,en;q=0.9",
        },

        # Prefer a progressive MP4 so ffmpeg is not required
        # for the normal download path.
        "format": (
            "best[ext=mp4][vcodec!=none][acodec!=none]"
            "/best[ext=mp4][vcodec!=none]"
            "/best"
        ),
    }

    # Explicitly tell yt-dlp which JS runtime is available.
    #
    # Deno is recommended by yt-dlp for EJS.
    deno_path = find_deno()

    if deno_path:
        options["js_runtimes"] = {
            "deno": {
                "path": deno_path,
            }
        }
    else:
        options["js_runtimes"] = {
            "deno": {},
        }

    # yt-dlp-ejs is installed, but allowing the GitHub source
    # gives yt-dlp another way to obtain EJS components if
    # needed.
    options["remote_components"] = {
        "ejs:github",
    }

    return options


# ---------------------------------------------------------
# YouTube
# ---------------------------------------------------------

def build_youtube_options() -> dict[str, Any]:
    """
    Build YouTube options separately.

    We do NOT hard-force only android/web_safari.

    The current yt-dlp YouTube extractor changes its client
    strategy over time, so keeping the default client strategy
    is safer than permanently forcing an outdated combination.
    """

    options = build_base_options()

    # Let current yt-dlp choose its supported default clients.
    #
    # This is intentional.
    # Do not force:
    # android + web_safari + web
    #
    # Those clients have different PO-token / SABR constraints.
    options["extractor_args"] = {
        "youtube": {
            "player_client": ["default"],
        }
    }

    return options


def build_options(platform: str) -> dict[str, Any]:
    if platform == "youtube":
        return build_youtube_options()

    return build_base_options()


# ---------------------------------------------------------
# Error detection
# ---------------------------------------------------------

def is_youtube_bot_check(message: str) -> bool:
    lowered = (message or "").lower()

    return (
        (
            "confirm you" in lowered
            and "bot" in lowered
        )
        or "sign in to confirm" in lowered
        or "not a bot" in lowered
        or "captcha" in lowered
    )


def is_player_response_error(message: str) -> bool:
    lowered = (message or "").lower()

    return (
        "failed to extract any player response" in lowered
        or "unable to extract initial player response" in lowered
        or "failed to extract player response" in lowered
    )


# ---------------------------------------------------------
# yt-dlp extraction
# ---------------------------------------------------------

def extract_info(url: str) -> dict[str, Any]:
    platform = get_platform(url)
    options = build_options(platform)

    with yt_dlp.YoutubeDL(options) as ydl:
        info = ydl.extract_info(
            url,
            download=False,
        )

    if not info:
        raise RuntimeError(
            "No video information was returned."
        )

    if info.get("_type") == "playlist":
        entries = [
            entry
            for entry in (info.get("entries") or [])
            if entry
        ]

        if not entries:
            raise RuntimeError(
                "No video was found."
            )

        info = entries[0]

    video_url = info.get("url")

    # Some extractors expose the selected URL only
    # through the formats list.
    if not video_url:
        formats = info.get("formats") or []

        candidates = []

        for fmt in formats:
            fmt_url = fmt.get("url")

            if not fmt_url:
                continue

            if fmt.get("vcodec") in {
                None,
                "none",
            }:
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
                (fmt.get("ext") or "").lower()
                == "mp4"
            ):
                score += 100

            if fmt.get("acodec") not in {
                None,
                "none",
            }:
                score += 50

            height = fmt.get("height") or 0

            try:
                score += float(height) / 10000
            except (TypeError, ValueError):
                pass

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

        "ext": (
            info.get("ext")
            or "mp4"
        ),

        "webpage_url": (
            info.get("webpage_url")
            or url
        ),

        "timestamp": int(time.time()),
    }


# ---------------------------------------------------------
# Root / health / diagnostics
# ---------------------------------------------------------

@app.get("/")
def root():
    deno = find_deno()

    return {
        "ok": True,
        "service": "ZidroTool yt-dlp API",
        "version": APP_VERSION,
        "yt_dlp": yt_dlp.version.__version__,
        "deno_available": bool(deno),
        "deno_path": deno,
    }


@app.get("/health")
def health():
    return {
        "ok": True,
        "service": "ZidroTool yt-dlp API",
        "version": APP_VERSION,
    }


@app.get("/debug")
def debug():
    """
    Diagnostic endpoint.

    Useful because Render Free does not provide Shell access.
    """

    deno_path = find_deno()

    try:
        import yt_dlp_ejs

        ejs_version = getattr(
            yt_dlp_ejs,
            "__version__",
            "installed",
        )
    except Exception:
        ejs_version = None

    return {
        "python": os.sys.version,
        "yt_dlp": yt_dlp.version.__version__,
        "yt_dlp_ejs": ejs_version,
        "deno": deno_path,
        "deno_available": bool(deno_path),
        "render": os.getenv("RENDER"),
        "port": os.getenv("PORT"),
    }


# ---------------------------------------------------------
# Extract endpoint
# ---------------------------------------------------------

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
        return extract_info(url)

    except Exception as exc:
        message = str(exc)

        print(
            "yt-dlp extraction failed:",
            {
                "type": type(exc).__name__,
                "error": message,
                "platform": platform,
                "url": url,
                "bot_check": is_youtube_bot_check(message),
                "player_response_error": (
                    is_player_response_error(message)
                ),
            },
            flush=True,
        )

        if is_youtube_bot_check(message):
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

        if is_player_response_error(message):
            raise HTTPException(
                status_code=502,
                detail=(
                    "YouTube did not return a usable "
                    "player response to the Render server. "
                    "yt-dlp, EJS and Deno are installed, "
                    "but YouTube is currently refusing or "
                    "withholding the player response."
                ),
                headers={
                    "X-ZidroTool-Error-Code":
                        "YOUTUBE_PLAYER_RESPONSE"
                },
            )

        raise HTTPException(
            status_code=502,
            detail=(
                "Video provider could not extract this URL."
            ),
            headers={
                "X-ZidroTool-Error-Code":
                    "VIDEO_EXTRACTION_FAILED"
            },
        )


# ---------------------------------------------------------
# Download endpoint
# ---------------------------------------------------------

@app.get("/download")
def download_endpoint(
    url: str = Query(
        ...,
        min_length=8,
        max_length=4096,
    )
):
    """
    Stream the extracted media through Render.

    The browser should download this response directly.
    """

    validate_url(url)

    platform = get_platform(url)

    ydl = None
    result = None

    try:
        options = build_options(platform)

        # We do not use stdout for the actual response.
        # We first extract the media URL and then stream it
        # using yt-dlp's request opener.
        ydl = yt_dlp.YoutubeDL(options)

        info = ydl.extract_info(
            url,
            download=False,
        )

        if not info:
            raise RuntimeError(
                "No video information returned."
            )

        if info.get("_type") == "playlist":
            entries = [
                entry
                for entry in (info.get("entries") or [])
                if entry
            ]

            if not entries:
                raise RuntimeError(
                    "No video was found."
                )

            info = entries[0]

        media_url = info.get("url")

        if not media_url:
            formats = info.get("formats") or []

            candidates = []

            for fmt in formats:
                fmt_url = fmt.get("url")

                if not fmt_url:
                    continue

                if fmt.get("vcodec") in {
                    None,
                    "none",
                }:
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
                    (fmt.get("ext") or "").lower()
                    == "mp4"
                ):
                    score += 100

                if fmt.get("acodec") not in {
                    None,
                    "none",
                }:
                    score += 50

                try:
                    score += float(
                        fmt.get("height") or 0
                    ) / 10000
                except (TypeError, ValueError):
                    pass

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

                media_url = candidates[0][1]

        if not media_url:
            raise RuntimeError(
                "No direct media URL was returned."
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

        # Use yt-dlp's opener so relevant HTTP headers
        # from the extractor session are retained.
        result = ydl.urlopen(
            media_url
        )

        content_type = (
            result.headers.get("Content-Type")
            or "video/mp4"
        )

        # Avoid accidentally returning HTML/JSON as a video.
        lowered_content_type = content_type.lower()

        if (
            "text/html" in lowered_content_type
            or "application/json" in lowered_content_type
        ):
            raise RuntimeError(
                "The provider returned a non-video response."
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
                    if ydl is not None:
                        ydl.close()
                except Exception:
                    pass

        headers = {
            "Content-Disposition": (
                f'attachment; filename="{filename}"'
            ),
            "Cache-Control": "no-store",
            "X-ZidroTool-Platform": platform,
            "X-ZidroTool-Title": title,
        }

        content_length = (
            result.headers.get("Content-Length")
        )

        if content_length:
            headers["Content-Length"] = content_length

        return StreamingResponse(
            stream(),
            media_type=content_type,
            headers=headers,
        )

    except Exception as exc:
        message = str(exc)

        print(
            "yt-dlp download failed:",
            {
                "type": type(exc).__name__,
                "error": message,
                "platform": platform,
                "url": url,
                "bot_check": is_youtube_bot_check(message),
            },
            flush=True,
        )

        try:
            if result is not None:
                result.close()
        except Exception:
            pass

        try:
            if ydl is not None:
                ydl.close()
        except Exception:
            pass

        if is_youtube_bot_check(message):
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
                "Video provider could not download this URL."
            ),
            headers={
                "X-ZidroTool-Error-Code":
                    "VIDEO_DOWNLOAD_FAILED"
            },
        )