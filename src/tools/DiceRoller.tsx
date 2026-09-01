import { useState } from "react";
import { Dices, Copy, Check } from "lucide-react";
import { cn, copyToClipboard } from "@/lib/utils";

const DICE_FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

export default function DiceRoller() {
  const [count, setCount] = useState(2);
  const [sides, setSides] = useState(6);
  const [results, setResults] = useState<number[]>([]);
  const [rolling, setRolling] = useState(false);
  const [copied, setCopied] = useState(false);

  const roll = () => {
    setRolling(true);
    setTimeout(() => {
      setResults(Array.from({ length: count }, () => 1 + Math.floor(Math.random() * sides)));
      setRolling(false);
    }, 300);
  };

  const total = results.reduce((a, b) => a + b, 0);
  const handleCopy = async () => {
    if (!results.length) return;
    const ok = await copyToClipboard(results.join(", "));
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div><label className="label mb-1.5 block">Number of dice</label><input type="number" min={1} max={20} value={count} onChange={(e) => setCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))} className="input" /></div>
        <div><label className="label mb-1.5 block">Sides</label><select value={sides} onChange={(e) => setSides(parseInt(e.target.value))} className="input"><option value={4}>d4</option><option value={6}>d6</option><option value={8}>d8</option><option value={10}>d10</option><option value={12}>d12</option><option value={20}>d20</option><option value={100}>d100</option></select></div>
      </div>
      <button onClick={roll} className="btn-primary w-full" disabled={rolling}><Dices className="h-4 w-4" />{rolling ? "Rolling..." : "Roll Dice"}</button>
      {results.length > 0 && !rolling && (
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between"><span className="text-sm text-ink-400">Total: <span className="font-bold text-ink-900 dark:text-ink-100">{total}</span></span><button onClick={handleCopy} className={cn("btn btn-sm", copied ? "btn-primary" : "btn-secondary")}>{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} Copy</button></div>
          <div className="flex flex-wrap gap-2">
            {results.map((r, i) => <div key={i} className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-brand-200 bg-brand-50/50 text-2xl font-bold text-brand-700 dark:border-brand-800 dark:bg-brand-900/10 dark:text-brand-400">{sides === 6 && r >= 1 && r <= 6 ? DICE_FACES[r - 1] : r}</div>)}
          </div>
        </div>
      )}
    </div>
  );
}
