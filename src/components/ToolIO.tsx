import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Copy, Check, Trash2, Download, FileInput } from "lucide-react";
import { copyToClipboard, downloadFile, cn } from "@/lib/utils";

interface ToolIOProps {
  inputLabel?: string;
  outputLabel?: string;
  input: string;
  onInputChange: (v: string) => void;
  output: string;
  inputPlaceholder?: string;
  outputPlaceholder?: string;
  inputAriaLabel?: string;
  outputAriaLabel?: string;
  downloadName?: string;
  children?: React.ReactNode;
  inputProps?: React.TextareaHTMLAttributes<HTMLTextAreaElement>;
}

export function ToolIO({
  inputLabel,
  outputLabel,
  input,
  onInputChange,
  output,
  inputPlaceholder,
  outputPlaceholder,
  inputAriaLabel,
  outputAriaLabel,
  downloadName,
  children,
  inputProps,
}: ToolIOProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!output) return;
    const ok = await copyToClipboard(output);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [output]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Input */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="label mb-0">{inputLabel || t("tool.input")}</label>
          <button
            onClick={() => onInputChange("")}
            className="flex items-center gap-1 text-xs text-ink-400 hover:text-danger dark:text-ink-500"
            disabled={!input}
            aria-label={t("tool.clear")}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t("tool.clear")}
          </button>
        </div>
        <textarea
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={inputPlaceholder}
          aria-label={inputAriaLabel || inputLabel || t("tool.input")}
          className={cn("input min-h-[200px] resize-y font-mono text-sm", inputProps?.className)}
          {...inputProps}
        />
        {children}
      </div>

      {/* Output */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="label mb-0">{outputLabel || t("tool.output")}</label>
          <div className="flex items-center gap-2">
            {downloadName && output && (
              <button
                onClick={() => downloadFile(downloadName, output)}
                className="flex items-center gap-1 text-xs text-ink-400 hover:text-brand-600 dark:text-ink-500"
              >
                <Download className="h-3.5 w-3.5" />
                {t("tool.download")}
              </button>
            )}
            <button
              onClick={handleCopy}
              disabled={!output}
              className={cn(
                "flex items-center gap-1 text-xs font-medium transition-colors",
                copied
                  ? "text-success-700 dark:text-success-600"
                  : "text-ink-400 hover:text-brand-600 dark:text-ink-500",
              )}
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? t("tool.copied") : t("tool.copy")}
            </button>
          </div>
        </div>
        <textarea
          value={output}
          readOnly
          placeholder={outputPlaceholder || t("tool.empty.output")}
          aria-label={outputAriaLabel || outputLabel || t("tool.output")}
          className="input min-h-[200px] resize-y bg-ink-50/50 font-mono text-sm dark:bg-ink-950/50"
        />
      </div>
    </div>
  );
}

export function ToolError({ message }: { message?: string }) {
  const { t } = useTranslation();
  return (
    <div className="mt-3 rounded-lg border border-danger/30 bg-danger-50 px-4 py-3 text-sm text-danger dark:bg-danger/10">
      {message || t("tool.error")}
    </div>
  );
}

export { FileInput };
