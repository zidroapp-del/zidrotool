import { useState } from "react";
import { AdSlot } from "@/components/AdSlot";

interface DownloadAdGateProps {
  onContinue: () => void;
  title?: string;
}

/**
 * Optional pre-download interstitial for tools that have a real download action.
 * It deliberately does not require an ad click. Replace AdSlot with the site's
 * approved ad provider when the ad account is configured.
 */
export function DownloadAdGate({ onContinue, title = "Your download is ready" }: DownloadAdGateProps) {
  const [ready, setReady] = useState(false);

  return (
    <div className="space-y-4 rounded-2xl border border-ink-200 bg-white p-4 shadow-sm dark:border-ink-700 dark:bg-ink-900 sm:p-5">
      <div>
        <h3 className="font-semibold text-ink-900 dark:text-white">{title}</h3>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">This space may contain an advertisement. You never need to click an ad to download your file.</p>
      </div>
      <AdSlot variant="inline" />
      <button
        type="button"
        disabled={!ready}
        onClick={onContinue}
        className="w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {ready ? "Continue to download" : "Preparing download…"}
      </button>
      {!ready && <button type="button" onClick={() => setReady(true)} className="mx-auto block text-xs text-ink-400 underline underline-offset-2 hover:text-ink-600 dark:hover:text-ink-200">Continue when the ad area is ready</button>}
    </div>
  );
}
