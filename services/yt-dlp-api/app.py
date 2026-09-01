import os
import re
import time
from urllib.parse import urlparse

import yt_dlp
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title='ZidroTool yt-dlp API', version='1.0.0')
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=False,
    allow_methods=['GET'],
    allow_headers=['*'],
)

ALLOWED_HOSTS = {
    'youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'youtube-nocookie.com',
    'tiktok.com', 'www.tiktok.com', 'm.tiktok.com',
    'facebook.com', 'www.facebook.com', 'm.facebook.com', 'fb.watch',
    'instagram.com', 'www.instagram.com',
    'x.com', 'www.x.com', 'twitter.com', 'www.twitter.com',
}


def host_allowed(host: str) -> bool:
    host = (host or '').lower().split(':', 1)[0]
    return any(host == allowed or host.endswith('.' + allowed) for allowed in ALLOWED_HOSTS)


def clean_title(value: str | None) -> str:
    value = (value or '').strip()
    return value[:240] or 'video'


def pick_video_url(info: dict) -> str | None:
    # Prefer a single-file MP4 so the caller does not need ffmpeg to merge streams.
    formats = info.get('formats') or []
    candidates = []
    for fmt in formats:
        url = fmt.get('url')
        if not url or fmt.get('vcodec') in (None, 'none'):
            continue
        ext = (fmt.get('ext') or '').lower()
        protocol = (fmt.get('protocol') or '').lower()
        if protocol in {'m3u8', 'm3u8_native', 'http_dash_segments'}:
            continue
        score = 0
        if ext == 'mp4': score += 100
        if fmt.get('acodec') not in (None, 'none'): score += 50
        score += int(fmt.get('height') or 0) / 10000
        candidates.append((score, url, fmt))
    if candidates:
        candidates.sort(key=lambda item: item[0], reverse=True)
        return candidates[0][1]
    return info.get('url')


def extract(url: str) -> dict:
    opts = {
        'quiet': True,
        'no_warnings': True,
        'noplaylist': True,
        'skip_download': True,
        'format': 'best[ext=mp4][vcodec!=none][acodec!=none]/best[ext=mp4][vcodec!=none]/best',
        'socket_timeout': 15,
        'retries': 1,
        'fragment_retries': 1,
        'geo_bypass': True,
    }
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(url, download=False)
        if info is None:
            raise RuntimeError('No video information was returned.')
        if info.get('_type') == 'playlist':
            entries = [x for x in (info.get('entries') or []) if x]
            if not entries:
                raise RuntimeError('No video was found.')
            info = entries[0]
        video_url = pick_video_url(info)
        if not video_url:
            raise RuntimeError('No direct video URL was returned.')
        return {
            'success': True,
            'video_url': video_url,
            'title': clean_title(info.get('title')),
            'author': info.get('uploader') or info.get('channel') or '',
            'thumbnail': info.get('thumbnail') or None,
            'duration': info.get('duration'),
            'platform': info.get('extractor_key') or info.get('extractor') or '',
            'ext': info.get('ext') or 'mp4',
            'webpage_url': info.get('webpage_url') or url,
            'timestamp': int(time.time()),
        }


@app.get('/')
def root():
    return {'ok': True, 'service': 'ZidroTool yt-dlp API'}


@app.get('/health')
def health():
    return {'ok': True}


@app.get('/extract')
def extract_endpoint(url: str = Query(..., min_length=8, max_length=4096)):
    parsed = urlparse(url)
    if parsed.scheme not in {'http', 'https'} or not host_allowed(parsed.hostname or ''):
        raise HTTPException(status_code=400, detail='Unsupported or invalid video URL.')
    try:
        return extract(url)
    except Exception as exc:
        print(f'yt-dlp extraction failed: {type(exc).__name__}: {exc}', flush=True)
        raise HTTPException(status_code=502, detail='Video provider could not extract this URL.')
