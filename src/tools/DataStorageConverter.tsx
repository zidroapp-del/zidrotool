import { useState, useMemo } from "react";

const UNITS: Record<string, { label: string; bytes: number }> = {
  bit: { label: "Bits (b)", bytes: 0.125 },
  byte: { label: "Bytes (B)", bytes: 1 },
  kilobyte: { label: "Kilobytes (KB)", bytes: 1024 },
  megabyte: { label: "Megabytes (MB)", bytes: 1024 ** 2 },
  gigabyte: { label: "Gigabytes (GB)", bytes: 1024 ** 3 },
  terabyte: { label: "Terabytes (TB)", bytes: 1024 ** 4 },
  petabyte: { label: "Petabytes (PB)", bytes: 1024 ** 5 },
};

export default function DataStorageConverter() {
  const [from, setFrom] = useState("megabyte");
  const [to, setTo] = useState("kilobyte");
  const [value, setValue] = useState(1);

  const result = useMemo(() => (value * UNITS[from].bytes) / UNITS[to].bytes, [from, to, value]);

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div><label className="label mb-1.5 block">From</label><select value={from} onChange={(e) => setFrom(e.target.value)} className="input">{Object.entries(UNITS).map(([k, u]) => <option key={k} value={k}>{u.label}</option>)}</select></div>
        <div><label className="label mb-1.5 block">To</label><select value={to} onChange={(e) => setTo(e.target.value)} className="input">{Object.entries(UNITS).map(([k, u]) => <option key={k} value={k}>{u.label}</option>)}</select></div>
      </div>
      <div className="mb-6"><label className="label mb-1.5 block">Value</label><input type="number" value={value} onChange={(e) => setValue(parseFloat(e.target.value) || 0)} className="input" /></div>
      <div className="rounded-xl border-2 border-brand-200 bg-brand-50/50 p-6 text-center dark:border-brand-800 dark:bg-brand-900/10"><p className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">Result</p><p className="mt-2 text-3xl font-bold text-ink-900 dark:text-ink-100">{result.toLocaleString(undefined, { maximumFractionDigits: 6 })} {UNITS[to].label}</p></div>
    </div>
  );
}
