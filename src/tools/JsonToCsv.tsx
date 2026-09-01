import { useState, useMemo } from "react";
import { Copy, Check, AlertCircle } from "lucide-react";
import { cn, copyToClipboard } from "@/lib/utils";

function jsonToCsv(json: string): string {
  const data = JSON.parse(json);
  const arr = Array.isArray(data) ? data : [data];
  if (arr.length === 0) return "";
  const headers = [...new Set(arr.flatMap((o: Record<string, unknown>) => Object.keys(o)))];
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers.join(",")];
  for (const row of arr) {
    lines.push(headers.map((h) => escape((row as Record<string, unknown>)[h])).join(","));
  }
  return lines.join("\n");
}

export default function JsonToCsv() {
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const output = useMemo(() => {
    if (!input.trim()) return "";
    try {
      setError("");
      return jsonToCsv(input);
    } catch (e) {
      setError((e as Error).message);
      return "";
    }
  }, [input]);

  const handleCopy = async () => {
    if (!output) return;
    const ok = await copyToClipboard(output);
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  return (
    <div>
      <div className="mb-4">
        <label className="label mb-2 block">JSON Input</label>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} className="input min-h-[150px] resize-y font-mono text-sm" placeholder='[{"name":"John","age":30}]' />
      </div>

      {error && <p className="mb-4 flex items-center gap-1.5 text-sm text-danger"><AlertCircle className="h-4 w-4" />Invalid JSON: {error}</p>}

      {output && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="label mb-0">CSV Output</span>
            <button onClick={handleCopy} className={cn("btn btn-sm", copied ? "btn-primary" : "btn-secondary")}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <textarea readOnly value={output} className="input min-h-[150px] resize-y bg-ink-50/50 font-mono text-sm dark:bg-ink-950/50" />
        </div>
      )}
    </div>
  );
}
