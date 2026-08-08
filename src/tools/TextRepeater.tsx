import { useState, useMemo } from "react";
import { Copy, Check, Repeat2 } from "lucide-react";
import { cn, copyToClipboard } from "@/lib/utils";

export default function TextRepeater() {
  const [text, setText] = useState("");
  const [count, setCount] = useState(3);
  const [separator, setSeparator] = useState<"newline" | "space" | "comma" | "none">("newline");
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => {
    if (!text.trim() || count < 1) return "";
    const sep = separator === "newline" ? "\n" : separator === "space" ? " " : separator === "comma" ? ", " : "";
    return Array(count).fill(text).join(sep);
  }, [text, count, separator]);

  const handleCopy = async () => {
    if (!output) return;
    const ok = await copyToClipboard(output);
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  return (
    <div>
      <div className="mb-4">
        <label className="label mb-2 block">Text to repeat</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="input min-h-[80px] resize-y"
          placeholder="Enter text to repeat..."
        />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label mb-2 block">Repeat count</label>
          <input
            type="number"
            min={1}
            max={10000}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(10000, parseInt(e.target.value) || 1)))}
            className="input"
          />
        </div>
        <div>
          <label className="label mb-2 block">Separator</label>
          <div className="flex gap-1.5">
            {(["newline", "space", "comma", "none"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSeparator(s)}
                className={cn(
                  "rounded-lg px-3 py-2 text-xs font-medium capitalize transition-all",
                  separator === s ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300",
                )}
              >
                {s === "newline" ? "New line" : s === "none" ? "None" : s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {output && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="label mb-0">Result ({count}× repetition)</span>
            <button onClick={handleCopy} className={cn("btn btn-sm", copied ? "btn-primary" : "btn-secondary")}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <textarea readOnly value={output} className="input min-h-[200px] resize-y bg-ink-50/50 font-mono text-sm dark:bg-ink-950/50" />
          <p className="mt-2 text-xs text-ink-400">{output.length} characters</p>
        </div>
      )}
    </div>
  );
}
