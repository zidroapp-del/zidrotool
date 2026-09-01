import { useState, useMemo } from "react";

function checkStrength(pwd: string) {
  let score = 0;
  const checks = [
    { label: "At least 8 characters", pass: pwd.length >= 8 },
    { label: "Contains lowercase", pass: /[a-z]/.test(pwd) },
    { label: "Contains uppercase", pass: /[A-Z]/.test(pwd) },
    { label: "Contains numbers", pass: /[0-9]/.test(pwd) },
    { label: "Contains symbols", pass: /[^a-zA-Z0-9]/.test(pwd) },
    { label: "At least 12 characters", pass: pwd.length >= 12 },
  ];
  score = checks.filter((c) => c.pass).length;
  let entropy = 0;
  if (pwd) { let pool = 0; if (/[a-z]/.test(pwd)) pool += 26; if (/[A-Z]/.test(pwd)) pool += 26; if (/[0-9]/.test(pwd)) pool += 10; if (/[^a-zA-Z0-9]/.test(pwd)) pool += 32; entropy = Math.round(pwd.length * Math.log2(pool || 1)); }
  const level = score <= 2 ? "Very Weak" : score <= 3 ? "Weak" : score <= 4 ? "Fair" : score <= 5 ? "Good" : "Strong";
  const color = score <= 2 ? "text-danger" : score <= 3 ? "text-warning-600" : score <= 4 ? "text-warning-600" : score <= 5 ? "text-brand-600 dark:text-brand-400" : "text-success-700 dark:text-success-600";
  const barColor = score <= 2 ? "bg-danger" : score <= 3 ? "bg-warning-500" : score <= 4 ? "bg-warning-500" : score <= 5 ? "bg-brand-500" : "bg-success-500";
  return { checks, score, level, color, barColor, entropy };
}

export default function PasswordStrength() {
  const [pwd, setPwd] = useState("");
  const [show, setShow] = useState(false);
  const s = useMemo(() => checkStrength(pwd), [pwd]);

  return (
    <div>
      <div className="mb-4">
        <label className="label mb-1.5 block">Password</label>
        <div className="relative">
          <input type={show ? "text" : "password"} value={pwd} onChange={(e) => setPwd(e.target.value)} className="input pr-16" placeholder="Enter a password to check..." />
          <button onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-400 hover:text-ink-600 dark:hover:text-ink-300">{show ? "Hide" : "Show"}</button>
        </div>
      </div>
      {pwd && (
        <div>
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between"><span className="text-sm font-semibold text-ink-900 dark:text-ink-100">Strength: <span className={s.color}>{s.level}</span></span><span className="text-xs text-ink-400">Entropy: {s.entropy} bits</span></div>
            <div className="h-2.5 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800"><div className={`h-full rounded-full transition-all ${s.barColor}`} style={{ width: `${(s.score / 6) * 100}%` }} /></div>
          </div>
          <div className="space-y-1.5">
            {s.checks.map((c, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${c.pass ? "bg-success-100 text-success-700 dark:bg-success-700/20 dark:text-success-600" : "bg-ink-100 text-ink-400 dark:bg-ink-800"}`}>{c.pass ? "✓" : "✗"}</span>
                <span className={c.pass ? "text-ink-700 dark:text-ink-300" : "text-ink-400"}>{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
