import { useState, useMemo } from "react";

export default function DiscountCalculator() {
  const [price, setPrice] = useState(100);
  const [discount, setDiscount] = useState(20);

  const result = useMemo(() => {
    const savings = price * discount / 100;
    return { savings, final: price - savings };
  }, [price, discount]);

  const fmt = (v: number) => v.toLocaleString("en-US", { style: "currency", currency: "USD" });

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div><label className="label mb-1.5 block">Original Price ($)</label><input type="number" value={price} onChange={(e) => setPrice(Math.max(0, parseFloat(e.target.value) || 0))} className="input" /></div>
        <div><label className="label mb-1.5 block">Discount (%)</label><input type="number" value={discount} onChange={(e) => setDiscount(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))} className="input" /></div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-ink-200 p-4 text-center dark:border-ink-700"><p className="text-xs text-ink-400">You Save</p><p className="mt-1 text-2xl font-bold text-success-700 dark:text-success-600">{fmt(result.savings)}</p></div>
        <div className="rounded-xl border-2 border-brand-200 bg-brand-50/50 p-4 text-center dark:border-brand-800 dark:bg-brand-900/10"><p className="text-xs text-ink-400">Final Price</p><p className="mt-1 text-2xl font-bold text-brand-700 dark:text-brand-400">{fmt(result.final)}</p></div>
      </div>
    </div>
  );
}
