import { useState, useMemo } from "react";
import { Copy, Check, Eraser } from "lucide-react";
import { cn, copyToClipboard } from "@/lib/utils";

export default function RemoveLineBreaks() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"all" | "extra" | "trim">("all");
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => {
    if (!text) return "";
    if (mode === "all") return text.replace(/\r?\n/g, " ").replace(/ +/g, " ").trim();
    if (mode === "extra") return text.replace(/\n{3,}/g, "\n\n").replace(/[ \t]+$/gm, "").replace(/^[ \t]+/gm, "");
    return text.split("\n").map((l) => l.trim()).join("\n");
  }, [text, mode]);

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
          className="input min-h-[120px] resize-y"
          placeholder="Paste text with line breaks..."
        />
      </div>

      <div className="mb-4">
        <label className="label mb-2 block">Mode</label>
        <div className="flex gap-1.5">
          <button onClick={() => setMode("all")} className={cn("btn btn-sm", mode === "all" ? "btn-primary" : "btn-secondary")}>Remove all line breaks</button>
          <button onClick={() => setMode("extra")} className={cn("btn btn-sm", mode === "extra" ? "btn-primary" : "btn-secondary")}>Remove extra breaks</button>
          <button onClick={() => setMode("trim")} className={cn("btn btn-sm", mode === "trim" ? "btn-primary" : "btn-secondary")}>Trim each line</button>
        </div>
      </div>

      {output && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="label mb-0">Result</span>
            <button onClick={handleCopy} className={cn("btn btn-sm", copied ? "btn-primary" : "btn-secondary")}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <textarea readOnly value={output} className="input min-h-[120px] resize-y bg-ink-50/50 dark:bg-ink-950/50" />
        </div>
      )}
    </div>
  );
}
