const PLACEHOLDER_HOSTS = new Set([
  "your-ytdlp-service.example.com",
  "your-cobalt-instance.example.com",
]);

const SUPPORTED_HOSTS = [
  "facebook.com",
  "fb.watch",
  "tiktok.com",
  "instagram.com",
  "youtube.com",
  "youtu.be",
  "youtube-nocookie.com",
  "x.com",
  "twitter.com",
];

const DEFAULT_TIMEOUT = 30000;
const DOWNLOAD_TIMEOUT = 120000;

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  setCors(res);

  return res.end(JSON.stringify(body));
}

function normalizeBaseUrl(value) {
  const raw = String(value || "").trim().replace(/\/+$/, "");

  if (!raw) {
    return "";
  }

  try {
    const parsed = new URL(raw);
    const hostname = parsed.hostname.toLowerCase();

    if (
      !/^https?:$/.test(parsed.protocol) ||
      PLACEHOLDER_HOSTS.has(hostname)
    ) {
      return "";
    }

    return parsed.toString().replace(/\/+$/, "");
  } catch {
    return "";
  }
}

function isSupportedUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);

    if (!/^https?:$/.test(parsed.protocol)) {
      return false;
    }

    const host = parsed.hostname.toLowerCase();

    return SUPPORTED_HOSTS.some(
      (allowed) => host === allowed || host.endsWith(`.${allowed}`)
    );
  } catch {
    return false;
  }
}

function detectPlatform(rawUrl) {
  try {
    const host = new URL(rawUrl).hostname.toLowerCase();

    if (host === "tiktok.com" || host.endsWith(".tiktok.com")) {
      return "tiktok";
    }

    if (
      host === "facebook.com" ||
      host.endsWith(".facebook.com") ||
      host === "fb.watch"
    ) {
      return "facebook";
    }

    if (host === "instagram.com" || host.endsWith(".instagram.com")) {
      return "instagram";
    }

    if (
      host === "youtube.com" ||
      host.endsWith(".youtube.com") ||
      host === "youtu.be" ||
      host === "youtube-nocookie.com" ||
      host.endsWith(".youtube-nocookie.com")
    ) {
      return "youtube";
    }

    if (
      host === "x.com" ||
      host.endsWith(".x.com") ||
      host === "twitter.com" ||
      host.endsWith(".twitter.com")
    ) {
      return "x";
    }

    return "media";
  } catch {
    return "media";
  }
}

function platformMatches(requested, detected) {
  if (!requested || requested === "auto") {
    return true;
  }

  const normalized = String(requested).toLowerCase().trim();

  if (normalized === detected) {
    return true;
  }

  if (normalized === "twitter" && detected === "x") {
    return true;
  }

  return false;
}

function safeFilename(filename) {
  return (
    String(filename || "video.mp4")
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 180) || "video.mp4"
  );
}

/**
 * A provider failed, but with a specific, useful reason (e.g. the Render
 * yt-dlp service's honest "YouTube is showing a bot-verification wall"
 * message). Callers thread this through so the final response to the
 * frontend carries the real cause instead of a generic fallback string.
 */
function providerError(status, code, detail) {
  return { __providerError: true, status: status || null, code: code || null, detail: detail || null };
}

function getYtDlpBaseUrl() {
  return normalizeBaseUrl(process.env.YTDLP_API_URL);
}

function getProviders() {
  const providers = [];

  const ytDlpUrl = getYtDlpBaseUrl();

  if (ytDlpUrl) {
    providers.push({
      name: "yt-dlp",
      type: "ytdlp",
      baseUrl: ytDlpUrl,
    });
  }

  const cobaltUrl = normalizeBaseUrl(process.env.COBALT_API_URL);

  if (cobaltUrl) {
    providers.push({
      name: "cobalt",
      type: "cobalt",
      baseUrl: cobaltUrl,
    });
  }

  const apifyToken = String(process.env.APIFY_TOKEN || "").trim();

  if (apifyToken) {
    providers.push({
      name: "apify",
      type: "apify",
      token: apifyToken,
    });
  }

  return providers;
}

async function callYtDlpExtract(baseUrl, sourceUrl) {
  const url = normalizeBaseUrl(baseUrl);

  if (!url) {
    return null;
  }

  const endpoint =
    `${url}/extract?url=${encodeURIComponent(sourceUrl)}`;

  console.log("Calling yt-dlp /extract:", {
    baseUrl: url,
    sourceUrl,
  });

  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(DEFAULT_TIMEOUT),
  });

  const rawText = await response.text();

  let data;

  try {
    data = JSON.parse(rawText);
  } catch {
    console.error("yt-dlp /extract returned invalid JSON:", {
      status: response.status,
      body: rawText.slice(0, 1000),
    });

    return null;
  }

  console.log("yt-dlp /extract response:", {
    status: response.status,
    success: data?.success,
    platform: data?.platform,
    title: data?.title,
    hasVideoUrl: Boolean(data?.video_url),
    error: data?.detail || data?.error || null,
  });

  if (!response.ok || !data?.video_url) {
    console.error("yt-dlp metadata extraction failed:", {
      status: response.status,
      data,
    });

    return providerError(
      response.status,
      response.headers.get("x-zidrotool-error-code"),
      data?.detail || data?.error || null,
    );
  }

  const platform = detectPlatform(sourceUrl);

  const ext =
    String(data.ext || "mp4")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase() || "mp4";

  return {
    downloadUrl: data.video_url,
    filename: `${platform}-video.${ext}`,
    title: data.title || `${platform} video`,
    thumbnail: data.thumbnail || null,
    provider: "yt-dlp",
    author: data.author || null,
    duration: data.duration || null,
    ext,
    webpageUrl: data.webpage_url || sourceUrl,
  };
}

async function streamFromYtDlp(
  res,
  baseUrl,
  sourceUrl,
  filename,
  platform
) {
  const url = normalizeBaseUrl(baseUrl);

  if (!url) {
    throw new Error("YTDLP_API_URL is not configured.");
  }

  const endpoint =
    `${url}/download?url=${encodeURIComponent(sourceUrl)}`;

  console.log("Streaming through Render yt-dlp:", {
    baseUrl: url,
    platform,
    sourceUrl,
    filename,
  });

  const response = await fetch(endpoint, {
    method: "GET",
    redirect: "follow",
    headers: {
      Accept: "video/mp4,video/webm,video/*,*/*;q=0.8",
    },
    signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT),
  });

  const contentType =
    response.headers.get("content-type") || "video/mp4";

  console.log("Render /download response:", {
    status: response.status,
    contentType,
    contentLength: response.headers.get("content-length"),
  });

  if (!response.ok) {
    let errorPreview = "";

    try {
      errorPreview = await response.text();
    } catch {
      // Ignore.
    }

    console.error("Render yt-dlp download failed:", {
      status: response.status,
      body: errorPreview.slice(0, 1000),
    });

    let detail = null;

    try {
      detail = JSON.parse(errorPreview)?.detail || null;
    } catch {
      // Body wasn't JSON; no structured detail available.
    }

    const err = new Error(
      detail || `Render video server returned HTTP ${response.status}`
    );

    err.status = response.status;
    err.code = response.headers.get("x-zidrotool-error-code") || null;
    err.detail = detail;

    throw err;
  }

  if (!response.body) {
    throw new Error(
      "Render video server returned an empty response."
    );
  }

  if (
    contentType.includes("text/html") ||
    contentType.includes("application/json")
  ) {
    const preview = await response.text();

    console.error(
      "Render returned non-video content:",
      preview.slice(0, 1000)
    );

    throw new Error(
      "Render video server returned non-video content."
    );
  }

  const finalFilename = safeFilename(filename);

  setCors(res);

  res.statusCode = 200;
  res.setHeader("Content-Type", contentType);
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${finalFilename}"`
  );
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate"
  );
  res.setHeader("X-ZidroTool-Platform", platform);

  const contentLength = response.headers.get("content-length");

  if (contentLength) {
    res.setHeader("Content-Length", contentLength);
  }

  const reader = response.body.getReader();
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      if (value) {
        const chunk = Buffer.from(value);

        totalBytes += chunk.length;
        res.write(chunk);
      }
    }
  } finally {
    reader.releaseLock();
  }

  if (totalBytes === 0) {
    throw new Error(
      "Render video stream contained zero bytes."
    );
  }

  console.log("Video streaming completed:", {
    platform,
    filename: finalFilename,
    bytes: totalBytes,
  });

  return res.end();
}

async function callCobalt(baseUrl, sourceUrl) {
  const url = normalizeBaseUrl(baseUrl);

  if (!url) {
    return null;
  }

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (process.env.COBALT_API_KEY) {
    headers.Authorization =
      `Api-Key ${process.env.COBALT_API_KEY}`;
  }

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
    signal: AbortSignal.timeout(DEFAULT_TIMEOUT),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error("Cobalt provider response:", {
      status: response.status,
      data,
    });

    return providerError(response.status, null, data?.error?.code || data?.text || null);
  }

  const downloadUrl =
    data?.url ||
    data?.downloadUrl ||
    data?.picker?.[0]?.url ||
    null;

  if (!downloadUrl) {
    return providerError(response.status, null, "Cobalt returned no download URL.");
  }

  return {
    downloadUrl,
    filename: data?.filename || "video.mp4",
    title: data?.filename || "Video",
    thumbnail: data?.thumbnail || null,
    provider: "cobalt",
  };
}

async function callApify(token, sourceUrl) {
  const cleanToken = String(token || "").trim();

  if (!cleanToken) {
    return null;
  }

  const actor = String(
    process.env.APIFY_VIDEO_ACTOR ||
      "miccho27~social-video-downloader"
  ).trim();

  const endpoint =
    "https://api.apify.com/v2/acts/" +
    encodeURIComponent(actor) +
    "/run-sync-get-dataset-items?token=" +
    encodeURIComponent(cleanToken) +
    "&format=json";

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      url: sourceUrl,
    }),
    signal: AbortSignal.timeout(60000),
  });

  const data = await response.json().catch(() => []);

  if (!response.ok) {
    console.error("Apify provider response:", {
      status: response.status,
      data,
    });

    return providerError(response.status, null, data?.error?.message || null);
  }

  const item = Array.isArray(data)
    ? data.find(
        (x) =>
          x?.video_url ||
          x?.downloadUrl ||
          x?.url
      )
    : data;

  if (!item) {
    return providerError(response.status, null, "Apify returned no results for this URL.");
  }

  const downloadUrl =
    item?.video_url ||
    item?.downloadUrl ||
    item?.url ||
    null;

  if (!downloadUrl) {
    return providerError(response.status, null, "Apify result had no downloadable URL.");
  }

  const platform = detectPlatform(sourceUrl);

  return {
    downloadUrl,
    filename:
      item?.filename ||
      `${platform}-video.mp4`,
    title:
      item?.title ||
      `${platform} video`,
    thumbnail:
      item?.thumbnail ||
      item?.thumbnail_url ||
      null,
    provider: "apify",
    author:
      item?.author ||
      item?.uploader ||
      null,
    duration: item?.duration || null,
  };
}

async function streamFallback(
  res,
  result,
  platform
) {
  const response = await fetch(result.downloadUrl, {
    method: "GET",
    redirect: "follow",
    headers: {
      Accept: "video/mp4,video/webm,video/*,*/*;q=0.8",
    },
    signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT),
  });

  if (!response.ok || !response.body) {
    throw new Error(
      `Fallback video server returned HTTP ${response.status}`
    );
  }

  const contentType =
    response.headers.get("content-type") || "video/mp4";

  if (
    contentType.includes("text/html") ||
    contentType.includes("application/json")
  ) {
    throw new Error(
      "Fallback provider returned non-video content."
    );
  }

  const filename = safeFilename(
    result.filename || "video.mp4"
  );

  setCors(res);

  res.statusCode = 200;
  res.setHeader("Content-Type", contentType);
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}"`
  );
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate"
  );
  res.setHeader("X-ZidroTool-Platform", platform);

  const contentLength =
    response.headers.get("content-length");

  if (contentLength) {
    res.setHeader("Content-Length", contentLength);
  }

  const reader = response.body.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      if (value) {
        res.write(Buffer.from(value));
      }
    }
  } finally {
    reader.releaseLock();
  }

  return res.end();
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    return res.end();
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    return json(res, 405, {
      error: "Method not allowed",
      code: "METHOD_NOT_ALLOWED",
    });
  }

  const {
    url,
    platform = "auto",
    download = "0",
  } = req.query || {};

  if (!url || !isSupportedUrl(String(url))) {
    return json(res, 400, {
      error:
        "Enter a valid public Facebook, TikTok, Instagram, YouTube, or X video URL.",
      code: "INVALID_VIDEO_URL",
    });
  }

  const sourceUrl = String(url);
  const detectedPlatform = detectPlatform(sourceUrl);

  if (!platformMatches(platform, detectedPlatform)) {
    return json(res, 400, {
      error:
        "The requested platform does not match the video URL.",
      code: "PLATFORM_MISMATCH",
      platform: detectedPlatform,
      requestedPlatform: platform,
    });
  }

  const shouldDownload = String(download) === "1";
  const providers = getProviders();

  if (!providers.length) {
    return json(res, 503, {
      error:
        "Video download is not configured yet. Add YTDLP_API_URL, APIFY_TOKEN, or configure a permitted Cobalt instance.",
      code: "VIDEO_PROVIDER_NOT_CONFIGURED",
    });
  }

  console.log("Video request:", {
    platform: detectedPlatform,
    download: shouldDownload,
    providers: providers.map(
      (provider) => provider.name
    ),
  });

  /*
   * =======================================================
   * DOWNLOAD MODE
   * =======================================================
   */

  if (shouldDownload) {
    const ytDlpProvider = providers.find(
      (provider) => provider.type === "ytdlp"
    );
    let lastError = null;

    if (req.method === "HEAD") {
      res.statusCode = 200;
      res.setHeader("Content-Type", "video/mp4");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${safeFilename(
          `${detectedPlatform}-video.mp4`
        )}"`
      );
      res.setHeader("Cache-Control", "no-store");
      res.setHeader(
        "X-ZidroTool-Platform",
        detectedPlatform
      );

      return res.end();
    }

    /*
     * IMPORTANT:
     * Send the ORIGINAL source URL to Render.
     * Do NOT download data.video_url from /extract.
     */

    if (ytDlpProvider) {
      try {
        return await streamFromYtDlp(
          res,
          ytDlpProvider.baseUrl,
          sourceUrl,
          `${detectedPlatform}-video.mp4`,
          detectedPlatform
        );
      } catch (error) {
        console.error(
          "yt-dlp Render streaming failed:",
          {
            error:
              error?.message ||
              String(error),
          }
        );

        lastError = {
          code: error?.code || null,
          detail: error?.detail || error?.message || null,
        };

        if (res.headersSent) {
          try {
            res.end();
          } catch {
            // Ignore.
          }

          return;
        }
      }
    }

    /*
     * Fallback providers
     */

    for (const provider of providers) {
      if (provider.type === "ytdlp") {
        continue;
      }

      try {
        let result = null;

        if (provider.type === "cobalt") {
          result = await callCobalt(
            provider.baseUrl,
            sourceUrl
          );
        }

        if (provider.type === "apify") {
          result = await callApify(
            provider.token,
            sourceUrl
          );
        }

        if (result?.__providerError) {
          lastError = { code: result.code, detail: result.detail };
          continue;
        }

        if (!result?.downloadUrl) {
          continue;
        }

        return await streamFallback(
          res,
          result,
          detectedPlatform
        );
      } catch (error) {
        console.error(
          `${provider.name} download failed:`,
          {
            error:
              error?.message ||
              String(error),
          }
        );

        lastError = {
          code: error?.code || null,
          detail: error?.detail || error?.message || null,
        };

        if (res.headersSent) {
          try {
            res.end();
          } catch {
            // Ignore.
          }

          return;
        }
      }
    }

    return json(res, 502, {
      error:
        lastError?.detail ||
        "The video was found, but the configured download servers could not stream it.",
      code: lastError?.code || "VIDEO_STREAM_FAILED",
      platform: detectedPlatform,
    });
  }

  /*
   * =======================================================
   * EXTRACTION / METADATA MODE
   * =======================================================
   */

  const failures = [];
  let lastError = null;

  for (const provider of providers) {
    try {
      let result = null;

      if (provider.type === "ytdlp") {
        result = await callYtDlpExtract(
          provider.baseUrl,
          sourceUrl
        );
      }

      if (provider.type === "cobalt") {
        result = await callCobalt(
          provider.baseUrl,
          sourceUrl
        );
      }

      if (provider.type === "apify") {
        result = await callApify(
          provider.token,
          sourceUrl
        );
      }

      if (result?.downloadUrl) {
        return json(res, 200, {
          success: true,
          platform: detectedPlatform,
          requestedPlatform: platform,
          ...result,
        });
      }

      if (result?.__providerError) {
        lastError = { code: result.code, detail: result.detail };
      }

      failures.push(provider.name);
    } catch (error) {
      console.error(
        `${provider.name} extraction error:`,
        {
          error:
            error?.message ||
            String(error),
        }
      );

      lastError = {
        code: error?.code || null,
        detail: error?.detail || error?.message || null,
      };

      failures.push(provider.name);
    }
  }

  return json(res, 502, {
    error:
      lastError?.detail ||
      "The configured video providers could not extract this URL. Try another public URL or check the provider service.",
    code:
      lastError?.code ||
      "VIDEO_EXTRACTION_FAILED",
    platform: detectedPlatform,
    providersTried: failures,
  });
}