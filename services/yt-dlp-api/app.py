import importlib.util
import os
import re
import shutil
import sys
import time
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


USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 "
    "(KHTML, like Gecko) "
    "Chrome/150.0.0.0 Safari/537.36"
)


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
    host = (urlparse(url).hostname or "").lower()

    if "tiktok.com" in host:
        return "tiktok"

    if "youtube.com" in host or "youtu.be" in host:
        return "youtube"

    if "facebook.com" in host or "fb.watch" in host:
        return "facebook"

    if "instagram.com" in host:
        return "instagram"

    if "x.com" in host or "twitter.com" in host:
        return "x"

    return "video"


def get_js_runtime() -> tuple[str | None, str | None]:
    """
    Detect an installed JavaScript runtime.

    yt-dlp currently needs an external JS runtime for
    full YouTube support.

    Priority:
      1. Deno
      2. Node
      3. Bun
    """

    deno = shutil.which("deno")
    if deno:
        return "deno", deno

    node = shutil.which("node")
    if node:
        return "node", node

    bun = shutil.which("bun")
    if bun:
        return "bun", bun

    return None, None


def get_ydl_options(platform: str | None = None) -> dict:
    opts = {
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,

        # Prefer a single-file MP4 with audio.
        # This avoids requiring ffmpeg for the current
        # direct-stream implementation.
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
            "User-Agent": USER_AGENT,
            "Accept-Language": "en-US,en;q=0.9",
        },
    }

    # ---------------------------------------------------------
    # JavaScript runtime / EJS
    # ---------------------------------------------------------

    runtime_name, runtime_path = get_js_runtime()

    if runtime_name:
        opts["js_runtimes"] = {
            runtime_name: {
                "path": runtime_path,
            }
        }

    # ---------------------------------------------------------
    # YouTube
    # ---------------------------------------------------------

    if platform == "youtube":
        opts["extractor_args"] = {
            "youtube": {
                "player_client": [
                    "web",
                    "android",
                    "web_safari",
                ],
            }
        }

        # Allow yt-dlp to use EJS scripts if necessary.
        #
        # This does NOT bypass authentication or DRM.
        # It only enables yt-dlp's official challenge-solving
        # mechanism.
        if runtime_name in {"deno", "bun"}:
            opts["remote_components"] = {
                "ejs": ["github"],
            }

    return opts


def is_youtube_bot_check(message: str) -> bool:
    lowered = (message or "").lower()

    return (
        ("confirm you" in lowered and "bot" in lowered)
        or "sign in to confirm" in lowered
        or "failed to extract any player response" in lowered
    )


def validate_url(url: str) -> None:
    parsed = urlparse(url)

    if (
        parsed.scheme not in {"http", "https"}
        or not host_allowed(parsed.hostname or "")
    ):
        raise HTTPException(
            status_code=400,
            detail="Unsupported or invalid video URL.",
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

        # If yt-dlp didn't select a direct URL,
        # find a usable progressive format.
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

                score += min(
                    int(fmt.get("height") or 0),
                    10000,
                ) / 100

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


# ============================================================
# BASIC ENDPOINTS
# ============================================================

@app.get("/")
def root():
    return {
        "ok": True,
        "service": "ZidroTool yt-dlp API",
        "version": APP_VERSION,
    }


@app.get("/health")
def health():
    runtime_name, runtime_path = get_js_runtime()

    return {
        "ok": True,
        "service": "ZidroTool yt-dlp API",
        "version": APP_VERSION,
        "yt_dlp": getattr(
            yt_dlp.version,
            "__version__",
            "unknown",
        ),
        "js_runtime": runtime_name,
        "js_runtime_path": runtime_path,
    }


# ============================================================
# TEMPORARY DEBUG ENDPOINT
# ============================================================

@app.get("/debug")
def debug():
    """
    Temporary diagnostic endpoint.

    Remove this endpoint after the Render/YouTube issue
    has been diagnosed.
    """

    runtime_name, runtime_path = get_js_runtime()

    return {
        "python": sys.version,

        "yt_dlp": getattr(
            yt_dlp.version,
            "__version__",
            "unknown",
        ),

        "yt_dlp_ejs_installed": (
            importlib.util.find_spec(
                "yt_dlp_ejs"
            )
            is not None
        ),

        "js_runtime": runtime_name,
        "js_runtime_path": runtime_path,

        "node": shutil.which("node"),
        "deno": shutil.which("deno"),
        "bun": shutil.which("bun"),

        "environment": {
            "PORT": os.getenv("PORT"),
            "RENDER": os.getenv("RENDER"),
        },
    }


# ============================================================
# EXTRACT
# ============================================================

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

        runtime_name, runtime_path = (
            get_js_runtime()
        )

        print(
            "yt-dlp extraction failed:",
            {
                "type": type(exc).__name__,
                "error": message,
                "platform": platform,
                "url": url,
                "bot_check": bot_check,
                "js_runtime": runtime_name,
                "js_runtime_path": runtime_path,
                "yt_dlp": getattr(
                    yt_dlp.version,
                    "__version__",
                    "unknown",
                ),
            },
            flush=True,
        )

        if bot_check:
            raise HTTPException(
                status_code=502,
                detail=(
                    "YouTube extraction failed on the "
                    "Render server. yt-dlp could not obtain "
                    "a usable YouTube player response. "
                    "Check the JavaScript runtime and EJS "
                    "configuration on the server."
                ),
                headers={
                    "X-ZidroTool-Error-Code":
                        "YOUTUBE_EXTRACTION_FAILED"
                },
            )

        raise HTTPException(
            status_code=502,
            detail=(
                "Video provider could not "
                "extract this URL."
            ),
        )


# ============================================================
# DOWNLOAD
# ============================================================

@app.get("/download")
def download_endpoint(
    url: str = Query(
        ...,
        min_length=8,
        max_length=4096,
    )
):
    """
    Download/stream the selected video directly from Render.

    The browser receives the file from Render instead of
    trying to fetch a temporary provider URL directly.
    """

    validate_url(url)

    platform = get_platform(url)

    ydl = None
    result = None

    try:
        opts = get_ydl_options(platform)

        # We stream the selected single format ourselves.
        opts["quiet"] = True
        opts["no_warnings"] = True

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

        video_url = info.get("url")

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

                score += min(
                    int(fmt.get("height") or 0),
                    10000,
                ) / 100

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
                "No direct video URL returned."
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

        # Use yt-dlp's opener so extractor headers/session
        # are preserved as much as possible.
        result = ydl.urlopen(
            video_url
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
            media_type=(
                "video/mp4"
                if ext == "mp4"
                else f"video/{ext}"
            ),
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

        runtime_name, runtime_path = (
            get_js_runtime()
        )

        print(
            "yt-dlp download failed:",
            {
                "type": type(exc).__name__,
                "error": message,
                "platform": platform,
                "url": url,
                "bot_check": bot_check,
                "js_runtime": runtime_name,
                "js_runtime_path": runtime_path,
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

        if bot_check:
            raise HTTPException(
                status_code=502,
                detail=(
                    "YouTube download failed on the "
                    "Render server. yt-dlp could not obtain "
                    "a usable player response."
                ),
                headers={
                    "X-ZidroTool-Error-Code":
                        "YOUTUBE_DOWNLOAD_FAILED"
                },
            )

        raise HTTPException(
            status_code=502,
            detail=(
                "Video provider could not "
                "download this URL."
            ),
        )