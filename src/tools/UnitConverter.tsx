import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeftRight } from "lucide-react";

const UNITS = {
  length: {
    name: "Length",
    units: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.344, yd: 0.9144, ft: 0.3048, in: 0.0254 },
  },
  weight: {
    name: "Weight",
    units: { kg: 1, g: 0.001, mg: 0.000001, lb: 0.45359237, oz: 0.028349523125, ton: 1000 },
  },
  temperature: {
    name: "Temperature",
    units: { C: "C", F: "F", K: "K" },
  },
} as const;

type Cat = keyof typeof UNITS;

function convertTemp(val: number, from: string, to: string): number {
  let c = val;
  if (from === "F") c = (val - 32) * 5/9;
  else if (from === "K") c = val - 273.15;
  if (to === "F") return c * 9/5 + 32;
  if (to === "K") return c + 273.15;
  return c;
}

export default function UnitConverter() {
  const { t: _t } = useTranslation();
  const [cat, setCat] = useState<Cat>("length");
  const [value, setValue] = useState("1");
  const [from, setFrom] = useState("m");
  const [to, setTo] = useState("ft");

  const unitKeys = Object.keys(UNITS[cat].units);

  const result = useMemo(() => {
    const v = parseFloat(value);
    if (isNaN(v)) return "";
    if (cat === "temperature") return convertTemp(v, from, to).toFixed(4).replace(/\.?0+$/, "");
    const fromFactor = (UNITS[cat].units as Record<string, number>)[from];
    const toFactor = (UNITS[cat].units as Record<string, number>)[to];
    return (v * fromFactor / toFactor).toPrecision(6).replace(/\.?0+$/, "");
  }, [value, from, to, cat]);

  const setCategory = (c: Cat) => {
    setCat(c);
    const keys = Object.keys(UNITS[c].units);
    setFrom(keys[0]);
    setTo(keys[1] || keys[0]);
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {(Object.keys(UNITS) as Cat[]).map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              cat === c ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300 dark:hover:bg-ink-700"
            }`}
          >
            {UNITS[c].name}
          </button>
        ))}
      </div>

      <div className="grid items-end gap-4 sm:grid-cols-[1fr_auto_1fr]">
        <div>
          <label className="label">From</label>
          <div className="flex gap-2">
            <input type="number" value={value} onChange={(e) => setValue(e.target.value)} className="input" />
            <select value={from} onChange={(e) => setFrom(e.target.value)} className="input w-24">
              {unitKeys.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>
        <button
          onClick={() => { setFrom(to); setTo(from); }}
          className="btn-secondary mb-0.5"
          aria-label="Swap units"
        >
          <ArrowLeftRight className="h-4 w-4" />
        </button>
        <div>
          <label className="label">To</label>
          <div className="flex gap-2">
            <input type="text" value={result} readOnly className="input bg-ink-50 dark:bg-ink-950/50" />
            <select value={to} onChange={(e) => setTo(e.target.value)} className="input w-24">
              {unitKeys.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>
      </div>

      {result && (
        <div className="mt-4 rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
          {value} {from} = <strong>{result} {to}</strong>
        </div>
      )}
    </div>
  );
}
