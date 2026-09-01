import { useState, useMemo } from "react";
import { Copy, Check, Eraser } from "lucide-react";
import { cn, copyToClipboard } from "@/lib/utils";

export default function WhitespaceRemover() {
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => {
    if (!text) return "";
    return text
      .replace(/[\t\f\v]+/g, " ")
      .replace(/ +/g, " ")
      .replace(/^ +| +$/gm, "")
      .replace(/^\s+|\s+$/g, "");
  }, [text]);

  const stats = useMemo(() => {
    const removed = text.length - output.length;
    return { removed, original: text.length, result: output.length };
  }, [text, output]);

  const handleCopy = async () => {
    if (!output) return;
    const ok = await copyToClipboard(output);
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  return (
    <div>
      <div className="mb-4">
        <label className="label mb-2 block">Text</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="input min-h-[120px] resize-y font-mono text-sm"
          placeholder="Paste text with extra whitespace..."
        />
      </div>

      {text && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="label mb-0">Result</span>
              <span className="text-xs text-ink-400">{stats.removed} chars removed</span>
            </div>
            <button onClick={handleCopy} className={cn("btn btn-sm", copied ? "btn-primary" : "btn-secondary")}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <textarea readOnly value={output} className="input min-h-[120px] resize-y bg-ink-50/50 font-mono text-sm dark:bg-ink-950/50" />
        </div>
      )}
    </div>
  );
}
