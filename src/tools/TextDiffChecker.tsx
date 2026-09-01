import { useState, useMemo } from "react";
import { Copy, Check, Diff } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TextDiffChecker() {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [copied, setCopied] = useState(false);

  const diff = useMemo(() => {
    if (!left && !right) return [];
    const leftLines = left.split("\n");
    const rightLines = right.split("\n");
    const maxLen = Math.max(leftLines.length, rightLines.length);
    const rows: { type: "same" | "added" | "removed" | "changed"; left: string; right: string; ln: number }[] = [];
    for (let i = 0; i < maxLen; i++) {
      const l = leftLines[i] ?? "";
      const r = rightLines[i] ?? "";
      if (l === r) rows.push({ type: "same", left: l, right: r, ln: i + 1 });
      else if (!l) rows.push({ type: "added", left: "", right: r, ln: i + 1 });
      else if (!r) rows.push({ type: "removed", left: l, right: "", ln: i + 1 });
      else rows.push({ type: "changed", left: l, right: r, ln: i + 1 });
    }
    return rows;
  }, [left, right]);

  const stats = useMemo(() => {
    const added = diff.filter((d) => d.type === "added" || d.type === "changed").length;
    const removed = diff.filter((d) => d.type === "removed" || d.type === "changed").length;
    const same = diff.filter((d) => d.type === "same").length;
    return { added, removed, same };
  }, [diff]);

  const outputText = diff.map((d) => {
    if (d.type === "same") return `  ${d.left}`;
    if (d.type === "added") return `+ ${d.right}`;
    if (d.type === "removed") return `- ${d.left}`;
    return `- ${d.left}\n+ ${d.right}`;
  }).join("\n");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(outputText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* noop */ }
  };

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="label mb-2 block">Original Text</label>
          <textarea
            value={left}
            onChange={(e) => setLeft(e.target.value)}
            className="input min-h-[200px] resize-y font-mono text-sm"
            placeholder="Paste original text here..."
          />
        </div>
        <div>
          <label className="label mb-2 block">Modified Text</label>
          <textarea
            value={right}
            onChange={(e) => setRight(e.target.value)}
            className="input min-h-[200px] resize-y font-mono text-sm"
            placeholder="Paste modified text here..."
          />
        </div>
      </div>

      {diff.length > 0 && (
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Diff className="h-4 w-4 text-ink-400" />
              <span className="text-sm font-semibold text-ink-900 dark:text-ink-100">Differences</span>
              <span className="text-xs text-success-600">{stats.added} added</span>
              <span className="text-xs text-danger">{stats.removed} changed</span>
              <span className="text-xs text-ink-400">{stats.same} unchanged</span>
            </div>
            <button onClick={handleCopy} className={cn("btn btn-sm", copied ? "btn-primary" : "btn-secondary")}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy diff"}
            </button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-ink-200 dark:border-ink-700">
            <table className="w-full text-sm font-mono">
              <tbody>
                {diff.map((row, i) => (
                  <tr key={i} className={cn(
                    "border-b border-ink-100 last:border-0 dark:border-ink-800",
                    row.type === "added" && "bg-success-50 dark:bg-success-700/10",
                    row.type === "removed" && "bg-danger/5 dark:bg-danger/10",
                    row.type === "changed" && "bg-warning-50/50 dark:bg-warning-700/10",
                  )}>
                    <td className="w-10 select-none px-2 py-1 text-right text-xs text-ink-400">{row.ln}</td>
                    <td className="select-none px-1 py-1 text-xs">
                      {row.type === "added" && <span className="text-success-600">+</span>}
                      {row.type === "removed" && <span className="text-danger">-</span>}
                      {row.type === "changed" && <span className="text-warning-600">~</span>}
                      {row.type === "same" && <span className="text-ink-300"> </span>}
                    </td>
                    <td className="px-2 py-1">
                      {row.type === "changed" ? (
                        <div>
                          <div className="text-danger line-through">{row.left}</div>
                          <div className="text-success-700 dark:text-success-600">{row.right}</div>
                        </div>
                      ) : row.type === "removed" ? (
                        <span className="text-danger">{row.left}</span>
                      ) : row.type === "added" ? (
                        <span className="text-success-700 dark:text-success-600">{row.right}</span>
                      ) : (
                        <span className="text-ink-600 dark:text-ink-400">{row.left}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
