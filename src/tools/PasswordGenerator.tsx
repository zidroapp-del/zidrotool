import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Copy, Check, RefreshCw, Shield } from "lucide-react";
import { copyToClipboard, cn } from "@/lib/utils";

export default function PasswordGenerator() {
  const { t } = useTranslation();
  const [length, setLength] = useState(16);
  const [upper, setUpper] = useState(true);
  const [lower, setLower] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = useCallback(() => {
    let chars = "";
    if (upper) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (lower) chars += "abcdefghijklmnopqrstuvwxyz";
    if (numbers) chars += "0123456789";
    if (symbols) chars += "!@#$%^&*()_+-=[]{}|;:,.<>?";
    if (!chars) chars = "abcdefghijklmnopqrstuvwxyz";
    const arr = new Uint32Array(length);
    crypto.getRandomValues(arr);
    let pw = "";
    for (let i = 0; i < length; i++) pw += chars[arr[i] % chars.length];
    setPassword(pw);
  }, [length, upper, lower, numbers, symbols]);

  useEffect(() => { generate(); }, [generate]);

  const handleCopy = async () => {
    if (await copyToClipboard(password)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const strength = useMemo(() => {
    let score = 0;
    if (length >= 12) score++;
    if (length >= 16) score++;
    if (upper && lower) score++;
    if (numbers) score++;
    if (symbols) score++;
    return Math.min(score, 5);
  }, [length, upper, lower, numbers, symbols]);

  const strengthLabels = ["Very Weak", "Weak", "Fair", "Good", "Strong", "Very Strong"];
  const strengthColors = ["bg-danger", "bg-danger", "bg-warning", "bg-warning", "bg-success", "bg-success"];

  return (
    <div>
      <div className="flex items-center gap-2 rounded-xl border border-ink-200 bg-ink-50 p-4 dark:border-ink-700 dark:bg-ink-950/50">
        <code className="flex-1 font-mono text-lg text-ink-900 dark:text-ink-100 break-all">{password}</code>
        <button onClick={generate} className="btn-secondary btn-sm" aria-label="Regenerate">
          <RefreshCw className="h-4 w-4" />
        </button>
        <button onClick={handleCopy} className="btn-primary btn-sm">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? t("tool.copied") : t("tool.copy")}
        </button>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Shield className={cn("h-4 w-4", strengthColors[strength].replace("bg-", "text-"))} />
        <span className="text-sm font-medium text-ink-700 dark:text-ink-300">{strengthLabels[strength]}</span>
        <div className="ml-2 flex gap-1 flex-1">
          {[0,1,2,3,4].map((i) => (
            <div key={i} className={cn("h-1.5 flex-1 rounded-full", i < strength ? strengthColors[strength] : "bg-ink-200 dark:bg-ink-700")} />
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <div className="flex items-center justify-between">
            <label className="label mb-0">Length: {length}</label>
          </div>
          <input
            type="range"
            min={4}
            max={64}
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            className="mt-2 w-full accent-brand-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Uppercase (A-Z)", val: upper, set: setUpper },
            { label: "Lowercase (a-z)", val: lower, set: setLower },
            { label: "Numbers (0-9)", val: numbers, set: setNumbers },
            { label: "Symbols (!@#$)", val: symbols, set: setSymbols },
          ].map((opt) => (
            <label key={opt.label} className="flex items-center gap-2 cursor-pointer rounded-lg border border-ink-200 p-3 dark:border-ink-700">
              <input
                type="checkbox"
                checked={opt.val}
                onChange={(e) => opt.set(e.target.checked)}
                className="h-4 w-4 rounded accent-brand-600"
              />
              <span className="text-sm text-ink-700 dark:text-ink-300">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
