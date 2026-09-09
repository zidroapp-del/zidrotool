const CACHE_NAME = "zidrotool-v3";
const OFFLINE_FALLBACK_URL = "/";
const STATIC_ASSETS = ["/", "/manifest.webmanifest", "/favicon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }
  if (url.origin !== location.origin) return;

  // Never intercept API routes. They power the video downloader and other
  // live data — some responses (streamed video) are large and single-use,
  // and none of them should ever be served from a stale cache.
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(handleNavigate(request));
    return;
  }

  event.respondWith(handleAsset(request));
});

// Network-first for navigations (React Router SPA routes like
// /tools/facebook-video-downloader). Falls back to a cached copy of the
// same URL, then to the cached app shell, then to a minimal inline page —
// this branch always resolves to a real Response and never rejects, so a
// failed navigation can never surface as an unhandled promise rejection or
// a "network error" FetchEvent result.
async function handleNavigate(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone()).catch(() => {});
    return response;
  } catch {
    try {
      const cache = await caches.open(CACHE_NAME);
      const cached = (await cache.match(request)) || (await cache.match(OFFLINE_FALLBACK_URL));
      if (cached) return cached;
    } catch {
      // fall through to the last-resort response below
    }

    return new Response(
      "<!doctype html><html><head><meta charset=\"utf-8\"><title>ZidroTool</title></head>" +
        "<body>You're offline. Please check your connection and try again.</body></html>",
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }
}

// Cache-first for static assets (JS/CSS/images/fonts). A network failure
// here is always caught and turned into a real Response, never a rejected
// promise, so it can't produce an unhandled rejection in the console.
async function handleAsset(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok && response.type === "basic") {
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch {
    return new Response("", { status: 504, statusText: "Offline" });
  }
}
