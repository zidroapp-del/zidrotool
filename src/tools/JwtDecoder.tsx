import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle } from "lucide-react";

function base64UrlDecode(str: string): string {
  let s = str.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return decodeURIComponent(escape(atob(s)));
}

export default function JwtDecoder() {
  const { t } = useTranslation();
  const [token, setInput] = useState("");

  const { header, payload, signature, error } = useMemo(() => {
    const trimmed = token.trim();
    if (!trimmed) return { header: "", payload: "", signature: "", error: "" };
    const parts = trimmed.split(".");
    if (parts.length !== 3) {
      return { header: "", payload: "", signature: "", error: "Invalid JWT: must have 3 parts separated by dots." };
    }
    try {
      const header = JSON.stringify(JSON.parse(base64UrlDecode(parts[0])), null, 2);
      const payload = JSON.stringify(JSON.parse(base64UrlDecode(parts[1])), null, 2);
      return { header, payload, signature: parts[2], error: "" };
    } catch (e) {
      return { header: "", payload: "", signature: "", error: `Failed to decode: ${(e as Error).message}` };
    }
  }, [token]);

  return (
    <div>
      <div className="mb-4">
        <label className="label">JWT Token</label>
        <textarea
          value={token}
          onChange={(e) => setInput(e.target.value)}
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkludGVncmF0ZW9yIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
          className="input min-h-[100px] break-all font-mono text-xs"
          spellCheck={false}
        />
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-danger/30 bg-danger-50 px-4 py-3 text-sm text-danger dark:bg-danger/10">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {!error && (header || payload) && (
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <span className="badge-brand mb-2">Header</span>
            <pre className="overflow-x-auto rounded-lg border border-ink-200 bg-ink-50 p-4 font-mono text-xs text-ink-800 dark:border-ink-700 dark:bg-ink-950/50 dark:text-ink-200">
              {header}
            </pre>
          </div>
          <div>
            <span className="badge-accent mb-2">Payload</span>
            <pre className="overflow-x-auto rounded-lg border border-ink-200 bg-ink-50 p-4 font-mono text-xs text-ink-800 dark:border-ink-700 dark:bg-ink-950/50 dark:text-ink-200">
              {payload}
            </pre>
          </div>
        </div>
      )}

      {!error && signature && (
        <div className="mt-4">
          <span className="badge-neutral mb-2">Signature</span>
          <p className="break-all rounded-lg border border-ink-200 bg-ink-50 p-3 font-mono text-xs text-ink-600 dark:border-ink-700 dark:bg-ink-950/50 dark:text-ink-400">
            {signature}
          </p>
        </div>
      )}
    </div>
  );
}
