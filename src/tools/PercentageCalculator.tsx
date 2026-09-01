import { useMemo, useState } from "react";

type Mode = "ofTotal" | "increase" | "decrease";

export default function PercentageCalculator() {
  const [mode, setMode] = useState<Mode>("ofTotal");
  const [a, setA] = useState("25");
  const [b, setB] = useState("200");

  const result = useMemo(() => {
    const na = parseFloat(a);
    const nb = parseFloat(b);
    if (isNaN(na) || isNaN(nb)) return "";
    if (mode === "ofTotal") return ((na / 100) * nb).toFixed(2).replace(/\.?0+$/, "");
    if (mode === "increase") return (((nb - na) / na) * 100).toFixed(2).replace(/\.?0+$/, "") + "%";
    return (((na - nb) / na) * 100).toFixed(2).replace(/\.?0+$/, "") + "%";
  }, [mode, a, b]);

  const labels: Record<Mode, { a: string; b: string; desc: string }> = {
    ofTotal: { a: "Percentage (%)", b: "Of value", desc: "What is X% of Y?" },
    increase: { a: "Original value", b: "New value", desc: "Percentage change from A to B" },
    decrease: { a: "Original value", b: "New value", desc: "Percentage decrease from A to B" },
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {([
          { key: "ofTotal", label: "X% of Y" },
          { key: "increase", label: "% Increase" },
          { key: "decrease", label: "% Decrease" },
        ] as { key: Mode; label: string }[]).map((m) => (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === m.key ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300 dark:hover:bg-ink-700"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">{labels[mode].a}</label>
          <input type="number" value={a} onChange={(e) => setA(e.target.value)} className="input" />
        </div>
        <div>
          <label className="label">{labels[mode].b}</label>
          <input type="number" value={b} onChange={(e) => setB(e.target.value)} className="input" />
        </div>
      </div>

      <div className="mt-6 rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 p-6 text-center text-white">
        <p className="text-sm text-white/80">{labels[mode].desc}</p>
        <p className="mt-2 text-3xl font-bold">{result || "—"}</p>
      </div>
    </div>
  );
}
