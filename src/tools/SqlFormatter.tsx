import { useState, useMemo } from "react";
import { Copy, Check, AlertCircle } from "lucide-react";
import { cn, copyToClipboard } from "@/lib/utils";

const KEYWORDS = new Set(["SELECT","FROM","WHERE","INSERT","INTO","VALUES","UPDATE","SET","DELETE","CREATE","TABLE","ALTER","DROP","INDEX","JOIN","LEFT","RIGHT","INNER","OUTER","FULL","ON","GROUP","BY","ORDER","HAVING","ASC","DESC","LIMIT","OFFSET","UNION","ALL","DISTINCT","AS","AND","OR","NOT","NULL","IS","IN","EXISTS","BETWEEN","LIKE","CASE","WHEN","THEN","ELSE","END","WITH","RECURSIVE","PRIMARY","KEY","FOREIGN","REFERENCES","DEFAULT","CONSTRAINT","UNIQUE","CHECK","CASCADE","BEGIN","COMMIT","ROLLBACK","TRANSACTION"]);

function formatSql(sql: string): string {
  const tokens = sql.replace(/\s+/g, " ").trim().match(/('[^']*'|"[^"]*"|\S+)/g) || [];
  let result = "";
  let indent = 0;
  let afterSelect = false;

  for (let i = 0; i < tokens.length; i++) {
    const upper = tokens[i].toUpperCase();
    const isKeyword = KEYWORDS.has(upper.replace(/\(.*$/, ""));

    if (upper === "SELECT") { result += "SELECT\n    "; afterSelect = true; continue; }
    if (upper === "FROM") { result = result.trimEnd() + "\nFROM"; indent = 0; afterSelect = false; continue; }
    if (upper === "WHERE" || upper === "HAVING") { result += "\n" + upper; continue; }
    if (upper === "GROUP") { result += "\nGROUP BY"; i++; continue; }
    if (upper === "ORDER") { result += "\nORDER BY"; i++; continue; }
    if (upper === "JOIN" || upper === "LEFT" || upper === "RIGHT" || upper === "INNER") {
      if (upper === "LEFT" || upper === "RIGHT" || upper === "INNER") {
        result += "\n" + upper + " JOIN"; i++; continue;
      }
      result += "\nJOIN"; continue;
    }
    if (upper === "ON") { result += " ON"; continue; }
    if (upper === "AND" || upper === "OR") { result += "\n  " + upper; continue; }
    if (upper === "LIMIT" || upper === "OFFSET") { result += "\n" + upper; continue; }
    if (upper === "VALUES") { result += " VALUES\n  "; continue; }
    if (upper === "INSERT") { result += "INSERT INTO"; continue; }
    if (upper === "INTO" && result.endsWith("INSERT ")) { continue; }

    result += (afterSelect && isKeyword ? "" : "") + tokens[i] + " ";
  }
  return result.trim().replace(/, /g, ",\n    ").replace(/\n\s*\n/g, "\n");
}

export default function SqlFormatter() {
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const output = useMemo(() => {
    if (!input.trim()) return "";
    try {
      setError("");
      return formatSql(input);
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
        <label className="label mb-2 block">SQL Input</label>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} className="input min-h-[120px] resize-y font-mono text-sm" placeholder="SELECT * FROM users WHERE age > 18 ORDER BY name" />
      </div>

      {error && <p className="mb-4 flex items-center gap-1.5 text-sm text-danger"><AlertCircle className="h-4 w-4" />{error}</p>}

      {output && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="label mb-0">Formatted SQL</span>
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
