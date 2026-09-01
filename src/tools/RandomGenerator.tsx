import { useState, useMemo } from "react";
import { Copy, Check, Shuffle } from "lucide-react";
import { cn, copyToClipboard } from "@/lib/utils";

export default function RandomGenerator() {
  const [min, setMin] = useState(1);
  const [max, setMax] = useState(100);
  const [count, setCount] = useState(1);
  const [unique, setUnique] = useState(false);
  const [results, setResults] = useState<number[]>([]);
  const [copied, setCopied] = useState(false);

  const generate = () => {
    const lo = Math.min(min, max);
    const hi = Math.max(min, max);
    if (unique) {
      const range = hi - lo + 1;
      const n = Math.min(count, range);
      const pool = Array.from({ length: range }, (_, i) => lo + i);
      for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
      setResults(pool.slice(0, n));
    } else {
      setResults(Array.from({ length: count }, () => lo + Math.floor(Math.random() * (hi - lo + 1))));
    }
  };

  const handleCopy = async () => {
    if (!results.length) return;
    const ok = await copyToClipboard(results.join(", "));
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div><label className="label mb-1.5 block">Minimum</label><input type="number" value={min} onChange={(e) => setMin(parseInt(e.target.value) || 0)} className="input" /></div>
        <div><label className="label mb-1.5 block">Maximum</label><input type="number" value={max} onChange={(e) => setMax(parseInt(e.target.value) || 0)} className="input" /></div>
        <div><label className="label mb-1.5 block">How many</label><input type="number" min={1} max={1000} value={count} onChange={(e) => setCount(Math.max(1, Math.min(1000, parseInt(e.target.value) || 1)))} className="input" /></div>
        <div><label className="label mb-1.5 block">Unique only</label><div className="flex gap-1.5"><button onClick={() => setUnique(false)} className={cn("btn btn-sm flex-1", !unique ? "btn-primary" : "btn-secondary")}>Allow repeats</button><button onClick={() => setUnique(true)} className={cn("btn btn-sm flex-1", unique ? "btn-primary" : "btn-secondary")}>Unique</button></div></div>
      </div>
      <button onClick={generate} className="btn-primary w-full"><Shuffle className="h-4 w-4" /> Generate</button>
      {results.length > 0 && (
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between"><span className="label mb-0">Results</span><button onClick={handleCopy} className={cn("btn btn-sm", copied ? "btn-primary" : "btn-secondary")}>{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} Copy</button></div>
          <div className="flex flex-wrap gap-2">
            {results.map((n, i) => <span key={i} className="rounded-lg bg-brand-50 px-3 py-1.5 text-sm font-bold text-brand-700 dark:bg-brand-900/20 dark:text-brand-400">{n}</span>)}
          </div>
        </div>
      )}
    </div>
  );
}
