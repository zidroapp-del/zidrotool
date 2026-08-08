import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Coffee } from "lucide-react";

export default function PomodoroTimer() {
  const [workMin, setWorkMin] = useState(25);
  const [breakMin, setBreakMin] = useState(5);
  const [mode, setMode] = useState<"work" | "break">("work");
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [cycles, setCycles] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          if (mode === "work") { setMode("break"); setCycles((c) => c + 1); return breakMin * 60; }
          else { setMode("work"); return workMin * 60; }
        }
        return r - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, mode, workMin, breakMin]);

  const toggle = () => setRunning(!running);
  const reset = () => { setRunning(false); setMode("work"); setRemaining(workMin * 60); };
  const switchMode = (m: "work" | "break") => { setRunning(false); setMode(m); setRemaining(m === "work" ? workMin * 60 : breakMin * 60); };

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const total = mode === "work" ? workMin * 60 : breakMin * 60;
  const pct = total > 0 ? (remaining / total) * 100 : 0;

  return (
    <div>
      <div className="mb-4 flex gap-1.5">
        <button onClick={() => switchMode("work")} className={`btn btn-sm flex-1 ${mode === "work" ? "btn-primary" : "btn-secondary"}`}>Focus</button>
        <button onClick={() => switchMode("break")} className={`btn btn-sm flex-1 ${mode === "break" ? "btn-primary" : "btn-secondary"}`}><Coffee className="h-3.5 w-3.5" />Break</button>
      </div>
      <div className="mb-6 flex flex-col items-center">
        <div className="relative flex h-48 w-48 items-center justify-center">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="4" className="text-ink-100 dark:text-ink-800" /><circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className={mode === "work" ? "text-brand-500" : "text-success-500"} strokeDasharray={`${2 * Math.PI * 45}`} strokeDashoffset={`${2 * Math.PI * 45 * (1 - pct / 100)}`} /></svg>
          <div className="text-center"><p className="text-4xl font-bold tabular-nums text-ink-900 dark:text-ink-100">{String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}</p><p className="text-xs text-ink-400">{mode === "work" ? "Focus time" : "Break time"}</p></div>
        </div>
      </div>
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div><label className="label mb-1.5 block">Focus (min)</label><input type="number" min={1} max={90} value={workMin} onChange={(e) => { setWorkMin(Math.max(1, parseInt(e.target.value) || 25)); if (mode === "work") setRemaining((parseInt(e.target.value) || 25) * 60); }} className="input" disabled={running} /></div>
        <div><label className="label mb-1.5 block">Break (min)</label><input type="number" min={1} max={30} value={breakMin} onChange={(e) => { setBreakMin(Math.max(1, parseInt(e.target.value) || 5)); if (mode === "break") setRemaining((parseInt(e.target.value) || 5) * 60); }} className="input" disabled={running} /></div>
      </div>
      <div className="flex gap-2">
        <button onClick={toggle} className="btn-primary flex-1">{running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}{running ? "Pause" : "Start"}</button>
        <button onClick={reset} className="btn-secondary"><RotateCcw className="h-4 w-4" /></button>
      </div>
      <p className="mt-4 text-center text-xs text-ink-400">Completed cycles: {cycles}</p>
    </div>
  );
}
