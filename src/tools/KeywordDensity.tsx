import { useState, useMemo } from "react";

export default function KeywordDensity() {
  const [text, setText] = useState("");

  const stats = useMemo(() => {
    if (!text.trim()) return { total: 0, unique: 0, top: [] as { word: string; count: number; pct: number }[] };
    const words = text.toLowerCase().match(/\b[a-z0-9']+\b/g) || [];
    const total = words.length;
    const freq: Record<string, number> = {};
    for (const w of words) freq[w] = (freq[w] || 0) + 1;
    const top = Object.entries(freq)
      .map(([word, count]) => ({ word, count, pct: (count / total) * 100 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
    return { total, unique: Object.keys(freq).length, top };
  }, [text]);

  return (
    <div>
      <div className="mb-4">
        <label className="label mb-2 block">Content</label>
        <textarea value={text} onChange={(e) => setText(e.target.value)} className="input min-h-[150px] resize-y" placeholder="Paste your content to analyze keyword density..." />
      </div>

      {stats.total > 0 && (
        <div>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-ink-200 p-3 text-center dark:border-ink-700"><p className="text-2xl font-bold text-ink-900 dark:text-ink-100">{stats.total}</p><p className="text-xs text-ink-400">Total Words</p></div>
            <div className="rounded-xl border border-ink-200 p-3 text-center dark:border-ink-700"><p className="text-2xl font-bold text-ink-900 dark:text-ink-100">{stats.unique}</p><p className="text-xs text-ink-400">Unique Words</p></div>
            <div className="rounded-xl border border-ink-200 p-3 text-center dark:border-ink-700"><p className="text-2xl font-bold text-ink-900 dark:text-ink-100">{((stats.unique / stats.total) * 100).toFixed(0)}%</p><p className="text-xs text-ink-400">Variety</p></div>
          </div>
          <h3 className="mb-2 text-sm font-semibold text-ink-900 dark:text-ink-100">Top Keywords</h3>
          <div className="space-y-1.5">
            {stats.top.map((k, i) => (
              <div key={k.word} className="flex items-center gap-3 rounded-lg border border-ink-200 p-2 dark:border-ink-700">
                <span className="w-6 text-xs font-medium text-ink-400">#{i + 1}</span>
                <span className="flex-1 text-sm font-medium text-ink-900 dark:text-ink-100">{k.word}</span>
                <span className="text-xs text-ink-400">{k.count}× ({k.pct.toFixed(1)}%)</span>
                <div className="h-2 w-20 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800"><div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.min(100, k.pct * 3)}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
