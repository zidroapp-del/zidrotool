import { useMemo, useState } from "react";

export default function AverageCalculator() {
  const [input, setInput] = useState("10, 20, 30, 40, 50");

  const stats = useMemo(() => {
    const nums = input.split(/[\s,]+/).map(Number).filter((n) => !isNaN(n));
    if (nums.length === 0) return null;
    const sum = nums.reduce((a, b) => a + b, 0);
    const mean = sum / nums.length;
    const sorted = [...nums].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const range = max - min;
    const variance = nums.reduce((acc, n) => acc + (n - mean) ** 2, 0) / nums.length;
    const stdDev = Math.sqrt(variance);
    return { count: nums.length, sum, mean, median, min, max, range, stdDev };
  }, [input]);

  return (
    <div>
      <div className="mb-4">
        <label className="label">Numbers (comma or space separated)</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="10, 20, 30, 40, 50"
          className="input min-h-[80px] font-mono text-sm"
        />
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Count", value: stats.count },
            { label: "Sum", value: stats.sum },
            { label: "Mean (Average)", value: stats.mean.toFixed(2).replace(/\.?0+$/, "") },
            { label: "Median", value: stats.median },
            { label: "Min", value: stats.min },
            { label: "Max", value: stats.max },
            { label: "Range", value: stats.range },
            { label: "Std Deviation", value: stats.stdDev.toFixed(2).replace(/\.?0+$/, "") },
          ].map((s) => (
            <div key={s.label} className="rounded-lg bg-ink-50 p-4 text-center dark:bg-ink-950/50">
              <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">{s.value}</p>
              <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">{s.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
