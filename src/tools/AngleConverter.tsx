import { useState, useMemo } from "react";

const UNITS: Record<string, { label: string; toDeg: (v: number) => number; fromDeg: (v: number) => number }> = {
  degree: { label: "Degrees (°)", toDeg: (v) => v, fromDeg: (v) => v },
  radian: { label: "Radians (rad)", toDeg: (v) => v * 180 / Math.PI, fromDeg: (v) => v * Math.PI / 180 },
  gradian: { label: "Gradians (gon)", toDeg: (v) => v * 0.9, fromDeg: (v) => v / 0.9 },
  turn: { label: "Turns (tr)", toDeg: (v) => v * 360, fromDeg: (v) => v / 360 },
};

export default function AngleConverter() {
  const [from, setFrom] = useState("degree");
  const [to, setTo] = useState("radian");
  const [value, setValue] = useState(90);

  const result = useMemo(() => UNITS[to].fromDeg(UNITS[from].toDeg(value)), [from, to, value]);

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div><label className="label mb-1.5 block">From</label><select value={from} onChange={(e) => setFrom(e.target.value)} className="input">{Object.entries(UNITS).map(([k, u]) => <option key={k} value={k}>{u.label}</option>)}</select></div>
        <div><label className="label mb-1.5 block">To</label><select value={to} onChange={(e) => setTo(e.target.value)} className="input">{Object.entries(UNITS).map(([k, u]) => <option key={k} value={k}>{u.label}</option>)}</select></div>
      </div>
      <div className="mb-6"><label className="label mb-1.5 block">Value</label><input type="number" value={value} onChange={(e) => setValue(parseFloat(e.target.value) || 0)} className="input" /></div>
      <div className="rounded-xl border-2 border-brand-200 bg-brand-50/50 p-6 text-center dark:border-brand-800 dark:bg-brand-900/10"><p className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">Result</p><p className="mt-2 text-3xl font-bold text-ink-900 dark:text-ink-100">{result.toFixed(6)} {UNITS[to].label.match(/\((.*?)\)/)?.[1]}</p></div>
    </div>
  );
}
