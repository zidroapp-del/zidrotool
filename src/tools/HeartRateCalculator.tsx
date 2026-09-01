import { useState, useMemo } from "react";

export default function HeartRateCalculator() {
  const [age, setAge] = useState(30);
  const [resting, setResting] = useState(60);

  const result = useMemo(() => {
    const maxHr = 220 - age;
    const reserve = maxHr - resting;
    return {
      max: maxHr,
      zone50: { low: Math.round(resting + reserve * 0.5), high: Math.round(resting + reserve * 0.6) },
      zone60: { low: Math.round(resting + reserve * 0.6), high: Math.round(resting + reserve * 0.7) },
      zone70: { low: Math.round(resting + reserve * 0.7), high: Math.round(resting + reserve * 0.8) },
      zone80: { low: Math.round(resting + reserve * 0.8), high: Math.round(resting + reserve * 0.9) },
      zone90: { low: Math.round(resting + reserve * 0.9), high: maxHr },
    };
  }, [age, resting]);

  const zones = [
    { label: "Zone 1 (50-60%)", ...result.zone50, color: "bg-success-500" },
    { label: "Zone 2 (60-70%)", ...result.zone60, color: "bg-brand-500" },
    { label: "Zone 3 (70-80%)", ...result.zone70, color: "bg-warning-500" },
    { label: "Zone 4 (80-90%)", ...result.zone80, color: "bg-danger/80" },
    { label: "Zone 5 (90-100%)", ...result.zone90, color: "bg-danger" },
  ];

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div><label className="label mb-1.5 block">Age</label><input type="number" value={age} onChange={(e) => setAge(Math.max(1, parseInt(e.target.value) || 1))} className="input" /></div>
        <div><label className="label mb-1.5 block">Resting HR (bpm)</label><input type="number" value={resting} onChange={(e) => setResting(Math.max(40, parseInt(e.target.value) || 40))} className="input" /></div>
      </div>
      <div className="mb-6 rounded-xl border-2 border-brand-200 bg-brand-50/50 p-4 text-center dark:border-brand-800 dark:bg-brand-900/10"><p className="text-xs text-ink-400">Maximum Heart Rate</p><p className="mt-1 text-3xl font-bold text-brand-700 dark:text-brand-400">{result.max} bpm</p></div>
      <h3 className="mb-3 text-sm font-semibold text-ink-900 dark:text-ink-100">Training Zones</h3>
      <div className="space-y-2">
        {zones.map((z) => (
          <div key={z.label} className="flex items-center gap-3 rounded-lg border border-ink-200 p-3 dark:border-ink-700">
            <div className={`h-3 w-3 rounded-full ${z.color}`} />
            <span className="flex-1 text-sm text-ink-700 dark:text-ink-300">{z.label}</span>
            <span className="text-sm font-bold text-ink-900 dark:text-ink-100">{z.low}–{z.high} bpm</span>
          </div>
        ))}
      </div>
    </div>
  );
}
