import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

const UNITS: Record<string, { label: string; toC: (v: number) => number; fromC: (v: number) => number }> = {
  celsius: { label: "Celsius (°C)", toC: (v) => v, fromC: (v) => v },
  fahrenheit: { label: "Fahrenheit (°F)", toC: (v) => (v - 32) * 5 / 9, fromC: (v) => v * 9 / 5 + 32 },
  kelvin: { label: "Kelvin (K)", toC: (v) => v - 273.15, fromC: (v) => v + 273.15 },
};

export default function TemperatureConverter() {
  const [from, setFrom] = useState("celsius");
  const [to, setTo] = useState("fahrenheit");
  const [value, setValue] = useState(20);

  const result = useMemo(() => {
    const c = UNITS[from].toC(value);
    return UNITS[to].fromC(c);
  }, [from, to, value]);

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div><label className="label mb-1.5 block">From</label><select value={from} onChange={(e) => setFrom(e.target.value)} className="input">{Object.entries(UNITS).map(([k, u]) => <option key={k} value={k}>{u.label}</option>)}</select></div>
        <div><label className="label mb-1.5 block">To</label><select value={to} onChange={(e) => setTo(e.target.value)} className="input">{Object.entries(UNITS).map(([k, u]) => <option key={k} value={k}>{u.label}</option>)}</select></div>
      </div>
      <div className="mb-6"><label className="label mb-1.5 block">Value</label><input type="number" value={value} onChange={(e) => setValue(parseFloat(e.target.value) || 0)} className="input" /></div>
      <div className="rounded-xl border-2 border-brand-200 bg-brand-50/50 p-6 text-center dark:border-brand-800 dark:bg-brand-900/10"><p className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">Result</p><p className="mt-2 text-3xl font-bold text-ink-900 dark:text-ink-100">{result.toFixed(2)} {UNITS[to].label.match(/\((.*?)\)/)?.[1]}</p></div>
    </div>
  );
}
