import { useState, useMemo } from "react";

export default function PregnancyCalculator() {
  const [lmp, setLmp] = useState("");

  const result = useMemo(() => {
    if (!lmp) return null;
    const lmpDate = new Date(lmp);
    if (isNaN(lmpDate.getTime())) return null;
    const dueDate = new Date(lmpDate);
    dueDate.setDate(dueDate.getDate() + 280);
    const now = new Date();
    const daysPregnant = Math.floor((now.getTime() - lmpDate.getTime()) / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(daysPregnant / 7);
    const days = daysPregnant % 7;
    const remaining = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return { dueDate, weeks, days, remaining };
  }, [lmp]);

  const fmtDate = (d: Date) => d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div>
      <div className="mb-6">
        <label className="label mb-2 block">First Day of Last Period (LMP)</label>
        <input type="date" value={lmp} onChange={(e) => setLmp(e.target.value)} className="input" />
      </div>
      {result && (
        <div className="space-y-3">
          <div className="rounded-xl border-2 border-brand-200 bg-brand-50/50 p-6 text-center dark:border-brand-800 dark:bg-brand-900/10">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">Estimated Due Date</p>
            <p className="mt-2 text-xl font-bold text-ink-900 dark:text-ink-100">{fmtDate(result.dueDate)}</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-ink-200 p-4 text-center dark:border-ink-700"><p className="text-xs text-ink-400">Current Week</p><p className="mt-1 text-2xl font-bold text-ink-900 dark:text-ink-100">{result.weeks}</p></div>
            <div className="rounded-xl border border-ink-200 p-4 text-center dark:border-ink-700"><p className="text-xs text-ink-400">Days into week</p><p className="mt-1 text-2xl font-bold text-ink-900 dark:text-ink-100">{result.days}</p></div>
            <div className="rounded-xl border border-ink-200 p-4 text-center dark:border-ink-700"><p className="text-xs text-ink-400">Days remaining</p><p className="mt-1 text-2xl font-bold text-ink-900 dark:text-ink-100">{Math.max(0, result.remaining)}</p></div>
          </div>
        </div>
      )}
    </div>
  );
}
