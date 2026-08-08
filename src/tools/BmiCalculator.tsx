import { useState, useMemo } from "react";

export default function BmiCalculator() {
  const [unit, setUnit] = useState<"metric" | "imperial">("metric");
  const [weight, setWeight] = useState(70);
  const [height, setHeight] = useState(175);

  const bmi = useMemo(() => {
    if (unit === "metric") return weight / Math.pow(height / 100, 2);
    return (weight / Math.pow(height, 2)) * 703;
  }, [weight, height, unit]);

  const category = bmi < 18.5 ? { label: "Underweight", color: "text-warning-600" } : bmi < 25 ? { label: "Normal weight", color: "text-success-700 dark:text-success-600" } : bmi < 30 ? { label: "Overweight", color: "text-warning-600" } : { label: "Obese", color: "text-danger" };

  return (
    <div>
      <div className="mb-4 flex gap-1.5">
        <button onClick={() => setUnit("metric")} className={`btn btn-sm ${unit === "metric" ? "btn-primary" : "btn-secondary"}`}>Metric (kg/cm)</button>
        <button onClick={() => setUnit("imperial")} className={`btn btn-sm ${unit === "imperial" ? "btn-primary" : "btn-secondary"}`}>Imperial (lb/in)</button>
      </div>
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div><label className="label mb-1.5 block">Weight ({unit === "metric" ? "kg" : "lb"})</label><input type="number" value={weight} onChange={(e) => setWeight(Math.max(0, parseFloat(e.target.value) || 0))} className="input" /></div>
        <div><label className="label mb-1.5 block">Height ({unit === "metric" ? "cm" : "in"})</label><input type="number" value={height} onChange={(e) => setHeight(Math.max(0, parseFloat(e.target.value) || 0))} className="input" /></div>
      </div>
      <div className="rounded-xl border-2 border-brand-200 bg-brand-50/50 p-6 text-center dark:border-brand-800 dark:bg-brand-900/10">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">Your BMI</p>
        <p className="mt-2 text-4xl font-bold text-ink-900 dark:text-ink-100">{bmi.toFixed(1)}</p>
        <p className={`mt-2 text-sm font-semibold ${category.color}`}>{category.label}</p>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
        <div className="rounded-lg border border-ink-200 p-2 dark:border-ink-700"><p className="font-medium text-ink-600 dark:text-ink-400">Underweight</p><p className="text-ink-400">&lt; 18.5</p></div>
        <div className="rounded-lg border border-ink-200 p-2 dark:border-ink-700"><p className="font-medium text-ink-600 dark:text-ink-400">Normal</p><p className="text-ink-400">18.5–24.9</p></div>
        <div className="rounded-lg border border-ink-200 p-2 dark:border-ink-700"><p className="font-medium text-ink-600 dark:text-ink-400">Overweight</p><p className="text-ink-400">25–29.9</p></div>
        <div className="rounded-lg border border-ink-200 p-2 dark:border-ink-700"><p className="font-medium text-ink-600 dark:text-ink-400">Obese</p><p className="text-ink-400">&ge; 30</p></div>
      </div>
    </div>
  );
}
