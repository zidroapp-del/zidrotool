import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Cookie, Settings2, ShieldCheck, X } from "lucide-react";

export type CookieConsentValue = "all" | "necessary" | null;

const STORAGE_KEY = "zidrotool_cookie_consent_v3";
const OPEN_EVENT = "zidrotool:open-cookie-settings";

export function getCookieConsent(): CookieConsentValue {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(STORAGE_KEY);
  return value === "all" || value === "necessary" ? value : null;
}

export function openCookieSettings() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(OPEN_EVENT));
}

export function useCookieConsent() {
  const [consent, setConsent] = useState<CookieConsentValue>(null);

  useEffect(() => {
    const sync = () => setConsent(getCookieConsent());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("zidrotool:cookie-consent", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("zidrotool:cookie-consent", sync);
    };
  }, []);

  return consent;
}

function saveConsent(value: Exclude<CookieConsentValue, null>) {
  localStorage.setItem(STORAGE_KEY, value);
  window.dispatchEvent(new Event("zidrotool:cookie-consent"));
}

export function CookieConsent() {
  const { t } = useTranslation();
  const consent = useCookieConsent();
  const [showSettings, setShowSettings] = useState(false);
  const [reopened, setReopened] = useState(false);

  useEffect(() => {
    const open = () => {
      setReopened(true);
      setShowSettings(true);
    };
    window.addEventListener(OPEN_EVENT, open);
    return () => window.removeEventListener(OPEN_EVENT, open);
  }, []);

  const visible = !consent || reopened;
  if (!visible) return null;

  const close = () => {
    setShowSettings(false);
    setReopened(false);
  };

  const choose = (value: Exclude<CookieConsentValue, null>) => {
    saveConsent(value);
    close();
  };

  return (
    <div className="zt-cookie-consent fixed inset-x-0 bottom-0 z-[100] p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:p-5 sm:pb-[calc(1.25rem+env(safe-area-inset-bottom))]" role="dialog" aria-modal="false" aria-labelledby="cookie-consent-title">
      <div className="mx-auto max-w-5xl rounded-2xl border border-ink-200 bg-white/95 p-4 shadow-2xl backdrop-blur-xl dark:border-ink-700 dark:bg-ink-900/95 sm:p-5">
        {!showSettings ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
                <Cookie className="h-5 w-5" />
              </div>
              <div>
                <h2 id="cookie-consent-title" className="font-semibold text-ink-900 dark:text-white">{t("cookie.banner.title")}</h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-ink-600 dark:text-ink-300">{t("cookie.banner.body")}</p>
                <Link to="/cookies" className="mt-1 inline-block text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400">{t("cookie.banner.learn")}</Link>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
              <button type="button" onClick={() => setShowSettings(true)} className="inline-flex items-center gap-2 rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50 dark:border-ink-700 dark:text-ink-200 dark:hover:bg-ink-800">
                <Settings2 className="h-4 w-4" /> {t("cookie.settings")}
              </button>
              <button type="button" onClick={() => choose("necessary")} className="rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50 dark:border-ink-700 dark:text-ink-200 dark:hover:bg-ink-800">{t("cookie.reject")}</button>
              <button type="button" onClick={() => choose("all")} className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">{t("cookie.accept")}</button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-brand-600" /><h2 id="cookie-consent-title" className="font-semibold text-ink-900 dark:text-white">{t("cookie.settings.title")}</h2></div>
                <p className="mt-1 text-sm leading-6 text-ink-600 dark:text-ink-300">{t("cookie.settings.body")}</p>
              </div>
              <button type="button" onClick={close} aria-label={t("cookie.close")} className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-ink-200 p-4 dark:border-ink-700"><div className="flex items-center justify-between gap-3"><strong className="text-sm">{t("cookie.necessary")}</strong><span className="text-xs font-semibold text-brand-600">{t("cookie.alwaysOn")}</span></div><p className="mt-1 text-xs leading-5 text-ink-500 dark:text-ink-400">{t("cookie.necessaryBody")}</p></div>
              <div className="rounded-xl border border-ink-200 p-4 dark:border-ink-700"><div className="flex items-center justify-between gap-3"><strong className="text-sm">{t("cookie.optional")}</strong><span className="text-xs text-ink-500 dark:text-ink-400">{t("cookie.optionalBadge")}</span></div><p className="mt-1 text-xs leading-5 text-ink-500 dark:text-ink-400">{t("cookie.optionalBody")}</p></div>
            </div>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => choose("necessary")} className="rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-medium dark:border-ink-700">{t("cookie.saveNecessary")}</button>
              <button type="button" onClick={() => choose("all")} className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white">{t("cookie.accept")}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
