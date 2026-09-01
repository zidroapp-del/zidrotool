import { useState, useMemo } from "react";

export default function TaxCalculator() {
  const [amount, setAmount] = useState(100);
  const [rate, setRate] = useState(8.5);
  const [mode, setMode] = useState<"add" | "remove">("add");

  const result = useMemo(() => {
    if (mode === "add") {
      const tax = amount * rate / 100;
      return { tax, total: amount + tax, base: amount };
    } else {
      const base = amount / (1 + rate / 100);
      return { tax: amount - base, total: amount, base };
    }
  }, [amount, rate, mode]);

  const fmt = (v: number) => v.toLocaleString("en-US", { style: "currency", currency: "USD" });

  return (
    <div>
      <div className="mb-4 flex gap-1.5">
        <button onClick={() => setMode("add")} className={`btn btn-sm ${mode === "add" ? "btn-primary" : "btn-secondary"}`}>Add tax to price</button>
        <button onClick={() => setMode("remove")} className={`btn btn-sm ${mode === "remove" ? "btn-primary" : "btn-secondary"}`}>Remove tax from price</button>
      </div>
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div><label className="label mb-1.5 block">{mode === "add" ? "Price (before tax)" : "Price (with tax)"}</label><input type="number" value={amount} onChange={(e) => setAmount(Math.max(0, parseFloat(e.target.value) || 0))} className="input" /></div>
        <div><label className="label mb-1.5 block">Tax Rate (%)</label><input type="number" step="0.1" value={rate} onChange={(e) => setRate(parseFloat(e.target.value) || 0)} className="input" /></div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-ink-200 p-4 text-center dark:border-ink-700"><p className="text-xs text-ink-400">Base Price</p><p className="mt-1 text-xl font-bold text-ink-900 dark:text-ink-100">{fmt(result.base)}</p></div>
        <div className="rounded-xl border-2 border-brand-200 bg-brand-50/50 p-4 text-center dark:border-brand-800 dark:bg-brand-900/10"><p className="text-xs text-ink-400">Tax Amount</p><p className="mt-1 text-xl font-bold text-brand-700 dark:text-brand-400">{fmt(result.tax)}</p></div>
        <div className="rounded-xl border border-ink-200 p-4 text-center dark:border-ink-700"><p className="text-xs text-ink-400">Total Price</p><p className="mt-1 text-xl font-bold text-ink-900 dark:text-ink-100">{fmt(result.total)}</p></div>
      </div>
    </div>
  );
}
