import { useState, useMemo } from "react";

export default function IdealWeight() {
  const [gender, setGender] = useState<"male" | "female">("male");
  const [height, setHeight] = useState(175);

  const result = useMemo(() => {
    const inchesOver5ft = Math.max(0, height / 2.54 - 60);
    const robinson = gender === "male" ? 52 + 1.9 * inchesOver5ft : 49 + 1.7 * inchesOver5ft;
    const miller = gender === "male" ? 56.2 + 1.41 * inchesOver5ft : 53.1 + 1.36 * inchesOver5ft;
    const devine = gender === "male" ? 50 + 2.3 * inchesOver5ft : 45.5 + 2.3 * inchesOver5ft;
    const hamwi = gender === "male" ? 48 + 2.7 * inchesOver5ft : 45.5 + 2.2 * inchesOver5ft;
    return { robinson, miller, devine, hamwi };
  }, [gender, height]);

  const formulas = [
    { name: "Robinson", value: result.robinson },
    { name: "Miller", value: result.miller },
    { name: "Devine", value: result.devine },
    { name: "Hamwi", value: result.hamwi },
  ];

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div><label className="label mb-1.5 block">Gender</label><div className="flex gap-1.5"><button onClick={() => setGender("male")} className={`btn btn-sm flex-1 ${gender === "male" ? "btn-primary" : "btn-secondary"}`}>Male</button><button onClick={() => setGender("female")} className={`btn btn-sm flex-1 ${gender === "female" ? "btn-primary" : "btn-secondary"}`}>Female</button></div></div>
        <div><label className="label mb-1.5 block">Height (cm)</label><input type="number" value={height} onChange={(e) => setHeight(Math.max(0, parseFloat(e.target.value) || 0))} className="input" /></div>
      </div>
      <h3 className="mb-3 text-sm font-semibold text-ink-900 dark:text-ink-100">Ideal Weight (multiple formulas)</h3>
      <div className="grid grid-cols-2 gap-3">
        {formulas.map((f) => (
          <div key={f.name} className="rounded-xl border border-ink-200 p-4 text-center dark:border-ink-700">
            <p className="text-xs text-ink-400">{f.name} Formula</p>
            <p className="mt-1 text-2xl font-bold text-ink-900 dark:text-ink-100">{f.value.toFixed(1)} kg</p>
            <p className="text-xs text-ink-400">{(f.value * 2.205).toFixed(1)} lb</p>
          </div>
        ))}
      </div>
    </div>
  );
}
