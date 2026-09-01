const PLACEHOLDER_HOSTS = new Set(['your-ytdlp-service.example.com', 'your-cobalt-instance.example.com']);

const SUPPORTED_HOSTS = [
  "facebook.com", "fb.watch", "tiktok.com", "instagram.com",
  "youtube.com", "youtu.be", "x.com", "twitter.com",
];

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (typeof res.json === "function") return res.json(body);
  return res.end(JSON.stringify(body));
}

function normalizeBaseUrl(value) {
  const raw = String(value || '').trim().replace(/\/$/, '');
  if (!raw) return '';
  try {
    const u = new URL(raw);
    if (!/^https?:$/.test(u.protocol) || PLACEHOLDER_HOSTS.has(u.hostname.toLowerCase())) return '';
    return u.toString().replace(/\/$/, '');
  } catch {
    return '';
  }
}

function isSupportedUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    if (!/^https?:$/.test(parsed.protocol)) return false;
    const host = parsed.hostname.toLowerCase();
    return SUPPORTED_HOSTS.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
  } catch { return false; }
}

function detectPlatform(rawUrl) {
  const host = new URL(rawUrl).hostname.toLowerCase();
  if (host.includes("tiktok.com")) return "tiktok";
  if (host.includes("facebook.com") || host === "fb.watch") return "facebook";
  if (host.includes("instagram.com")) return "instagram";
  if (host.includes("youtube.com") || host === "youtu.be") return "youtube";
  if (host.includes("x.com") || host.includes("twitter.com")) return "x";
  return "media";
}

async function callCobalt(baseUrl, sourceUrl) {
  const url = normalizeBaseUrl(baseUrl);
  if (!url) return null;
  const headers = { "Content-Type": "application/json", Accept: "application/json" };
  if (process.env.COBALT_API_KEY) headers.Authorization = `Api-Key ${process.env.COBALT_API_KEY}`;
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      url: sourceUrl,
      downloadMode: "auto",
      videoQuality: "1080",
      youtubeVideoCodec: "h264",
      filenameStyle: "basic",
    }),
    signal: AbortSignal.timeout(15000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error("Cobalt provider response:", { status: response.status, data });
    return null;
  }
  const downloadUrl = data?.url || data?.downloadUrl || data?.picker?.[0]?.url || null;
  if (!downloadUrl) return null;
  return {
    downloadUrl,
    filename: data?.filename || null,
    title: data?.filename || null,
    thumbnail: data?.thumbnail || null,
    provider: "cobalt",
  };
}

async function callApify(sourceUrl) {
  const token = String(process.env.APIFY_TOKEN || '').trim();
  if (!token) return null;
  const actor = String(process.env.APIFY_VIDEO_ACTOR || 'miccho27~social-video-downloader').trim();
  const endpoint = `https://api.apify.com/v2/acts/${encodeURIComponent(actor)}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}&format=json`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ url: sourceUrl }),
    signal: AbortSignal.timeout(45000),
  });
  const data = await response.json().catch(() => []);
  if (!response.ok) {
    console.error('Apify provider response:', { status: response.status, data });
    return null;
  }
  const item = Array.isArray(data) ? data.find(x => x?.video_url || x?.downloadUrl || x?.url) : data;
  const downloadUrl = item?.video_url || item?.downloadUrl || item?.url || null;
  if (!downloadUrl) return null;
  return {
    downloadUrl,
    filename: item?.filename || `${detectPlatform(sourceUrl)}-video.mp4`,
    title: item?.title || `${detectPlatform(sourceUrl)} video`,
    thumbnail: item?.thumbnail || item?.thumbnail_url || null,
    provider: 'apify',
    author: item?.author || item?.uploader || null,
    duration: item?.duration || null,
  };
}

async function callYtDlp(baseUrl, sourceUrl) {
  const url = normalizeBaseUrl(baseUrl);
  if (!url) return null;
  const endpoint = `${url}/extract?url=${encodeURIComponent(sourceUrl)}`;
  const response = await fetch(endpoint, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(30000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.video_url) {
    console.error("yt-dlp provider response:", { status: response.status, data });
    return null;
  }
  return {
    downloadUrl: data.video_url,
    filename: `${detectPlatform(sourceUrl)}-video.${data.ext || "mp4"}`,
    title: data.title || `${detectPlatform(sourceUrl)} video`,
    thumbnail: data.thumbnail || null,
    provider: "yt-dlp",
    author: data.author || null,
    duration: data.duration || null,
  };
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return json(res, 204, {});
  if (req.method !== "GET") return json(res, 405, { error: "Method not allowed" });

  const { url, platform = "auto" } = req.query || {};
  if (!url || !isSupportedUrl(String(url))) {
    return json(res, 400, { error: "Enter a valid public Facebook, TikTok, Instagram, YouTube, or X video URL." });
  }

  const sourceUrl = String(url);
  const detectedPlatform = detectPlatform(sourceUrl);
  if (platform !== "auto" && String(platform) !== detectedPlatform && !(platform === "twitter" && detectedPlatform === "x")) {
    return json(res, 400, { error: "The selected platform does not match the URL." });
  }

  const providers = [
    ["cobalt", process.env.COBALT_API_URL, callCobalt],
    ["yt-dlp", process.env.YTDLP_API_URL, callYtDlp],
    ["apify", process.env.APIFY_TOKEN, callApify],
  ].filter(([, configured]) => Boolean(normalizeBaseUrl(configured)));

  if (!providers.length) {
    return json(res, 503, {
      error: "Video download is not configured yet. Add YTDLP_API_URL, APIFY_TOKEN, or configure a permitted Cobalt instance.",
      code: "VIDEO_PROVIDER_NOT_CONFIGURED",
    });
  }

  const failures = [];
  for (const [name, baseUrl, fn] of providers) {
    try {
      const result = await fn(baseUrl, sourceUrl);
      if (result) return json(res, 200, { success: true, platform: detectedPlatform, ...result });
      failures.push(name);
    } catch (error) {
      console.error(`${name} provider error:`, error);
      failures.push(name);
    }
  }

  return json(res, 502, {
    error: "The configured video providers could not extract this URL. Try another public URL or check the provider service.",
    code: "VIDEO_EXTRACTION_FAILED",
    providersTried: failures,
  });
}
