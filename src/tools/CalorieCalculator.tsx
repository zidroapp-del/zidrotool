import { useState, useMemo } from "react";

export default function CalorieCalculator() {
  const [gender, setGender] = useState<"male" | "female">("male");
  const [age, setAge] = useState(30);
  const [weight, setWeight] = useState(70);
  const [height, setHeight] = useState(175);
  const [activity, setActivity] = useState("1.55");

  const result = useMemo(() => {
    const bmr = gender === "male"
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161;
    const tdee = bmr * parseFloat(activity);
    return { bmr, tdee, cut: tdee - 500, bulk: tdee + 500 };
  }, [gender, age, weight, height, activity]);

  const fmt = (v: number) => Math.round(v).toLocaleString();

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div><label className="label mb-1.5 block">Gender</label><div className="flex gap-1.5"><button onClick={() => setGender("male")} className={`btn btn-sm flex-1 ${gender === "male" ? "btn-primary" : "btn-secondary"}`}>Male</button><button onClick={() => setGender("female")} className={`btn btn-sm flex-1 ${gender === "female" ? "btn-primary" : "btn-secondary"}`}>Female</button></div></div>
        <div><label className="label mb-1.5 block">Age</label><input type="number" value={age} onChange={(e) => setAge(Math.max(1, parseInt(e.target.value) || 1))} className="input" /></div>
        <div><label className="label mb-1.5 block">Weight (kg)</label><input type="number" value={weight} onChange={(e) => setWeight(Math.max(0, parseFloat(e.target.value) || 0))} className="input" /></div>
        <div><label className="label mb-1.5 block">Height (cm)</label><input type="number" value={height} onChange={(e) => setHeight(Math.max(0, parseFloat(e.target.value) || 0))} className="input" /></div>
      </div>
      <div className="mb-6"><label className="label mb-1.5 block">Activity Level</label><select value={activity} onChange={(e) => setActivity(e.target.value)} className="input"><option value="1.2">Sedentary (little or no exercise)</option><option value="1.375">Lightly active (1-3 days/week)</option><option value="1.55">Moderately active (3-5 days/week)</option><option value="1.725">Very active (6-7 days/week)</option><option value="1.9">Extra active (physical job)</option></select></div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-ink-200 p-4 text-center dark:border-ink-700"><p className="text-xs text-ink-400">BMR</p><p className="mt-1 text-lg font-bold text-ink-900 dark:text-ink-100">{fmt(result.bmr)}</p><p className="text-[10px] text-ink-400">cal/day</p></div>
        <div className="rounded-xl border-2 border-brand-200 bg-brand-50/50 p-4 text-center dark:border-brand-800 dark:bg-brand-900/10"><p className="text-xs text-ink-400">Maintenance</p><p className="mt-1 text-lg font-bold text-brand-700 dark:text-brand-400">{fmt(result.tdee)}</p><p className="text-[10px] text-ink-400">cal/day</p></div>
        <div className="rounded-xl border border-ink-200 p-4 text-center dark:border-ink-700"><p className="text-xs text-ink-400">Weight Loss</p><p className="mt-1 text-lg font-bold text-ink-900 dark:text-ink-100">{fmt(result.cut)}</p><p className="text-[10px] text-ink-400">cal/day</p></div>
        <div className="rounded-xl border border-ink-200 p-4 text-center dark:border-ink-700"><p className="text-xs text-ink-400">Weight Gain</p><p className="mt-1 text-lg font-bold text-ink-900 dark:text-ink-100">{fmt(result.bulk)}</p><p className="text-[10px] text-ink-400">cal/day</p></div>
      </div>
    </div>
  );
}
