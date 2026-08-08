import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

const PLATFORMS = [
  { name: "Twitter / X", limit: 280, color: "text-ink-700 dark:text-ink-300" },
  { name: "Instagram", limit: 2200, color: "text-danger" },
  { name: "TikTok", limit: 2200, color: "text-ink-700 dark:text-ink-300" },
  { name: "Facebook", limit: 63206, color: "text-brand-600 dark:text-brand-400" },
  { name: "YouTube", limit: 5000, color: "text-danger" },
  { name: "LinkedIn", limit: 3000, color: "text-brand-600 dark:text-brand-400" },
];

export default function TwitterCounter() {
  const [text, setText] = useState("");

  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div>
      <div className="mb-6">
        <label className="label mb-2 block">Your post</label>
        <textarea value={text} onChange={(e) => setText(e.target.value)} className="input min-h-[120px] resize-y" placeholder="Type your social media post..." />
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-ink-200 p-4 text-center dark:border-ink-700"><p className="text-2xl font-bold text-ink-900 dark:text-ink-100">{chars}</p><p className="text-xs text-ink-400">Characters</p></div>
        <div className="rounded-xl border border-ink-200 p-4 text-center dark:border-ink-700"><p className="text-2xl font-bold text-ink-900 dark:text-ink-100">{words}</p><p className="text-xs text-ink-400">Words</p></div>
      </div>
      <h3 className="mb-3 text-sm font-semibold text-ink-900 dark:text-ink-100">Platform limits</h3>
      <div className="space-y-2">
        {PLATFORMS.map((p) => {
          const remaining = p.limit - chars;
          const pct = Math.min(100, (chars / p.limit) * 100);
          const over = remaining < 0;
          return (
            <div key={p.name} className="rounded-lg border border-ink-200 p-3 dark:border-ink-700">
              <div className="mb-1.5 flex items-center justify-between">
                <span className={cn("text-sm font-medium", p.color)}>{p.name}</span>
                <span className={cn("text-xs font-bold", over ? "text-danger" : remaining < 50 ? "text-warning-600" : "text-success-700 dark:text-success-600")}>{over ? `${Math.abs(remaining)} over` : `${remaining} left`}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800"><div className={cn("h-full rounded-full transition-all", over ? "bg-danger" : pct > 80 ? "bg-warning-500" : "bg-success-500")} style={{ width: `${pct}%` }} /></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
