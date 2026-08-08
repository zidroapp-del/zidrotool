import { useState, useMemo } from "react";

export default function WaterIntake() {
  const [weight, setWeight] = useState(70);
  const [activity, setActivity] = useState(30);

  const result = useMemo(() => {
    const base = weight * 35;
    const extra = activity * 12;
    return { ml: base + extra, liters: (base + extra) / 1000, oz: (base + extra) / 29.574, glasses: Math.round((base + extra) / 250) };
  }, [weight, activity]);

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div><label className="label mb-1.5 block">Weight (kg)</label><input type="number" value={weight} onChange={(e) => setWeight(Math.max(0, parseFloat(e.target.value) || 0))} className="input" /></div>
        <div><label className="label mb-1.5 block">Exercise (min/day)</label><input type="number" value={activity} onChange={(e) => setActivity(Math.max(0, parseInt(e.target.value) || 0))} className="input" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border-2 border-brand-200 bg-brand-50/50 p-4 text-center dark:border-brand-800 dark:bg-brand-900/10"><p className="text-xs text-ink-400">Liters</p><p className="mt-1 text-2xl font-bold text-brand-700 dark:text-brand-400">{result.liters.toFixed(1)}L</p></div>
        <div className="rounded-xl border border-ink-200 p-4 text-center dark:border-ink-700"><p className="text-xs text-ink-400">Milliliters</p><p className="mt-1 text-lg font-bold text-ink-900 dark:text-ink-100">{Math.round(result.ml)}</p></div>
        <div className="rounded-xl border border-ink-200 p-4 text-center dark:border-ink-700"><p className="text-xs text-ink-400">Fluid Oz</p><p className="mt-1 text-lg font-bold text-ink-900 dark:text-ink-100">{Math.round(result.oz)}</p></div>
        <div className="rounded-xl border border-ink-200 p-4 text-center dark:border-ink-700"><p className="text-xs text-ink-400">Glasses (250ml)</p><p className="mt-1 text-lg font-bold text-ink-900 dark:text-ink-100">{result.glasses}</p></div>
      </div>
    </div>
  );
}
