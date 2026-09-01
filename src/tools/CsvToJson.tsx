import { useState, useMemo } from "react";
import { Copy, Check, ArrowRight, AlertCircle } from "lucide-react";
import { cn, copyToClipboard } from "@/lib/utils";

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { current.push(field); field = ""; }
      else if (c === "\n") { current.push(field); rows.push(current); current = []; field = ""; }
      else if (c !== "\r") field += c;
    }
  }
  if (field || current.length) { current.push(field); rows.push(current); }
  return rows.filter((r) => r.some((c) => c.trim()));
}

export default function CsvToJson() {
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const output = useMemo(() => {
    if (!input.trim()) return "";
    try {
      setError("");
      const rows = parseCSV(input);
      if (rows.length < 1) return "[]";
      const headers = rows[0];
      const json = rows.slice(1).map((row) => {
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => { obj[h] = row[i] ?? ""; });
        return obj;
      });
      return JSON.stringify(json, null, 2);
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
        <label className="label mb-2 block">CSV Input</label>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} className="input min-h-[150px] resize-y font-mono text-sm" placeholder="name,age,city&#10;John,30,NYC&#10;Jane,25,LA" />
      </div>

      {error && <p className="mb-4 flex items-center gap-1.5 text-sm text-danger"><AlertCircle className="h-4 w-4" />{error}</p>}

      {output && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="label mb-0">JSON Output</span>
            <button onClick={handleCopy} className={cn("btn btn-sm", copied ? "btn-primary" : "btn-secondary")}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <pre className="overflow-x-auto rounded-xl border border-ink-200 bg-ink-50/50 p-4 text-sm dark:border-ink-700 dark:bg-ink-950/50"><code className="font-mono text-ink-800 dark:text-ink-200">{output}</code></pre>
        </div>
      )}
    </div>
  );
}
