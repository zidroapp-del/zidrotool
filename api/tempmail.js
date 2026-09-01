const DEFAULT_API = "https://api.mail.tm";
const DEFAULT_FALLBACK_API = "https://api.mail.gw";
const PROVIDER_TIMEOUT_MS = 15000;
const MAX_RETRIES = 2;

function json(res, status, body) {
  res.status(status)
    .setHeader("Content-Type", "application/json; charset=utf-8")
    .setHeader("Cache-Control", "no-store")
    .setHeader("Access-Control-Allow-Origin", "*")
    .setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    .setHeader("Access-Control-Allow-Headers", "Content-Type")
    .end(JSON.stringify(body));
}

function input(req) { return req.method === "GET" ? req.query || {} : req.body || {}; }
function providerUrls() {
  return [...new Set([
    process.env.TEMPMAIL_API_URL || DEFAULT_API,
    process.env.TEMPMAIL_FALLBACK_API_URL || DEFAULT_FALLBACK_API,
  ].map(v => String(v).trim().replace(/\/$/, "")).filter(Boolean))];
}
function randomString(length = 14) {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < length; i += 1) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}
function normalizeError(status, data) {
  const detail = data?.detail || data?.message || data?.title;
  if (status === 429) return "Temporary email provider rate limit reached. Please wait a few seconds and try again.";
  if (status === 401) return "Temporary email session expired. Create a new inbox.";
  if (status === 422) return detail ? `Temporary email provider rejected the request: ${detail}` : "Temporary email provider rejected the account details.";
  if (status >= 500) return "Temporary email provider is temporarily unavailable.";
  return detail || `Temporary email provider returned ${status}.`;
}

async function request(baseUrl, path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        accept: "application/json",
        ...(options.body ? { "content-type": "application/json" } : {}),
        ...(options.headers || {}),
      },
    });
    const raw = await response.text();
    let data = null;
    if (raw) { try { data = JSON.parse(raw); } catch {} }
    if (!response.ok) {
      const error = new Error(normalizeError(response.status, data));
      error.status = response.status;
      throw error;
    }
    return data;
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("Temporary email provider timed out. Please try again.");
    throw error instanceof Error ? error : new Error("Temporary email provider request failed.");
  } finally { clearTimeout(timer); }
}

async function providerFetch(path, options = {}, { retry = true, baseUrl = "" } = {}) {
  const urls = baseUrl ? [String(baseUrl).replace(/\/$/, "")] : providerUrls();
  let lastError = null;
  for (const baseUrl of urls) {
    const attempts = retry ? MAX_RETRIES + 1 : 1;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        return await request(baseUrl, path, options);
      } catch (error) {
        lastError = error;
        const retryable = [408, 425, 429, 500, 502, 503, 504].includes(error?.status) || /timed out|temporarily unavailable/i.test(error?.message || "");
        if (!retryable || attempt === attempts - 1) break;
        await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
      }
    }
  }
  throw lastError || new Error("No temporary email provider is configured.");
}

function resolveProvider(value) {
  const candidate = String(value || "").trim().replace(/\/$/, "");
  if (!candidate) return providerUrls()[0];
  const allowed = providerUrls();
  if (!allowed.includes(candidate)) throw new Error("Temporary email provider session is invalid. Create a new inbox.");
  return candidate;
}

function authToken(source) {
  const token = String(source.token || "").trim();
  if (!token) throw new Error("Temporary email session is missing. Create a new inbox.");
  return token;
}
function normalizeMessage(message) {
  return {
    id: String(message?.id || ""),
    from: message?.from?.address || message?.from?.name || "Unknown sender",
    subject: message?.subject || "",
    date: message?.createdAt || message?.updatedAt || "",
    intro: message?.intro || "",
  };
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return json(res, 204, {});
  if (req.method !== "GET" && req.method !== "POST") return json(res, 405, { error: "Method not allowed." });

  try {
    const source = input(req);
    const action = String(source.action || "");

    if (action === "create") {
      let lastError = null;
      for (const baseUrl of providerUrls()) {
        try {
          const domains = await providerFetch("/domains?page=1", {}, { baseUrl });
          const domain = domains?.["hydra:member"]?.find(item => item?.isActive !== false)?.domain;
          if (!domain) throw new Error("No temporary email domain is currently available.");
          const login = `zidro${Date.now().toString(36)}${randomString(5)}`.slice(0, 30);
          const password = `${randomString(18)}A9!`;
          const address = `${login}@${domain}`;
          await providerFetch("/accounts", { method: "POST", body: JSON.stringify({ address, password }) }, { retry: false, baseUrl });
          const auth = await providerFetch("/token", { method: "POST", body: JSON.stringify({ address, password }) }, { retry: false, baseUrl });
          if (!auth?.token) throw new Error("Temporary email provider did not return a session token.");
          return json(res, 200, { ok: true, address, login, domain, token: auth.token, accountId: auth.id || "", provider: baseUrl });
        } catch (error) { lastError = error; }
      }
      throw lastError || new Error("No temporary email provider is configured.");
    }

    if (action === "list") {
      const token = authToken(source);
      const data = await providerFetch("/messages?page=1", { headers: { Authorization: `Bearer ${token}` } }, { baseUrl: resolveProvider(source.provider) });
      const messages = Array.isArray(data?.["hydra:member"]) ? data["hydra:member"].map(normalizeMessage) : [];
      return json(res, 200, { ok: true, messages });
    }

    if (action === "read") {
      const token = authToken(source);
      const id = String(source.id || "").trim();
      if (!id || !/^[A-Za-z0-9-]+$/.test(id)) return json(res, 400, { error: "Invalid message id." });
      const message = await providerFetch(`/messages/${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${token}` } }, { baseUrl: resolveProvider(source.provider) });
      return json(res, 200, { ok: true, message: { ...normalizeMessage(message), text: message?.text || "", htmlBody: Array.isArray(message?.html) ? message.html.join("\n") : message?.html || "" } });
    }

    return json(res, 400, { error: "Unknown action." });
  } catch (error) {
    console.error("tempmail", error);
    return json(res, 502, { error: error instanceof Error ? error.message : "Temporary email service is temporarily unavailable." });
  }
}
