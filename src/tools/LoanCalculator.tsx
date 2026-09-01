import { useState, useMemo } from "react";

export default function LoanCalculator() {
  const [amount, setAmount] = useState(20000);
  const [rate, setRate] = useState(5.5);
  const [years, setYears] = useState(5);

  const result = useMemo(() => {
    const principal = amount;
    const monthlyRate = rate / 100 / 12;
    const n = years * 12;
    if (monthlyRate === 0) return { monthly: principal / n, total: principal, interest: 0 };
    const monthly = principal * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
    const total = monthly * n;
    return { monthly, total, interest: total - principal };
  }, [amount, rate, years]);

  const fmt = (v: number) => v.toLocaleString("en-US", { style: "currency", currency: "USD" });

  return (
    <div>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div><label className="label mb-1.5 block">Loan Amount ($)</label><input type="number" value={amount} onChange={(e) => setAmount(Math.max(0, parseFloat(e.target.value) || 0))} className="input" /></div>
        <div><label className="label mb-1.5 block">Interest Rate (%)</label><input type="number" step="0.1" value={rate} onChange={(e) => setRate(Math.max(0, parseFloat(e.target.value) || 0))} className="input" /></div>
        <div><label className="label mb-1.5 block">Term (years)</label><input type="number" value={years} onChange={(e) => setYears(Math.max(1, parseInt(e.target.value) || 1))} className="input" /></div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border-2 border-brand-200 bg-brand-50/50 p-4 text-center dark:border-brand-800 dark:bg-brand-900/10"><p className="text-xs text-ink-400">Monthly Payment</p><p className="mt-1 text-2xl font-bold text-brand-700 dark:text-brand-400">{fmt(result.monthly)}</p></div>
        <div className="rounded-xl border border-ink-200 p-4 text-center dark:border-ink-700"><p className="text-xs text-ink-400">Total Interest</p><p className="mt-1 text-2xl font-bold text-ink-900 dark:text-ink-100">{fmt(result.interest)}</p></div>
        <div className="rounded-xl border border-ink-200 p-4 text-center dark:border-ink-700"><p className="text-xs text-ink-400">Total Paid</p><p className="mt-1 text-2xl font-bold text-ink-900 dark:text-ink-100">{fmt(result.total)}</p></div>
      </div>
    </div>
  );
}
