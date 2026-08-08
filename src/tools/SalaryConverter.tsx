import { useState, useMemo } from "react";

export default function SalaryConverter() {
  const [hourly, setHourly] = useState(25);
  const [hoursPerWeek, setHoursPerWeek] = useState(40);

  const result = useMemo(() => {
    const weekly = hourly * hoursPerWeek;
    const monthly = weekly * 52 / 12;
    const annual = weekly * 52;
    return { weekly, monthly, annual, daily: hourly * 8 };
  }, [hourly, hoursPerWeek]);

  const fmt = (v: number) => v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div><label className="label mb-1.5 block">Hourly Rate ($)</label><input type="number" step="0.5" value={hourly} onChange={(e) => setHourly(Math.max(0, parseFloat(e.target.value) || 0))} className="input" /></div>
        <div><label className="label mb-1.5 block">Hours / Week</label><input type="number" value={hoursPerWeek} onChange={(e) => setHoursPerWeek(Math.max(1, parseInt(e.target.value) || 40))} className="input" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-ink-200 p-4 text-center dark:border-ink-700"><p className="text-xs text-ink-400">Daily</p><p className="mt-1 text-lg font-bold text-ink-900 dark:text-ink-100">{fmt(result.daily)}</p></div>
        <div className="rounded-xl border border-ink-200 p-4 text-center dark:border-ink-700"><p className="text-xs text-ink-400">Weekly</p><p className="mt-1 text-lg font-bold text-ink-900 dark:text-ink-100">{fmt(result.weekly)}</p></div>
        <div className="rounded-xl border border-ink-200 p-4 text-center dark:border-ink-700"><p className="text-xs text-ink-400">Monthly</p><p className="mt-1 text-lg font-bold text-ink-900 dark:text-ink-100">{fmt(result.monthly)}</p></div>
        <div className="rounded-xl border-2 border-brand-200 bg-brand-50/50 p-4 text-center dark:border-brand-800 dark:bg-brand-900/10"><p className="text-xs text-ink-400">Annual</p><p className="mt-1 text-lg font-bold text-brand-700 dark:text-brand-400">{fmt(result.annual)}</p></div>
      </div>
    </div>
  );
}
