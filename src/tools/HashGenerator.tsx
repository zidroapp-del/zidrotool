import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Copy, Check } from "lucide-react";
import { copyToClipboard, cn } from "@/lib/utils";

const ALGORITHMS = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"] as const;

export default function HashGenerator() {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const [hashes, setHashes] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function compute() {
      const result: Record<string, string> = {};
      const data = new TextEncoder().encode(input);
      for (const algo of ALGORITHMS) {
        try {
          const buf = await crypto.subtle.digest(algo, data);
          result[algo] = [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
        } catch {
          result[algo] = "";
        }
      }
      if (!cancelled) setHashes(result);
    }
    compute();
    return () => { cancelled = true; };
  }, [input]);

  const copy = async (val: string) => {
    if (await copyToClipboard(val)) {
      setCopied(val);
      setTimeout(() => setCopied(""), 2000);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <label className="label">Input text</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter text to hash…"
          className="input min-h-[120px] font-mono text-sm"
          spellCheck={false}
        />
      </div>

      <div className="space-y-3">
        {ALGORITHMS.map((algo) => (
          <div key={algo} className="rounded-lg border border-ink-200 p-3 dark:border-ink-700">
            <div className="mb-1 flex items-center justify-between">
              <span className="badge-brand">{algo}</span>
              <button
                onClick={() => copy(hashes[algo] || "")}
                disabled={!hashes[algo]}
                className="rounded-md p-1.5 text-ink-400 hover:bg-ink-100 hover:text-brand-600 dark:hover:bg-ink-800"
                aria-label={t("tool.copy")}
              >
                {copied === hashes[algo] ? <Check className="h-4 w-4 text-success-700" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <p className="break-all font-mono text-xs text-ink-700 dark:text-ink-300">
              {hashes[algo] || "—"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
