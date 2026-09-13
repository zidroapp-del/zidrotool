import re
import time
from urllib.parse import urlparse

import requests
import yt_dlp
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

APP_VERSION = "1.5.0"

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

# ---------------------------------------------------------------------------
# Allowed hosts (SSRF guard)
# ---------------------------------------------------------------------------
ALLOWED_HOSTS = {
    # YouTube — metadata/detection only, never download
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

DOWNLOADABLE_PLATFORMS = {"tiktok", "facebook", "instagram", "x"}

TIKTOK_REFERER = "https://www.tiktok.com/"

DEFAULT_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/128.0.0.0 Safari/537.36"
)

REJECTED_CONTENT_TYPES = ("text/html", "application/json")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def host_allowed(host: str) -> bool:
    host = (host or "").lower().split(":", 1)[0].strip(".")
    if not host:
        return False
    if host in ALLOWED_HOSTS:
        return True
    return any(host.endswith("." + allowed) for allowed in ALLOWED_HOSTS)


def get_platform(url: str) -> str:
    host = (urlparse(url).hostname or "").lower()
    if any(k in host for k in ("youtube.com", "youtu.be", "youtube-nocookie.com")):
        return "youtube"
    if "tiktok.com" in host:
        return "tiktok"
    if any(k in host for k in ("facebook.com", "fb.watch")):
        return "facebook"
    if "instagram.com" in host:
        return "instagram"
    if any(k in host for k in ("twitter.com", "x.com")):
        return "x"
    return "unknown"


def validate_url(url: str) -> str:
    """SSRF guard: scheme + host allowlist. Returns the detected platform."""
    parsed = urlparse(url)

    if parsed.scheme not in {"http", "https"}:
        raise HTTPException(
            status_code=400,
            detail="Unsupported or invalid video URL.",
            headers={"X-ZidroTool-Error-Code": "INVALID_URL"},
        )

    if not host_allowed(parsed.hostname or ""):
        raise HTTPException(
            status_code=400,
            detail="This domain is not supported.",
            headers={"X-ZidroTool-Error-Code": "UNSUPPORTED_HOST"},
        )

    return get_platform(url)


def clean_title(value: str | None) -> str:
    value = (value or "").strip()
    return value[:240] or "video"


def safe_filename(title: str, ext: str) -> str:
    base = re.sub(r"[^A-Za-z0-9 _-]+", "", title or "").strip()
    base = re.sub(r"\s+", "_", base) or "video"
    ext = re.sub(r"[^A-Za-z0-9]+", "", ext or "mp4") or "mp4"
    return f"{base[:100]}.{ext}"[:150]


def pick_video_url(info: dict) -> str | None:
    formats = info.get("formats") or []
    candidates = []

    for fmt in formats:
        fmt_url = fmt.get("url")
        if not fmt_url or fmt.get("vcodec") in (None, "none"):
            continue

        protocol = (fmt.get("protocol") or "").lower()
        if protocol in {"m3u8", "m3u8_native", "http_dash_segments"}:
            continue

        ext = (fmt.get("ext") or "").lower()
        score = 0
        if ext == "mp4":
            score += 100
        if fmt.get("acodec") not in (None, "none"):
            score += 50
        try:
            score += int(fmt.get("height") or 0) / 10000
        except Exception:
            pass

        candidates.append((score, fmt_url))

    if candidates:
        candidates.sort(key=lambda item: item[0], reverse=True)
        return candidates[0][1]

    return info.get("url")


def get_ydl_options(platform: str) -> dict:
    opts = {
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
        "skip_download": True,
        "format": (
            "best[ext=mp4][vcodec!=none][acodec!=none]"
            "/best[ext=mp4][vcodec!=none]"
            "/best"
        ),
        "socket_timeout": 20,
        "retries": 3,
        "fragment_retries": 3,
        "geo_bypass": True,
        "http_headers": {
            "User-Agent": DEFAULT_USER_AGENT,
            "Accept-Language": "en-US,en;q=0.9",
        },
    }

    if platform == "tiktok":
        opts["http_headers"]["Referer"] = TIKTOK_REFERER

    return opts


def extract_tiktok_secondary_fallback(url: str) -> dict:
    """Use TikLyDown when yt-dlp and TikWM cannot extract the video."""
    try:
        headers = {
            "User-Agent": DEFAULT_USER_AGENT,
            "Referer": "https://tiklydown.eu.org/",
            "Accept": "application/json, text/plain, */*",
        }
        res = requests.get(
            "https://api.tiklydown.eu.org/api/download",
            params={"url": url},
            headers=headers,
            timeout=10,
        )
        res.raise_for_status()
        data = res.json()
        video_data = data.get("video") or data.get("data") or {}
        video_url = (
            video_data.get("noWatermark")
            or video_data.get("no_watermark")
            or video_data.get("play")
            or video_data.get("watermark")
        )

        if video_url:
            return {
                "success": True,
                "video_url": video_url,
                "title": clean_title(data.get("title")),
                "author": (data.get("author") or {}).get("name") or "",
                "thumbnail": data.get("cover") or None,
                "duration": None,
                "platform": "tiktok",
                "ext": "mp4",
                "webpage_url": url,
                "timestamp": int(time.time()),
                "provider": "tiklydown",
                "source_headers": headers,
            }
    except Exception as exc:
        print(f"TikTok secondary fallback (TikLyDown) failed: {exc}", flush=True)

    raise RuntimeError("All TikTok extraction fallbacks failed.")


def extract_tiktok_fallback(url: str) -> dict:
    """Extract a TikTok video through TikWM, then TikLyDown as a fallback."""
    headers = {
        "User-Agent": DEFAULT_USER_AGENT,
        "Referer": "https://www.tikwm.com/",
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Origin": "https://www.tikwm.com",
    }
    try:
        response = requests.post(
            "https://www.tikwm.com/api/",
            data={"url": url, "hd": 1},
            headers=headers,
            timeout=12,
        )
        response.raise_for_status()
        res_data = response.json()
        if res_data.get("code") == 0:
            data = res_data.get("data") or {}
            video_url = data.get("play") or data.get("wmplay")

            if video_url:
                return {
                    "success": True,
                    "video_url": video_url,
                    "title": clean_title(data.get("title")),
                    "author": (data.get("author") or {}).get("nickname") or "",
                    "thumbnail": data.get("cover") or None,
                    "duration": data.get("duration"),
                    "platform": "tiktok",
                    "ext": "mp4",
                    "webpage_url": url,
                    "timestamp": int(time.time()),
                    "provider": "tikwm",
                    "source_headers": {
                        "User-Agent": DEFAULT_USER_AGENT,
                        "Referer": TIKTOK_REFERER,
                        "Accept": "video/mp4,video/*;q=0.9,*/*;q=0.8",
                    },
                }
    except Exception as exc:
        print(f"TikTok fallback (TikWM) request failed: {exc}", flush=True)

    return extract_tiktok_secondary_fallback(url)


def extract(url: str) -> dict:
    platform = get_platform(url)
    opts = get_ydl_options(platform)

    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=False)

        if info is None:
            raise RuntimeError("No video information was returned.")

        if info.get("_type") == "playlist":
            entries = [x for x in (info.get("entries") or []) if x]
            if not entries:
                raise RuntimeError("No video was found in playlist.")
            info = entries[0]

        result = {
            "success": True,
            "title": clean_title(info.get("title")),
            "author": info.get("uploader") or info.get("channel") or "",
            "thumbnail": info.get("thumbnail") or None,
            "duration": info.get("duration"),
            "platform": platform,
            "ext": info.get("ext") or "mp4",
            "webpage_url": info.get("webpage_url") or url,
            "timestamp": int(time.time()),
            "provider": "yt-dlp",
        }

        if platform != "youtube":
            video_url = pick_video_url(info)
            if not video_url:
                raise RuntimeError("No direct video URL was returned.")
            result["video_url"] = video_url
            result["source_headers"] = {
                key: value
                for key, value in (info.get("http_headers") or {}).items()
                if key.lower() in {"accept", "referer", "user-agent"}
            }

        return result

    except Exception as exc:
        print(
            f"yt-dlp extraction failed for {platform}: "
            f"{type(exc).__name__}: {exc}",
            flush=True,
        )

        if platform == "tiktok":
            try:
                return extract_tiktok_fallback(url)
            except Exception as fallback_exc:
                print(
                    f"TikTok fallbacks also failed: {fallback_exc}",
                    flush=True,
                )
                raise HTTPException(
                    status_code=502,
                    detail="Video provider could not extract this URL.",
                    headers={"X-ZidroTool-Error-Code": "EXTRACTION_FAILED"},
                ) from fallback_exc

        raise HTTPException(
            status_code=502,
            detail="Video provider could not extract this URL.",
            headers={"X-ZidroTool-Error-Code": "EXTRACTION_FAILED"},
        )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/")
def root():
    return {"ok": True, "service": "ZidroTool yt-dlp API", "version": APP_VERSION}


@app.get("/health")
def health():
    return {"ok": True}


@app.get("/debug")
def debug():
    return {
        "ok": True,
        "version": APP_VERSION,
        "yt_dlp_version": getattr(yt_dlp.version, "__version__", "unknown"),
        "downloadable_platforms": sorted(DOWNLOADABLE_PLATFORMS),
        "youtube_download_enabled": False,
    }


@app.get("/extract")
def extract_endpoint(url: str = Query(..., min_length=8, max_length=4096)):
    validate_url(url)

    try:
        return extract(url)
    except HTTPException:
        raise
    except Exception as exc:
        print(f"Extract endpoint error: {type(exc).__name__}: {exc}", flush=True)
        raise HTTPException(
            status_code=502,
            detail="Video provider could not extract this URL.",
            headers={"X-ZidroTool-Error-Code": "EXTRACTION_FAILED"},
        )


@app.get("/download")
def download_endpoint(url: str = Query(..., min_length=8, max_length=4096)):
    platform = validate_url(url)

    if platform == "youtube":
        raise HTTPException(
            status_code=404,
            detail=(
                "YouTube video downloads are not offered by this service. "
                "YouTube metadata is still available via /extract."
            ),
            headers={"X-ZidroTool-Error-Code": "YOUTUBE_DOWNLOAD_DISABLED"},
        )

    if platform not in DOWNLOADABLE_PLATFORMS:
        raise HTTPException(
            status_code=400,
            detail="This platform is not supported for download.",
            headers={"X-ZidroTool-Error-Code": "UNSUPPORTED_PLATFORM"},
        )

    try:
        info = extract(url)
    except HTTPException:
        raise
    except Exception as exc:
        print(f"Download extraction failed: {type(exc).__name__}: {exc}", flush=True)
        raise HTTPException(
            status_code=502,
            detail="Video provider could not extract this URL.",
            headers={"X-ZidroTool-Error-Code": "EXTRACTION_FAILED"},
        )

    video_url = info.get("video_url")
    video_scheme = urlparse(video_url or "").scheme

    if not video_url or video_scheme not in {"http", "https"}:
        raise HTTPException(
            status_code=502,
            detail="No downloadable video URL was found.",
            headers={"X-ZidroTool-Error-Code": "NO_VIDEO_URL"},
        )

    request_headers = {
        "User-Agent": DEFAULT_USER_AGENT,
        "Accept": "video/mp4,video/*;q=0.9,*/*;q=0.8",
    }
    if platform == "tiktok":
        request_headers["Referer"] = TIKTOK_REFERER
    request_headers.update(info.get("source_headers") or {})

    upstream = None
    last_upstream_error = None
    for attempt in range(2):
        try:
            upstream = requests.get(
                video_url,
                headers=request_headers,
                stream=True,
                timeout=30,
            )
            if upstream.status_code < 400 or attempt == 1:
                break
            upstream.close()
            request_headers["Referer"] = TIKTOK_REFERER
        except requests.RequestException as exc:
            last_upstream_error = exc

    if upstream is None:
        print(f"Upstream video fetch failed: {last_upstream_error}", flush=True)
        raise HTTPException(
            status_code=502,
            detail="Could not reach the video source.",
            headers={"X-ZidroTool-Error-Code": "UPSTREAM_UNREACHABLE"},
        )

    if upstream.status_code >= 400:
        upstream.close()
        raise HTTPException(
            status_code=502,
            detail=f"Video source returned HTTP {upstream.status_code}.",
            headers={"X-ZidroTool-Error-Code": "UPSTREAM_ERROR"},
        )

    content_type = (upstream.headers.get("Content-Type") or "").lower()

    if any(content_type.startswith(bad) for bad in REJECTED_CONTENT_TYPES):
        upstream.close()
        raise HTTPException(
            status_code=502,
            detail="The video source did not return a video file.",
            headers={"X-ZidroTool-Error-Code": "INVALID_CONTENT_TYPE"},
        )

    media_type = content_type if content_type.startswith("video/") else "video/mp4"
    filename = safe_filename(info.get("title"), info.get("ext"))

    def stream():
        try:
            for chunk in upstream.iter_content(chunk_size=1024 * 1024):
                if chunk:
                    yield chunk
        finally:
            upstream.close()

    response_headers = {
        "Content-Disposition": f'attachment; filename="{filename}"',
    }

    content_length = upstream.headers.get("Content-Length")
    if content_length:
        response_headers["Content-Length"] = content_length

    return StreamingResponse(
        stream(),
        media_type=media_type,
        headers=response_headers,
    )