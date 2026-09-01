import { useState, useMemo } from "react";

export default function CompoundInterest() {
  const [principal, setPrincipal] = useState(10000);
  const [rate, setRate] = useState(7);
  const [years, setYears] = useState(10);
  const [freq, setFreq] = useState("12");

  const result = useMemo(() => {
    const n = parseInt(freq);
    const r = rate / 100;
    const total = principal * Math.pow(1 + r / n, n * years);
    const interest = total - principal;
    return { total, interest };
  }, [principal, rate, years, freq]);

  const fmt = (v: number) => v.toLocaleString("en-US", { style: "currency", currency: "USD" });

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div><label className="label mb-1.5 block">Principal ($)</label><input type="number" value={principal} onChange={(e) => setPrincipal(Math.max(0, parseFloat(e.target.value) || 0))} className="input" /></div>
        <div><label className="label mb-1.5 block">Rate (%)</label><input type="number" step="0.1" value={rate} onChange={(e) => setRate(parseFloat(e.target.value) || 0)} className="input" /></div>
        <div><label className="label mb-1.5 block">Years</label><input type="number" value={years} onChange={(e) => setYears(Math.max(1, parseInt(e.target.value) || 1))} className="input" /></div>
        <div><label className="label mb-1.5 block">Compounding</label><select value={freq} onChange={(e) => setFreq(e.target.value)} className="input"><option value="1">Annually</option><option value="2">Semi-annually</option><option value="4">Quarterly</option><option value="12">Monthly</option><option value="365">Daily</option></select></div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border-2 border-brand-200 bg-brand-50/50 p-4 text-center dark:border-brand-800 dark:bg-brand-900/10"><p className="text-xs text-ink-400">Final Amount</p><p className="mt-1 text-2xl font-bold text-brand-700 dark:text-brand-400">{fmt(result.total)}</p></div>
        <div className="rounded-xl border border-ink-200 p-4 text-center dark:border-ink-700"><p className="text-xs text-ink-400">Interest Earned</p><p className="mt-1 text-2xl font-bold text-ink-900 dark:text-ink-100">{fmt(result.interest)}</p></div>
        <div className="rounded-xl border border-ink-200 p-4 text-center dark:border-ink-700"><p className="text-xs text-ink-400">Growth</p><p className="mt-1 text-2xl font-bold text-ink-900 dark:text-ink-100">{((result.total / principal - 1) * 100).toFixed(0)}%</p></div>
      </div>
    </div>
  );
}
