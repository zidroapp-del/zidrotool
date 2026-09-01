import { useState, useMemo } from "react";
import { Copy, Check, Clock } from "lucide-react";
import { cn, copyToClipboard } from "@/lib/utils";

const FIELDS = [
  { key: "minute", label: "Minute", values: "0-59 or * , - /", default: "*" },
  { key: "hour", label: "Hour", values: "0-23 or * , - /", default: "*" },
  { key: "dayOfMonth", label: "Day of Month", values: "1-31 or * , - / ? L", default: "*" },
  { key: "month", label: "Month", values: "1-12 or * , - /", default: "*" },
  { key: "dayOfWeek", label: "Day of Week", values: "0-6 or * , - / ? L", default: "*" },
];

function describeCron(parts: string[]): string {
  const [min, hour, dom, mon, dow] = parts;
  const desc: string[] = [];
  if (min === "*") desc.push("Every minute");
  else desc.push(`At minute ${min}`);
  if (hour !== "*") desc.push(`past hour ${hour}`);
  if (dom !== "*" && dow !== "*") desc.push(`on day ${dom} of month and on ${["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][parseInt(dow) || 0]}`);
  else if (dom !== "*") desc.push(`on day ${dom} of the month`);
  else if (dow !== "*") desc.push(`on every ${["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][parseInt(dow) || 0]}`);
  if (mon !== "*") desc.push(`in month ${mon}`);
  return desc.join(" ");
}

export default function CrontabGenerator() {
  const [vals, setVals] = useState<Record<string, string>>(
    Object.fromEntries(FIELDS.map((f) => [f.key, f.default]))
  );
  const [copied, setCopied] = useState(false);

  const cronExpr = useMemo(() => FIELDS.map((f) => vals[f.key] || "*").join(" "), [vals]);
  const description = useMemo(() => {
    try { return describeCron(cronExpr.split(" ")); } catch { return "Invalid expression"; }
  }, [cronExpr]);

  const handleCopy = async () => {
    const ok = await copyToClipboard(cronExpr);
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  return (
    <div>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-5">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label className="label mb-1.5 block">{f.label}</label>
            <input
              type="text"
              value={vals[f.key]}
              onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })}
              className="input font-mono text-sm"
              placeholder={f.default}
            />
            <p className="mt-1 text-[10px] text-ink-400">{f.values}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border-2 border-brand-200 bg-brand-50/50 p-6 dark:border-brand-800 dark:bg-brand-900/10">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">Cron Expression</p>
        <div className="mt-3 flex items-center gap-3">
          <code className="flex-1 truncate rounded-lg bg-white px-4 py-3 text-lg font-mono font-bold text-ink-900 dark:bg-ink-900 dark:text-ink-100">
            {cronExpr}
          </code>
          <button onClick={handleCopy} className={cn("btn shrink-0", copied ? "btn-primary" : "btn-secondary")}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <div className="mt-4 flex items-start gap-2">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
          <p className="text-sm text-ink-600 dark:text-ink-400">{description}</p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-ink-200 p-4 dark:border-ink-700">
        <h3 className="mb-2 text-sm font-semibold text-ink-900 dark:text-ink-100">Quick Examples</h3>
        <div className="space-y-1.5">
          {[
            { expr: "0 * * * *", desc: "Every hour at minute 0" },
            { expr: "*/15 * * * *", desc: "Every 15 minutes" },
            { expr: "0 9 * * 1-5", desc: "Weekdays at 9 AM" },
            { expr: "0 0 * * 0", desc: "Every Sunday at midnight" },
            { expr: "0 0 1 * *", desc: "First day of every month at midnight" },
          ].map((ex) => (
            <button
              key={ex.expr}
              onClick={() => { const parts = ex.expr.split(" "); const nv: Record<string, string> = {}; FIELDS.forEach((f, i) => { nv[f.key] = parts[i] || "*"; }); setVals(nv); }}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors hover:bg-ink-50 dark:hover:bg-ink-800"
            >
              <code className="font-mono text-sm text-brand-600 dark:text-brand-400">{ex.expr}</code>
              <span className="text-xs text-ink-400">{ex.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
