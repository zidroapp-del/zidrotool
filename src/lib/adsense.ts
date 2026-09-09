/**
 * Google AdSense integration.
 *
 * ZidroTool only ships a single, real ad provider: AdSense. Every ad slot in
 * the app is driven from here so there is exactly one place that decides
 * whether an ad can render at all.
 *
 * Nothing renders — not even a placeholder — until a publisher (client) ID
 * is configured via VITE_ADSENSE_CLIENT_ID. Individual slot ids are optional
 * per-placement env vars; a placement without a slot id also renders nothing.
 */

export type AdSlotVariant = "header" | "sidebar" | "inline" | "footer";

const SLOT_ENV_KEYS: Record<AdSlotVariant, string | undefined> = {
  header: import.meta.env.VITE_ADSENSE_SLOT_HEADER as string | undefined,
  sidebar: import.meta.env.VITE_ADSENSE_SLOT_SIDEBAR as string | undefined,
  inline: import.meta.env.VITE_ADSENSE_SLOT_INLINE as string | undefined,
  footer: import.meta.env.VITE_ADSENSE_SLOT_FOOTER as string | undefined,
};

export function getAdsenseClientId(): string | undefined {
  const id = import.meta.env.VITE_ADSENSE_CLIENT_ID as string | undefined;
  return id && id.trim().length > 0 ? id.trim() : undefined;
}

export function getAdsenseSlotId(variant: AdSlotVariant): string | undefined {
  const id = SLOT_ENV_KEYS[variant];
  return id && id.trim().length > 0 ? id.trim() : undefined;
}

/** True only when AdSense has both a client id and a slot id for this placement. */
export function isAdsenseConfigured(variant: AdSlotVariant): boolean {
  return Boolean(getAdsenseClientId() && getAdsenseSlotId(variant));
}

const SCRIPT_ID = "adsbygoogle-loader";

// Module-level singleton: the loader script must be requested at most once
// per page load, no matter how many <AdSlot> instances mount across route
// changes in the SPA.
let scriptLoadPromise: Promise<void> | null = null;

/**
 * Injects the AdSense loader script into <head> at most once, and resolves
 * once it has actually finished loading (or immediately if it was already
 * loaded/loading). Callers should await this before pushing an ad so we
 * never push to a queue the library hasn't attached to yet.
 */
export function ensureAdsenseScriptLoaded(): Promise<void> {
  if (typeof document === "undefined") {
    return Promise.resolve();
  }

  if (scriptLoadPromise) return scriptLoadPromise;

  const clientId = getAdsenseClientId();
  if (!clientId) {
    return Promise.resolve();
  }

  const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) {
    // A previous mount already added it. If it already finished loading,
    // resolve immediately; otherwise wait for its load/error event once.
    scriptLoadPromise = existing.dataset.loaded === "true"
      ? Promise.resolve()
      : new Promise((resolve) => {
          existing.addEventListener("load", () => resolve(), { once: true });
          existing.addEventListener("error", () => resolve(), { once: true });
        });
    return scriptLoadPromise;
  }

  scriptLoadPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`;
    script.addEventListener(
      "load",
      () => {
        script.dataset.loaded = "true";
        resolve();
      },
      { once: true },
    );
    // Even on error, resolve rather than reject: a single failed ad script
    // load should never turn into an unhandled rejection or block the page.
    script.addEventListener("error", () => resolve(), { once: true });
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * Requests a fresh ad impression for a newly-mounted <ins class="adsbygoogle">
 * element. Waits for the AdSense script to have loaded first so we never
 * push before adsbygoogle.js is ready, and only ever pushes once per
 * mounted element (callers are expected to guard repeat calls per instance).
 */
export async function pushAdsenseAd() {
  if (typeof window === "undefined") return;
  await ensureAdsenseScriptLoaded();
  try {
    window.adsbygoogle = window.adsbygoogle || [];
    window.adsbygoogle.push({});
  } catch {
    // AdSense throws if a slot is malformed or already has an ad in it;
    // swallow it so a single failed slot never breaks the page or spams
    // the console on route changes.
  }
}
