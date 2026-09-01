import { useEffect, useState } from "react";
import { X, ShieldCheck, Sparkles } from "lucide-react";

const SESSION_KEY = "zidrotool_interstitial_seen_v1";

/**
 * Lightweight interstitial shell. It is intentionally an ad container, not a
 * fake advertiser creative. When an approved ad provider is connected, the
 * inner slot can be replaced without changing the modal behavior.
 */
export function AdInterstitial() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const timer = window.setTimeout(() => setOpen(true), 9000);
    return () => window.clearTimeout(timer);
  }, []);

  const close = () => {
    sessionStorage.setItem(SESSION_KEY, "1");
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-ink-950/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Advertisement">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl dark:bg-ink-900">
        <button type="button" onClick={close} className="absolute right-3 top-3 z-10 rounded-lg bg-ink-900/80 p-2 text-white hover:bg-ink-900" aria-label="Close advertisement">
          <X className="h-4 w-4" />
        </button>

        <div className="bg-gradient-to-br from-brand-600 via-blue-600 to-indigo-700 p-8 text-white">
          <div className="mb-6 flex items-center justify-between gap-3 pr-8">
            <span className="rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]">Advertisement</span>
            <Sparkles className="h-5 w-5 opacity-80" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">Useful tools. One fast workspace.</h2>
          <p className="mt-3 text-sm leading-6 text-white/80">ZidroTool keeps everyday web utilities, creator tools and productivity workflows in one privacy-focused place.</p>
        </div>

        <div className="p-6">
          <div className="rounded-xl border border-ink-200 bg-ink-50 p-5 text-center dark:border-ink-700 dark:bg-ink-950">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-ink-400">Ad space</p>
            <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">This slot is ready for your approved advertising provider.</p>
          </div>
          <button type="button" onClick={close} className="mt-5 w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white hover:bg-brand-700">Continue to ZidroTool</button>
        </div>
      </div>
    </div>
  );
}
