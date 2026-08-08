import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

export default function Stopwatch() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const startRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => setElapsed(Date.now() - startRef.current), 10);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const toggle = () => {
    if (running) setRunning(false);
    else { startRef.current = Date.now() - elapsed; setRunning(true); }
  };
  const reset = () => { setRunning(false); setElapsed(0); setLaps([]); };
  const lap = () => setLaps([...laps, elapsed]);

  const fmt = (ms: number) => {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const cs = Math.floor((ms % 1000) / 10);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
  };

  return (
    <div>
      <div className="mb-6 flex flex-col items-center">
        <p className="text-5xl font-bold tabular-nums text-ink-900 dark:text-ink-100">{fmt(elapsed)}</p>
      </div>
      <div className="mb-6 flex gap-2">
        <button onClick={toggle} className="btn-primary flex-1">{running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}{running ? "Pause" : "Start"}</button>
        <button onClick={lap} disabled={!running} className="btn-secondary">Lap</button>
        <button onClick={reset} className="btn-secondary"><RotateCcw className="h-4 w-4" /></button>
      </div>
      {laps.length > 0 && (
        <div><h3 className="mb-2 text-sm font-semibold text-ink-900 dark:text-ink-100">Laps</h3><div className="space-y-1">{laps.map((l, i) => <div key={i} className="flex items-center justify-between rounded-lg border border-ink-200 p-2 dark:border-ink-700"><span className="text-xs text-ink-400">Lap {i + 1}</span><span className="font-mono text-sm font-medium text-ink-900 dark:text-ink-100">{fmt(l)}</span></div>)}</div></div>
      )}
    </div>
  );
}
