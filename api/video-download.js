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
  "x.com",
  "twitter.com",
];

function json(res, status, body) {
  res.statusCode = status;

  res.setHeader(
    "Content-Type",
    "application/json; charset=utf-8"
  );

  res.setHeader("Cache-Control", "no-store");

  res.setHeader(
    "Access-Control-Allow-Origin",
    "*"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, HEAD, OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  if (typeof res.json === "function") {
    return res.json(body);
  }

  return res.end(JSON.stringify(body));
}

function normalizeBaseUrl(value) {
  const raw = String(value || "")
    .trim()
    .replace(/\/+$/, "");

  if (!raw) {
    return "";
  }

  try {
    const u = new URL(raw);

    if (
      !/^https?:$/.test(u.protocol) ||
      PLACEHOLDER_HOSTS.has(
        u.hostname.toLowerCase()
      )
    ) {
      return "";
    }

    return u.toString().replace(/\/+$/, "");
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
      (allowed) =>
        host === allowed ||
        host.endsWith(`.${allowed}`)
    );
  } catch {
    return false;
  }
}

function detectPlatform(rawUrl) {
  try {
    const host = new URL(rawUrl)
      .hostname
      .toLowerCase();

    if (
      host === "tiktok.com" ||
      host.endsWith(".tiktok.com")
    ) {
      return "tiktok";
    }

    if (
      host === "facebook.com" ||
      host.endsWith(".facebook.com") ||
      host === "fb.watch"
    ) {
      return "facebook";
    }

    if (
      host === "instagram.com" ||
      host.endsWith(".instagram.com")
    ) {
      return "instagram";
    }

    if (
      host === "youtube.com" ||
      host.endsWith(".youtube.com") ||
      host === "youtu.be"
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

  const normalized = String(requested).toLowerCase();

  if (normalized === detected) {
    return true;
  }

  if (
    normalized === "twitter" &&
    detected === "x"
  ) {
    return true;
  }

  return false;
}

/* =========================================================
 * Cobalt provider
 * ========================================================= */

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
    signal: AbortSignal.timeout(30000),
  });

  const data = await response
    .json()
    .catch(() => ({}));

  if (!response.ok) {
    console.error(
      "Cobalt provider response:",
      {
        status: response.status,
        data,
      }
    );

    return null;
  }

  const downloadUrl =
    data?.url ||
    data?.downloadUrl ||
    data?.picker?.[0]?.url ||
    null;

  if (!downloadUrl) {
    return null;
  }

  return {
    downloadUrl,
    filename:
      data?.filename ||
      "video.mp4",
    title:
      data?.filename ||
      "Video",
    thumbnail:
      data?.thumbnail ||
      null,
    provider: "cobalt",
  };
}

/* =========================================================
 * Apify provider
 * ========================================================= */

async function callApify(sourceUrl) {
  const token = String(
    process.env.APIFY_TOKEN || ""
  ).trim();

  if (!token) {
    return null;
  }

  const actor = String(
    process.env.APIFY_VIDEO_ACTOR ||
      "miccho27~social-video-downloader"
  ).trim();

  const endpoint =
    "https://api.apify.com/v2/acts/" +
    encodeURIComponent(actor) +
    "/run-sync-get-dataset-items" +
    `?token=${encodeURIComponent(token)}` +
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

  const data = await response
    .json()
    .catch(() => []);

  if (!response.ok) {
    console.error(
      "Apify provider response:",
      {
        status: response.status,
        data,
      }
    );

    return null;
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
    return null;
  }

  const downloadUrl =
    item?.video_url ||
    item?.downloadUrl ||
    item?.url ||
    null;

  if (!downloadUrl) {
    return null;
  }

  const platform =
    detectPlatform(sourceUrl);

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

    duration:
      item?.duration ||
      null,
  };
}

/* =========================================================
 * yt-dlp provider
 * ========================================================= */

async function callYtDlp(baseUrl, sourceUrl) {
  const url = normalizeBaseUrl(baseUrl);

  if (!url) {
    console.error(
      "YTDLP_API_URL is not configured correctly."
    );

    return null;
  }

  const endpoint =
    `${url}/extract?url=${encodeURIComponent(
      sourceUrl
    )}`;

  console.log(
    "Calling yt-dlp provider:",
    {
      baseUrl: url,
      sourceUrl,
    }
  );

  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(60000),
  });

  const rawText = await response.text();

  let data = {};

  try {
    data = JSON.parse(rawText);
  } catch {
    console.error(
      "yt-dlp returned invalid JSON:",
      {
        status: response.status,
        body: rawText.slice(0, 1000),
      }
    );

    return null;
  }

  console.log(
    "yt-dlp provider response:",
    {
      status: response.status,
      success: data?.success,
      hasVideoUrl:
        Boolean(data?.video_url),
      platform: data?.platform,
      title: data?.title,
      error:
        data?.detail ||
        data?.error ||
        null,
    }
  );

  if (
    !response.ok ||
    !data?.video_url
  ) {
    console.error(
      "yt-dlp extraction failed:",
      {
        status: response.status,
        data,
      }
    );

    return null;
  }

  const platform =
    detectPlatform(sourceUrl);

  const ext =
    String(data.ext || "mp4")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase() || "mp4";

  return {
    downloadUrl: data.video_url,

    filename:
      `${platform}-video.${ext}`,

    title:
      data.title ||
      `${platform} video`,

    thumbnail:
      data.thumbnail ||
      null,

    provider: "yt-dlp",

    author:
      data.author ||
      null,

    duration:
      data.duration ||
      null,
  };
}

/* =========================================================
 * Provider configuration
 * ========================================================= */

function getProviders() {
  const providers = [];

  const cobaltUrl =
    normalizeBaseUrl(
      process.env.COBALT_API_URL
    );

  if (cobaltUrl) {
    providers.push([
      "cobalt",
      cobaltUrl,
      callCobalt,
    ]);
  }

  const ytDlpUrl =
    normalizeBaseUrl(
      process.env.YTDLP_API_URL
    );

  if (ytDlpUrl) {
    providers.push([
      "yt-dlp",
      ytDlpUrl,
      callYtDlp,
    ]);
  }

  const apifyToken = String(
    process.env.APIFY_TOKEN || ""
  ).trim();

  if (apifyToken) {
    providers.push([
      "apify",
      apifyToken,
      callApify,
    ]);
  }

  return providers;
}

/* =========================================================
 * Safe filename
 * ========================================================= */

function safeFilename(filename) {
  return String(
    filename || "video.mp4"
  )
    .replace(
      /[<>:"/\\|?*\x00-\x1F]/g,
      "_"
    )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180) || "video.mp4";
}

/* =========================================================
 * Stream actual video
 * ========================================================= */

async function downloadVideo(
  res,
  downloadUrl,
  filename,
  sourceUrl,
  platform
) {
  console.log(
    "Starting video download:",
    {
      filename,
      platform,
    }
  );

  if (
    !downloadUrl ||
    !/^https?:\/\//i.test(downloadUrl)
  ) {
    throw new Error(
      "Invalid video download URL."
    );
  }

  /*
   * Different platforms sometimes require
   * different Referer headers.
   */
  let referer = "https://www.google.com/";

  if (platform === "tiktok") {
    referer = "https://www.tiktok.com/";
  } else if (platform === "instagram") {
    referer = "https://www.instagram.com/";
  } else if (platform === "facebook") {
    referer = "https://www.facebook.com/";
  } else if (platform === "youtube") {
    referer = "https://www.youtube.com/";
  } else if (platform === "x") {
    referer = "https://x.com/";
  }

  const response = await fetch(
    downloadUrl,
    {
      method: "GET",
      redirect: "follow",

      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36",

        Accept:
          "video/mp4,video/webm,video/*,*/*;q=0.8",

        Referer: referer,

        "Accept-Language":
          "en-US,en;q=0.9",
      },

      signal:
        AbortSignal.timeout(120000),
    }
  );

  console.log(
    "Video source response:",
    {
      status: response.status,
      contentType:
        response.headers.get(
          "content-type"
        ),
      contentLength:
        response.headers.get(
          "content-length"
        ),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Video server returned HTTP ${response.status}`
    );
  }

  if (!response.body) {
    throw new Error(
      "Video server returned an empty response."
    );
  }

  const contentType =
    response.headers.get(
      "content-type"
    ) || "video/mp4";

  /*
   * Prevent accidentally returning HTML/JSON
   * as a .mp4 file.
   */
  if (
    contentType.includes("text/html") ||
    contentType.includes("application/json")
  ) {
    const preview = await response.text();

    console.error(
      "Video URL returned non-video content:",
      preview.slice(0, 500)
    );

    throw new Error(
      "Video source returned non-video content."
    );
  }

  const contentLength =
    response.headers.get(
      "content-length"
    );

  const finalFilename =
    safeFilename(filename);

  res.statusCode = 200;

  res.setHeader(
    "Content-Type",
    contentType
  );

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${finalFilename}"`
  );

  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate"
  );

  res.setHeader(
    "Access-Control-Allow-Origin",
    "*"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, HEAD, OPTIONS"
  );

  if (contentLength) {
    res.setHeader(
      "Content-Length",
      contentLength
    );
  }

  const reader =
    response.body.getReader();

  let totalBytes = 0;

  try {
    while (true) {
      const {
        done,
        value,
      } = await reader.read();

      if (done) {
        break;
      }

      if (value) {
        const chunk =
          Buffer.from(value);

        totalBytes += chunk.length;

        res.write(chunk);
      }
    }
  } finally {
    reader.releaseLock();
  }

  console.log(
    "Video download completed:",
    {
      filename: finalFilename,
      bytes: totalBytes,
    }
  );

  if (totalBytes === 0) {
    throw new Error(
      "Video stream contained zero bytes."
    );
  }

  res.end();
}

/* =========================================================
 * Main Vercel handler
 * ========================================================= */

export default async function handler(
  req,
  res
) {
  /* CORS preflight */

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    return res.end();
  }

  /* Allowed methods */

  if (
    req.method !== "GET" &&
    req.method !== "HEAD"
  ) {
    return json(
      res,
      405,
      {
        error:
          "Method not allowed",
      }
    );
  }

  /* Query params */

  const {
    url,
    platform = "auto",
    download = "0",
  } = req.query || {};

  /* Validate URL */

  if (
    !url ||
    !isSupportedUrl(
      String(url)
    )
  ) {
    return json(
      res,
      400,
      {
        error:
          "Enter a valid public Facebook, TikTok, Instagram, YouTube, or X video URL.",

        code:
          "INVALID_VIDEO_URL",
      }
    );
  }

  const sourceUrl =
    String(url);

  const detectedPlatform =
    detectPlatform(sourceUrl);

  /* Platform warning */

  if (
    !platformMatches(
      platform,
      detectedPlatform
    )
  ) {
    console.warn(
      "Platform mismatch:",
      {
        requested: platform,
        detected:
          detectedPlatform,
        url: sourceUrl,
      }
    );
  }

  /* Providers */

  const providers =
    getProviders();

  if (!providers.length) {
    return json(
      res,
      503,
      {
        error:
          "Video download is not configured yet. Add YTDLP_API_URL, APIFY_TOKEN, or configure a permitted Cobalt instance.",

        code:
          "VIDEO_PROVIDER_NOT_CONFIGURED",
      }
    );
  }

  const failures = [];

  /* Try providers */

  for (
    const [
      name,
      providerConfig,
      fn,
    ] of providers
  ) {
    try {
      console.log(
        `Trying video provider: ${name}`,
        {
          platform:
            detectedPlatform,

          download:
            String(download) === "1",
        }
      );

      const result =
        await fn(
          providerConfig,
          sourceUrl
        );

      if (
        result?.downloadUrl
      ) {
        const shouldDownload =
          String(download) === "1";

        /* Normal extraction */

        if (!shouldDownload) {
          return json(
            res,
            200,
            {
              success: true,

              platform:
                detectedPlatform,

              requestedPlatform:
                platform,

              ...result,
            }
          );
        }

        /* HEAD */

        if (
          req.method === "HEAD"
        ) {
          res.statusCode = 200;

          res.setHeader(
            "Content-Type",
            "video/mp4"
          );

          res.setHeader(
            "Content-Disposition",
            `attachment; filename="${safeFilename(
              result.filename ||
                "video.mp4"
            )}"`
          );

          res.setHeader(
            "Cache-Control",
            "no-store"
          );

          return res.end();
        }

        /* GET download */

        try {
          return await downloadVideo(
            res,
            result.downloadUrl,
            result.filename ||
              `${detectedPlatform}-video.mp4`,
            sourceUrl,
            detectedPlatform
          );
        } catch (
          downloadError
        ) {
          console.error(
            "Video streaming failed:",
            {
              provider: name,

              error:
                downloadError
                  ?.message ||
                String(
                  downloadError
                ),
            }
          );

          failures.push(
            `${name}:download`
          );

          /*
           * If response already started,
           * don't send another JSON response.
           */

          if (
            res.headersSent
          ) {
            try {
              res.end();
            } catch {
              // Ignore.
            }

            return;
          }

          return json(
            res,
            502,
            {
              error:
                "The video was found, but the download server could not stream it.",

              code:
                "VIDEO_STREAM_FAILED",

              platform:
                detectedPlatform,

              provider:
                name,

              details:
                downloadError
                  ?.message ||
                "Unknown streaming error",
            }
          );
        }
      }

      failures.push(name);
    } catch (error) {
      console.error(
        `${name} provider error:`,
        error
      );

      failures.push(name);
    }
  }

  /* All providers failed */

  return json(
    res,
    502,
    {
      error:
        "The configured video providers could not extract this URL. Try another public URL or check the provider service.",

      code:
        "VIDEO_EXTRACTION_FAILED",

      platform:
        detectedPlatform,

      providersTried:
        failures,
    }
  );
}