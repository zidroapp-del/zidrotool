import { useEffect, useRef, useState } from "react";
import Tesseract from "tesseract.js";
import { AlertCircle, Check, ClipboardPaste, Copy, FileUp, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { copyToClipboard } from "@/lib/utils";


type BusyState = "checking" | "ocr" | "file" | null;
type DiffKind = "same" | "removed" | "added";
type DiffPart = { kind: DiffKind; text: string };
type Analysis = { original: string; corrected: string };
type GrammarWorkerResponse =
  | {
      id: number;
      type: "result";
      corrected: string;
      issueCount: number;
    }
  | {
      id: number;
      type: "error";
      message: string;
    };

const MAX_TEXT_LENGTH = 20_000;
const MAX_TEXT_FILE_BYTES = 1 * 1024 * 1024;
const MAX_IMAGE_FILE_BYTES = 15 * 1024 * 1024;
const TEXT_EXTENSIONS = new Set(["txt", "md", "markdown", "csv"]);
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

// Decorative background only (no effect on grammar logic).
const BG_PARTICLES = [
  { left: "8%", size: 6, delay: "0s", duration: "19s" },
  { left: "22%", size: 4, delay: "-6s", duration: "23s" },
  { left: "41%", size: 5, delay: "-12s", duration: "21s" },
  { left: "63%", size: 4, delay: "-3s", duration: "26s" },
  { left: "78%", size: 6, delay: "-9s", duration: "20s" },
  { left: "92%", size: 4, delay: "-15s", duration: "24s" },
] as const;

function tokenize(value: string): string[] {
  return value.match(/\s+|[\p{L}\p{M}\p{N}]+|[^\s\p{L}\p{M}\p{N}]/gu) ?? [];
}

function appendPart(parts: DiffPart[], kind: DiffKind, text: string) {
  if (!text) return;
  const last = parts[parts.length - 1];
  if (last?.kind === kind) last.text += text;
  else parts.push({ kind, text });
}

function makeDiff(original: string, corrected: string): DiffPart[] {
  if (original === corrected) return [{ kind: "same", text: original }];
  const before = tokenize(original);
  const after = tokenize(corrected);
  let prefix = 0;
  while (prefix < before.length && prefix < after.length && before[prefix] === after[prefix]) prefix++;
  let suffix = 0;
  while (suffix < before.length - prefix && suffix < after.length - prefix
    && before[before.length - suffix - 1] === after[after.length - suffix - 1]) suffix++;

  const oldMiddle = before.slice(prefix, before.length - suffix);
  const newMiddle = after.slice(prefix, after.length - suffix);
  const parts: DiffPart[] = [];
  appendPart(parts, "same", before.slice(0, prefix).join(""));

  if (oldMiddle.length * newMiddle.length > 200_000) {
    appendPart(parts, "removed", oldMiddle.join(""));
    appendPart(parts, "added", newMiddle.join(""));
  } else {
    const columns = newMiddle.length + 1;
    const table = new Uint16Array((oldMiddle.length + 1) * columns);
    for (let i = oldMiddle.length - 1; i >= 0; i--) {
      for (let j = newMiddle.length - 1; j >= 0; j--) {
        table[i * columns + j] = oldMiddle[i] === newMiddle[j]
          ? table[(i + 1) * columns + j + 1] + 1
          : Math.max(table[(i + 1) * columns + j], table[i * columns + j + 1]);
      }
    }
    let i = 0;
    let j = 0;
    while (i < oldMiddle.length && j < newMiddle.length) {
      if (oldMiddle[i] === newMiddle[j]) {
        appendPart(parts, "same", oldMiddle[i]);
        i++;
        j++;
      } else if (table[(i + 1) * columns + j] >= table[i * columns + j + 1]) {
        appendPart(parts, "removed", oldMiddle[i++]);
      } else {
        appendPart(parts, "added", newMiddle[j++]);
      }
    }
    while (i < oldMiddle.length) appendPart(parts, "removed", oldMiddle[i++]);
    while (j < newMiddle.length) appendPart(parts, "added", newMiddle[j++]);
  }

  appendPart(parts, "same", suffix ? before.slice(before.length - suffix).join("") : "");
  return parts;
}

export default function AIGrammarChecker() {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [busy, setBusy] = useState<BusyState>(null);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);
  const [applied, setApplied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const busyRef = useRef(false);
  const grammarWorkerRef = useRef<Worker | null>(null);
const requestIdRef = useRef(0);

useEffect(() => {
  return () => {
    grammarWorkerRef.current?.terminate();
    grammarWorkerRef.current = null;
  };
}, []);

  const updateInput = (value: string) => {
    setInput(value);
    setAnalysis(null);
    setApplied(false);
    setError(value.length > MAX_TEXT_LENGTH ? t("grammarChecker.tooLong", { limit: MAX_TEXT_LENGTH }) : "");
    setNotice("");
    setCopied(false);
  };

  const handleCheck = async () => {
  if (busyRef.current) return;

  const original = input;

  if (!original.trim()) {
    setError(t("grammarChecker.emptyInput"));
    setAnalysis(null);
    return;
  }

  if (original.length > MAX_TEXT_LENGTH) {
    setError(t("grammarChecker.tooLong", { limit: MAX_TEXT_LENGTH }));
    return;
  }

  busyRef.current = true;
  setBusy("checking");
  setError("");
  setNotice("");
  setApplied(false);

  await new Promise<void>((resolve) => window.setTimeout(resolve, 0));

  try {
    const worker =
      grammarWorkerRef.current ??
      new Worker(new URL("./LingoTweaker.worker.ts", import.meta.url), {
        type: "module",
      });

    grammarWorkerRef.current = worker;

    const requestId = ++requestIdRef.current;

    const result = await new Promise<{
      corrected: string;
      issueCount: number;
    }>((resolve, reject) => {
      const cleanup = () => {
        worker.removeEventListener("message", onMessage);
        worker.removeEventListener("error", onError);
      };

      const onMessage = (event: MessageEvent<GrammarWorkerResponse>) => {
        if (event.data.id !== requestId) return;

        cleanup();

        if (event.data.type === "error") {
          reject(new Error(event.data.message));
          return;
        }

        resolve({
          corrected: event.data.corrected,
          issueCount: event.data.issueCount,
        });
      };

      const onError = (event: ErrorEvent) => {
        cleanup();
        worker.terminate();

        if (grammarWorkerRef.current === worker) {
          grammarWorkerRef.current = null;
        }

        reject(new Error(event.message || "Grammar worker failed."));
      };

      worker.addEventListener("message", onMessage);
      worker.addEventListener("error", onError);

      worker.postMessage({
        id: requestId,
        text: original,
      });
    });

    setAnalysis({
      original,
      corrected: result.corrected,
    });
  } catch (checkError) {
    console.error("Grammar check failed:", checkError);
    setAnalysis(null);
    setError(t("grammarChecker.checkFailed"));
  } finally {
    busyRef.current = false;
    setBusy(null);
  }
};

  const handlePaste = async () => {
    if (busyRef.current) return;
    try {
      const pasted = await navigator.clipboard.readText();
      if (pasted.length > MAX_TEXT_LENGTH) {
        setError(t("grammarChecker.tooLong", { limit: MAX_TEXT_LENGTH }));
        return;
      }
      updateInput(pasted);
      if (!pasted) setNotice(t("grammarChecker.clipboardEmpty"));
    } catch {
      setError(t("grammarChecker.pasteDenied"));
    }
  };

  const handleFile = async (file?: File) => {
    if (!file || busyRef.current) return;
    setError("");
    setNotice("");
    setAnalysis(null);
    setApplied(false);
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

    if (TEXT_EXTENSIONS.has(extension) || file.type === "text/plain" || file.type === "text/markdown" || file.type === "text/csv") {
      if (file.size > MAX_TEXT_FILE_BYTES) {
        setError(t("grammarChecker.textFileTooLarge"));
        return;
      }
      busyRef.current = true;
      setBusy("file");
      try {
        const text = await file.text();
        if (text.length > MAX_TEXT_LENGTH) {
          setError(t("grammarChecker.tooLong", { limit: MAX_TEXT_LENGTH }));
          return;
        }
        updateInput(text);
      } catch {
        setError(t("grammarChecker.fileReadFailed"));
      } finally {
        busyRef.current = false;
        setBusy(null);
      }
      return;
    }

    if (IMAGE_TYPES.has(file.type)) {
      if (file.size > MAX_IMAGE_FILE_BYTES) {
        setError(t("grammarChecker.imageTooLarge"));
        return;
      }
      busyRef.current = true;
      setBusy("ocr");
      setOcrProgress(0);
      try {
        const result = await Tesseract.recognize(file, "eng", {
          logger: (message) => {
            if (typeof message.progress === "number") setOcrProgress(Math.round(message.progress * 100));
          },
        });
        const text = result.data.text ?? "";
        if (text.length > MAX_TEXT_LENGTH) {
          setError(t("grammarChecker.tooLong", { limit: MAX_TEXT_LENGTH }));
          return;
        }
        updateInput(text);
        if (!text.trim()) setNotice(t("grammarChecker.noOcrText"));
      } catch {
        setError(t("grammarChecker.ocrFailed"));
      } finally {
        busyRef.current = false;
        setBusy(null);
      }
      return;
    }

    setError(t("grammarChecker.unsupportedFile"));
  };

  const handleCopy = async () => {
    if (!analysis || busyRef.current) return;
    const didCopy = await copyToClipboard(analysis.corrected);
    setCopied(didCopy);
    setError(didCopy ? "" : t("grammarChecker.copyFailed"));
    if (didCopy) window.setTimeout(() => setCopied(false), 1800);
  };

  const handleFixAll = () => {
    if (!analysis || analysis.original === analysis.corrected) return;
    setInput(analysis.corrected);
    setApplied(true);
    setError("");
    setNotice(t("grammarChecker.appliedNotice"));
  };

  const differences = analysis ? makeDiff(analysis.original, analysis.corrected) : [];
  const hasChanges = Boolean(analysis && analysis.original !== analysis.corrected);
  const checkDisabled = Boolean(busy || !input.trim() || input.length > MAX_TEXT_LENGTH);

  return (
    <div className="zgc-root relative isolate flex flex-col gap-8 overflow-hidden rounded-[2rem] p-3 sm:p-6">
      <style>{`
        @keyframes zgc-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes zgc-drift-a {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          33% { transform: translate3d(-40px, 30px, 0) scale(1.1); }
          66% { transform: translate3d(20px, 60px, 0) scale(0.96); }
        }
        @keyframes zgc-drift-b {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(60px, -30px, 0) scale(1.14); }
        }
        @keyframes zgc-drift-c {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1.05); }
          50% { transform: translate3d(-50px, -40px, 0) scale(0.92); }
        }
        @keyframes zgc-rise {
          0% { transform: translate3d(0, 0, 0); opacity: 0; }
          12% { opacity: 0.55; }
          88% { opacity: 0.35; }
          100% { transform: translate3d(14px, -110vh, 0); opacity: 0; }
        }
        .zgc-base { background-size: 220% 220%; animation: zgc-shift 30s ease-in-out infinite; }
        .zgc-orb { will-change: transform; }
        .zgc-orb-a { animation: zgc-drift-a 20s ease-in-out infinite; }
        .zgc-orb-b { animation: zgc-drift-b 24s ease-in-out infinite; }
        .zgc-orb-c { animation: zgc-drift-c 28s ease-in-out infinite; }
        .zgc-dots {
          background-image: radial-gradient(currentColor 1px, transparent 1.2px);
          background-size: 24px 24px;
          -webkit-mask-image: radial-gradient(ellipse at center, #000 25%, transparent 75%);
          mask-image: radial-gradient(ellipse at center, #000 25%, transparent 75%);
        }
        .zgc-particle { position: absolute; bottom: -12px; border-radius: 9999px; animation-name: zgc-rise; animation-timing-function: linear; animation-iteration-count: infinite; }
        @media (prefers-reduced-motion: reduce) {
          .zgc-base, .zgc-orb, .zgc-particle { animation: none !important; }
          .zgc-particle { display: none; }
        }
      `}</style>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="zgc-base absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-accent-50 dark:from-ink-950 dark:via-brand-950/40 dark:to-accent-950/30" />
        <div className="zgc-dots absolute inset-0 text-ink-900/10 dark:text-white/10" />
        <div className="zgc-orb zgc-orb-a absolute -right-24 -top-28 h-80 w-80 rounded-full bg-brand-400/30 blur-3xl dark:bg-brand-500/20" />
        <div className="zgc-orb zgc-orb-b absolute -left-28 top-1/3 h-96 w-96 rounded-full bg-accent-400/25 blur-3xl dark:bg-accent-500/15" />
        <div className="zgc-orb zgc-orb-c absolute -bottom-32 right-1/4 h-72 w-72 rounded-full bg-brand-300/25 blur-3xl dark:bg-brand-400/10" />
        {BG_PARTICLES.map((p, index) => (
          <span
            key={index}
            className="zgc-particle bg-brand-400/60 dark:bg-brand-300/40"
            style={{ left: p.left, width: p.size, height: p.size, animationDelay: p.delay, animationDuration: p.duration }}
          />
        ))}
      </div>
      <section className="rounded-3xl border border-white/70 bg-white/80 p-4 shadow-[0_24px_70px_-30px_rgba(37,99,235,0.35)] backdrop-blur-xl dark:border-ink-700/70 dark:bg-ink-950/75 sm:p-8">
        <p className="mx-auto mb-6 max-w-2xl text-center text-sm leading-6 text-ink-600 dark:text-ink-300">{t("grammarChecker.intro")}</p>
        <div className="mb-2 flex items-center justify-between gap-2">
          <label htmlFor="grammar-checker-input" className="label mb-0">{t("grammarChecker.inputLabel")}</label>
          <span className={`text-xs ${input.length > MAX_TEXT_LENGTH ? "text-danger" : "text-ink-400"}`}>
            {t("grammarChecker.characterCount", { count: input.length, limit: MAX_TEXT_LENGTH })}
          </span>
        </div>
        <textarea
          id="grammar-checker-input"
          value={input}
          onChange={(event) => updateInput(event.target.value)}
          placeholder={t("grammarChecker.inputPlaceholder")}
          rows={9}
          maxLength={MAX_TEXT_LENGTH + 1}
          disabled={Boolean(busy)}
          aria-describedby="grammar-checker-guidance"
          className="input min-h-56 w-full resize-y rounded-2xl bg-white/70 p-4 font-sans text-base leading-7 shadow-inner transition focus:ring-2 focus:ring-brand-300/60 disabled:opacity-70 dark:bg-ink-900/60"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={handlePaste} disabled={Boolean(busy)} className="btn btn-secondary rounded-full border-brand-200 text-brand-700 transition hover:-translate-y-0.5 hover:shadow-sm dark:border-brand-800 dark:text-brand-300">
            <ClipboardPaste className="h-4 w-4" aria-hidden="true" />{t("grammarChecker.pasteText")}
          </button>
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={Boolean(busy)} className="btn btn-secondary rounded-full border-brand-200 text-brand-700 transition hover:-translate-y-0.5 hover:shadow-sm dark:border-brand-800 dark:text-brand-300">
            <FileUp className="h-4 w-4" aria-hidden="true" />{t("grammarChecker.uploadFileImage")}
          </button>
          <button type="button" onClick={() => { updateInput(""); setAnalysis(null); setError(""); setNotice(""); }} disabled={Boolean(busy) || !input} className="btn btn-secondary rounded-full border-brand-200 text-brand-700 transition hover:-translate-y-0.5 hover:shadow-sm dark:border-brand-800 dark:text-brand-300">
            <RotateCcw className="h-4 w-4" aria-hidden="true" />{t("grammarChecker.clear")}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.markdown,.csv,text/plain,text/markdown,text/csv,image/jpeg,image/png,image/webp"
            className="sr-only"
            aria-label={t("grammarChecker.uploadFileImage")}
            onChange={(event) => {
              const selected = event.target.files?.[0];
              void handleFile(selected);
              event.target.value = "";
            }}
          />
        </div>
        <p id="grammar-checker-guidance" className="mt-3 text-xs leading-5 text-ink-500 dark:text-ink-400">
          {t("grammarChecker.inputHelp", { limit: MAX_TEXT_LENGTH })}
        </p>
        {error && <p role="alert" className="mt-3 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{error}</p>}
        {notice && <p role="status" className="mt-3 rounded-lg border border-brand-200 bg-brand-50 p-3 text-sm text-brand-800 dark:border-brand-900 dark:bg-brand-950/30 dark:text-brand-200">{notice}</p>}
        {busy === "ocr" && <div className="mt-3" role="status" aria-live="polite"><div className="mb-1 flex justify-between text-xs text-ink-500"><span>{t("grammarChecker.ocrProgress")}</span><span>{ocrProgress}%</span></div><progress value={ocrProgress} max={100} className="h-2 w-full accent-brand-600" aria-label={t("grammarChecker.ocrProgress")} /></div>}
        {busy === "file" && <p className="mt-3 text-sm text-brand-700 dark:text-brand-300" role="status">{t("grammarChecker.readingFile")}</p>}
        <button
          type="button"
          onClick={handleCheck}
          disabled={checkDisabled}
          className="btn btn-primary mt-5 flex w-full justify-center rounded-full bg-gradient-to-r from-brand-600 to-accent-600 py-3 text-base shadow-lg shadow-brand-500/25 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 sm:ml-auto sm:w-auto sm:min-w-56"
        >
          {busy === "checking" ? <><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />{t("grammarChecker.checking")}</> : <><Sparkles className="h-5 w-5" aria-hidden="true" />{t("grammarChecker.checkGrammar")}</>}
        </button>
      </section>

      {analysis && (
        <section aria-labelledby="grammar-corrected-heading" className="rounded-3xl border border-white/70 bg-white/85 p-4 shadow-[0_24px_70px_-30px_rgba(37,99,235,0.30)] backdrop-blur-xl dark:border-ink-700/70 dark:bg-ink-950/80 sm:p-8">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 id="grammar-corrected-heading" className="text-lg font-bold text-ink-900 dark:text-ink-100">{t("grammarChecker.correctedOutput")}</h2>
              <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
                {hasChanges ? t("grammarChecker.changesFound") : t("grammarChecker.noChanges")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {hasChanges && <button type="button" onClick={handleFixAll} disabled={applied} className="btn btn-primary disabled:opacity-60">{applied ? <Check className="h-4 w-4" aria-hidden="true" /> : null}{applied ? t("grammarChecker.applied") : t("grammarChecker.fixAllErrors")}</button>}
              <button type="button" onClick={handleCopy} className="btn btn-secondary"><Copy className="h-4 w-4" aria-hidden="true" />{copied ? t("grammarChecker.copied") : t("grammarChecker.copyCorrected")}</button>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-semibold text-ink-700 dark:text-ink-300">{t("grammarChecker.originalText")}</h3>
              <pre className="min-h-40 whitespace-pre-wrap break-words rounded-2xl border border-ink-200/80 bg-ink-50/80 p-4 font-sans text-sm leading-6 text-ink-700 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300">
                {differences.map((part, index) => <span key={`old-${index}`} className={part.kind === "removed" ? "rounded bg-red-100 text-red-900 line-through dark:bg-red-950/70 dark:text-red-200" : undefined}>{part.kind === "added" ? "" : part.text}</span>)}
              </pre>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold text-ink-700 dark:text-ink-300">{t("grammarChecker.correctedText")}</h3>
              <pre className="min-h-40 whitespace-pre-wrap break-words rounded-2xl border border-emerald-200/70 bg-white/80 p-4 font-sans text-sm leading-6 text-ink-800 dark:border-ink-700 dark:bg-ink-950 dark:text-ink-200">
                {differences.map((part, index) => <span key={`new-${index}`} className={part.kind === "added" ? "rounded bg-emerald-100 font-medium text-emerald-950 dark:bg-emerald-950/70 dark:text-emerald-200" : undefined}>{part.kind === "removed" ? "" : part.text}</span>)}
              </pre>
            </div>
          </div>
          <p className="mt-3 text-xs leading-5 text-ink-500 dark:text-ink-400">{t("grammarChecker.reviewBeforeApplying")}</p>
        </section>
      )}

      <section className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 backdrop-blur dark:border-amber-900/60 dark:bg-amber-950/20" aria-label={t("grammarChecker.limitsHeading")}>
        <h2 className="font-semibold text-amber-950 dark:text-amber-100">{t("grammarChecker.limitsHeading")}</h2>
        <p className="mt-2 text-sm leading-6 text-amber-900 dark:text-amber-200">{t("grammarChecker.limitsText")}</p>
      </section>

      <section aria-labelledby="grammar-common-fixes" className="space-y-3">
        <h2 id="grammar-common-fixes" className="text-xl font-bold text-ink-900 dark:text-ink-100">{t("grammarChecker.commonFixesHeading")}</h2>
        <div className="overflow-x-auto rounded-2xl border border-ink-200/80 bg-white/60 backdrop-blur dark:border-ink-700 dark:bg-ink-950/50">
          <table className="w-full min-w-[560px] border-collapse text-left text-sm">
            <thead className="bg-ink-50 text-ink-700 dark:bg-ink-800 dark:text-ink-200"><tr>
              <th scope="col" className="px-4 py-3 font-semibold">{t("grammarChecker.tableIssue")}</th>
              <th scope="col" className="px-4 py-3 font-semibold">{t("grammarChecker.tableCorrection")}</th>
              <th scope="col" className="px-4 py-3 font-semibold">{t("grammarChecker.tableReason")}</th>
            </tr></thead>
            <tbody className="divide-y divide-ink-200 dark:divide-ink-700">
              {([1, 2, 3, 4, 5] as const).map((number) => (
                <tr key={number} className="bg-white/50 dark:bg-ink-950/40">
                  <td className="px-4 py-3 font-mono text-ink-700 dark:text-ink-300">{t(`grammarChecker.fix${number}Before`)}</td>
                  <td className="px-4 py-3 font-mono text-ink-900 dark:text-ink-100">{t(`grammarChecker.fix${number}After`)}</td>
                  <td className="px-4 py-3 text-ink-600 dark:text-ink-400">{t(`grammarChecker.fix${number}Reason`)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
