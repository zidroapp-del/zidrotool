import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/components/Toast";
import { Copy, Check, Scale } from "lucide-react";

const CATEGORIES = {
  length: { name: "Length", units: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.344, yd: 0.9144, ft: 0.3048, in: 0.0254 } },
  weight: { name: "Weight", units: { kg: 1, g: 0.001, mg: 0.000001, t: 1000, lb: 0.453592, oz: 0.0283495, st: 6.35029 } },
  temperature: { name: "Temperature", units: { C: "C", F: "F", K: "K" } },
  area: { name: "Area", units: { "m²": 1, "km²": 1000000, "cm²": 0.0001, "ha": 10000, "acre": 4046.86, "ft²": 0.092903, "in²": 0.00064516 } },
  volume: { name: "Volume", units: { L: 1, mL: 0.001, "m³": 1000, "gal": 3.78541, "qt": 0.946353, "pt": 0.473176, "cup": 0.236588, "fl oz": 0.0295735 } },
  speed: { name: "Speed", units: { "m/s": 1, "km/h": 0.277778, "mph": 0.44704, "ft/s": 0.3048, "knot": 0.514444 } },
};

type CatKey = keyof typeof CATEGORIES;

function convertTemp(val: number, from: string, to: string): number {
  let c: number;
  if (from === "C") c = val;
  else if (from === "F") c = (val - 32) * 5 / 9;
  else c = val - 273.15;
  if (to === "C") return c;
  if (to === "F") return c * 9 / 5 + 32;
  return c + 273.15;
}

export default function UnitConverterFull() {
  const { t } = useTranslation();
  const { success } = useToast();
  const [cat, setCat] = useState<CatKey>("length");
  const [fromUnit, setFromUnit] = useState("m");
  const [toUnit, setToUnit] = useState("ft");
  const [value, setValue] = useState("1");
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const v = parseFloat(value);
    if (isNaN(v)) return "";
    if (cat === "temperature") {
      const r = convertTemp(v, fromUnit, toUnit);
      return r.toFixed(4).replace(/\.?0+$/, "");
    }
    const fromFactor = (CATEGORIES[cat].units as Record<string, number>)[fromUnit];
    const toFactor = (CATEGORIES[cat].units as Record<string, number>)[toUnit];
    if (!fromFactor || !toFactor) return "";
    return ((v * fromFactor) / toFactor).toFixed(6).replace(/\.?0+$/, "");
  }, [value, fromUnit, toUnit, cat]);

  const units = Object.keys(CATEGORIES[cat].units);

  const onCatChange = (c: CatKey) => {
    setCat(c);
    const keys = Object.keys(CATEGORIES[c].units);
    setFromUnit(keys[0]);
    setToUnit(keys[1] || keys[0]);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Scale className="h-5 w-5 text-brand-600 dark:text-brand-400" />
        <p className="text-sm text-ink-600 dark:text-ink-400">{t("tool.unit-converter.desc")}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(CATEGORIES) as CatKey[]).map((c) => (
          <button
            key={c}
            onClick={() => onCatChange(c)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 active:scale-95 ${
              cat === c
                ? "bg-brand-600 text-white shadow-sm"
                : "bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300"
            }`}
          >
            {CATEGORIES[c].name}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">From</label>
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="input"
            placeholder="0"
          />
          <select value={fromUnit} onChange={(e) => setFromUnit(e.target.value)} className="input mt-2">
            {units.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label className="label">To</label>
          <input
            readOnly
            value={result}
            className="input bg-ink-50 dark:bg-ink-800"
            placeholder="0"
          />
          <div className="mt-2 flex gap-2">
            <select value={toUnit} onChange={(e) => setToUnit(e.target.value)} className="input flex-1">
              {units.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
            <button
              onClick={async () => {
                if (!result) return;
                await navigator.clipboard.writeText(`${value} ${fromUnit} = ${result} ${toUnit}`);
                setCopied(true);
                success(t("tool.copied"));
                setTimeout(() => setCopied(false), 2000);
              }}
              className="btn-secondary shrink-0"
            >
              {copied ? <Check className="h-4 w-4 text-success-700" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {result && (
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 text-center dark:border-brand-800 dark:bg-brand-900/20">
          <p className="text-lg font-semibold text-brand-700 dark:text-brand-300">
            {value} {fromUnit} = {result} {toUnit}
          </p>
        </div>
      )}
    </div>
  );
}
