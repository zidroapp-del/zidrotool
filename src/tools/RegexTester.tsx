import { useState, useMemo } from "react";
import { Copy, Check, Play, AlertCircle } from "lucide-react";
import { cn, copyToClipboard } from "@/lib/utils";

export default function RegexTester() {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState("g");
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const result = useMemo(() => {
    if (!pattern) return { matches: [], error: "" };
    try {
      setError("");
      const re = new RegExp(pattern, flags);
      const matches: { match: string; index: number; groups: string[] }[] = [];
      if (flags.includes("g")) {
        let m;
        while ((m = re.exec(text)) !== null) {
          matches.push({ match: m[0], index: m.index, groups: m.slice(1) });
          if (m.index === re.lastIndex) re.lastIndex++;
        }
      } else {
        const m = re.exec(text);
        if (m) matches.push({ match: m[0], index: m.index, groups: m.slice(1) });
      }
      return { matches, error: "" };
    } catch (e) {
      return { matches: [], error: (e as Error).message };
    }
  }, [pattern, flags, text]);

  const handleCopy = async () => {
    const text = result.matches.map((m) => m.match).join("\n");
    if (!text) return;
    const ok = await copyToClipboard(text);
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <div className="flex-1">
          <label className="label mb-1.5 block">Pattern</label>
          <div className="flex items-center gap-2">
            <span className="text-ink-400">/</span>
            <input type="text" value={pattern} onChange={(e) => setPattern(e.target.value)} className="input font-mono" placeholder="Enter regex pattern..." />
            <span className="text-ink-400">/</span>
          </div>
        </div>
        <div className="w-24">
          <label className="label mb-1.5 block">Flags</label>
          <input type="text" value={flags} onChange={(e) => setFlags(e.target.value.replace(/[^gimsuy]/g, ""))} className="input font-mono" maxLength={6} />
        </div>
      </div>

      <div className="mb-4">
        <label className="label mb-2 block">Test string</label>
        <textarea value={text} onChange={(e) => setText(e.target.value)} className="input min-h-[120px] resize-y font-mono text-sm" placeholder="Enter text to test against..." />
      </div>

      {result.error && (
        <p className="mb-4 flex items-center gap-1.5 text-sm text-danger"><AlertCircle className="h-4 w-4" />{result.error}</p>
      )}

      {result.matches.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-ink-900 dark:text-ink-100">{result.matches.length} match{result.matches.length !== 1 ? "es" : ""}</span>
            <button onClick={handleCopy} className={cn("btn btn-sm", copied ? "btn-primary" : "btn-secondary")}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} Copy matches
            </button>
          </div>
          <div className="space-y-2">
            {result.matches.map((m, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-ink-200 p-2 dark:border-ink-700">
                <span className="shrink-0 text-xs text-ink-400">#{i + 1} @ {m.index}</span>
                <code className="flex-1 truncate font-mono text-sm text-brand-600 dark:text-brand-400">{m.match}</code>
                {m.groups.length > 0 && <span className="text-xs text-ink-400">groups: {m.groups.join(", ")}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
      {pattern && !result.error && result.matches.length === 0 && (
        <p className="text-sm text-ink-400">No matches found</p>
      )}
    </div>
  );
}
