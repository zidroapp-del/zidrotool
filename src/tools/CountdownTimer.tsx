import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CountdownTimer() {
  const [minutes, setMinutes] = useState(5);
  const [seconds, setSeconds] = useState(0);
  const [remaining, setRemaining] = useState(300);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) { setRunning(false); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const start = () => { setRemaining(minutes * 60 + seconds); setRunning(true); };
  const toggle = () => { if (remaining === 0) start(); else setRunning(!running); };
  const reset = () => { setRunning(false); setRemaining(minutes * 60 + seconds); };

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const totalSec = minutes * 60 + seconds;
  const pct = totalSec > 0 ? (remaining / totalSec) * 100 : 0;

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div><label className="label mb-1.5 block">Minutes</label><input type="number" min={0} max={999} value={minutes} onChange={(e) => { setMinutes(Math.max(0, parseInt(e.target.value) || 0)); setRunning(false); }} className="input" disabled={running} /></div>
        <div><label className="label mb-1.5 block">Seconds</label><input type="number" min={0} max={59} value={seconds} onChange={(e) => { setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0))); setRunning(false); }} className="input" disabled={running} /></div>
      </div>
      <div className="mb-6 flex flex-col items-center">
        <div className="relative flex h-48 w-48 items-center justify-center">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="4" className="text-ink-100 dark:text-ink-800" /><circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="text-brand-500 transition-all" strokeDasharray={`${2 * Math.PI * 45}`} strokeDashoffset={`${2 * Math.PI * 45 * (1 - pct / 100)}`} /></svg>
          <div className="text-center"><p className="text-4xl font-bold tabular-nums text-ink-900 dark:text-ink-100">{String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}</p></div>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={toggle} className="btn-primary flex-1">{running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}{running ? "Pause" : remaining === 0 ? "Start" : "Resume"}</button>
        <button onClick={reset} className="btn-secondary"><RotateCcw className="h-4 w-4" />Reset</button>
      </div>
    </div>
  );
}
