import { useState, useMemo } from "react";
import { Copy, Check, Search, Replace } from "lucide-react";
import { cn, copyToClipboard } from "@/lib/utils";

export default function FindAndReplace() {
  const [text, setText] = useState("");
  const [find, setFind] = useState("");
  const [replace, setReplace] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [regex, setRegex] = useState(false);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (!text || !find) return { output: text, count: 0 };
    try {
      let count = 0;
      let output: string;
      if (regex) {
        const flags = caseSensitive ? "g" : "gi";
        const pattern = new RegExp(find, flags);
        output = text.replace(pattern, (match) => { count++; return replace; });
      } else {
        const flags = caseSensitive ? "g" : "gi";
        const escaped = find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const pattern = new RegExp(escaped, flags);
        output = text.replace(pattern, (match) => { count++; return replace; });
      }
      return { output, count };
    } catch {
      return { output: text, count: 0 };
    }
  }, [text, find, replace, caseSensitive, regex]);

  const handleCopy = async () => {
    if (!result.output) return;
    const ok = await copyToClipboard(result.output);
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  return (
    <div>
      <div className="mb-4">
        <label className="label mb-2 block">Text</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="input min-h-[120px] resize-y"
          placeholder="Paste your text here..."
        />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label mb-2 block">
            <Search className="mr-1 inline h-3.5 w-3.5" />
            Find
          </label>
          <input
            type="text"
            value={find}
            onChange={(e) => setFind(e.target.value)}
            className="input"
            placeholder={regex ? "Enter regex pattern..." : "Text to find..."}
          />
        </div>
        <div>
          <label className="label mb-2 block">
            <Replace className="mr-1 inline h-3.5 w-3.5" />
            Replace with
          </label>
          <input
            type="text"
            value={replace}
            onChange={(e) => setReplace(e.target.value)}
            className="input"
            placeholder="Replacement text..."
          />
        </div>
      </div>

      <div className="mb-4 flex gap-4">
        <label className="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-400">
          <input type="checkbox" checked={caseSensitive} onChange={(e) => setCaseSensitive(e.target.checked)} className="rounded" />
          Case sensitive
        </label>
        <label className="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-400">
          <input type="checkbox" checked={regex} onChange={(e) => setRegex(e.target.checked)} className="rounded" />
          Use regex
        </label>
      </div>

      {text && find && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="label mb-0">
              Result — {result.count} replacement{result.count !== 1 ? "s" : ""}
            </span>
            <button onClick={handleCopy} className={cn("btn btn-sm", copied ? "btn-primary" : "btn-secondary")}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <textarea readOnly value={result.output} className="input min-h-[120px] resize-y bg-ink-50/50 dark:bg-ink-950/50" />
        </div>
      )}
    </div>
  );
}
