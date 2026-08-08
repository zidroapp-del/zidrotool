import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Copy, Check, Minimize2, Maximize2, AlertCircle } from "lucide-react";
import { copyToClipboard, cn } from "@/lib/utils";

type Action = "beautify" | "minify" | "validate";

export default function JsonFormatter() {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const [action, setAction] = useState<Action>("beautify");
  const [copied, setCopied] = useState(false);

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: "", error: "" };
    try {
      const parsed = JSON.parse(input);
      if (action === "minify") return { output: JSON.stringify(parsed), error: "" };
      if (action === "validate") return { output: "Valid JSON ✓", error: "" };
      return { output: JSON.stringify(parsed, null, 2), error: "" };
    } catch (e) {
      return { output: "", error: (e as Error).message };
    }
  }, [input, action]);

  const handleCopy = async () => {
    if (await copyToClipboard(output)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {([
          { key: "beautify", label: "Beautify", icon: Maximize2 },
          { key: "minify", label: "Minify", icon: Minimize2 },
          { key: "validate", label: "Validate", icon: AlertCircle },
        ] as { key: Action; label: string; icon: typeof Maximize2 }[]).map((a) => (
          <button
            key={a.key}
            onClick={() => setAction(a.key)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              action === a.key ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300 dark:hover:bg-ink-700",
            )}
          >
            <a.icon className="h-3.5 w-3.5" />
            {a.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="label">{t("tool.input")}</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='{"name":"ZidroTool","tools":19}'
            className="input min-h-[300px] resize-y font-mono text-sm"
            spellCheck={false}
          />
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="label mb-0">{t("tool.output")}</label>
            {output && (
              <button onClick={handleCopy} className="flex items-center gap-1 text-xs font-medium text-ink-400 hover:text-brand-600 dark:text-ink-500">
                {copied ? <Check className="h-3.5 w-3.5 text-success-700" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? t("tool.copied") : t("tool.copy")}
              </button>
            )}
          </div>
          {error ? (
            <div className="min-h-[300px] rounded-lg border border-danger/30 bg-danger-50 p-4 font-mono text-sm text-danger dark:bg-danger/10">
              <p className="font-semibold">JSON Error</p>
              <p className="mt-1">{error}</p>
            </div>
          ) : (
            <textarea
              value={output}
              readOnly
              placeholder={t("tool.empty.output")}
              className="input min-h-[300px] resize-y bg-ink-50/50 font-mono text-sm dark:bg-ink-950/50"
              spellCheck={false}
            />
          )}
        </div>
      </div>
    </div>
  );
}
