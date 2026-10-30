import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.js?url";
import { PDFDocument } from "pdf-lib";
import {
  AlertCircle, ArrowRight, Check, Download, FileText, Gauge, Loader2, Lock, RefreshCw, Shield, UploadCloud, X, Zap,
} from "lucide-react";
import { useToast } from "@/components/Toast";
import { downloadBytes } from "@/lib/utils";
import { SeoToolShell, seoBtn, seoCard } from "@/components/SeoToolShell";

if (typeof window !== "undefined") pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

/**
 * Compress PDF, all in the browser.
 * Light: re-saves the PDF and keeps text, links and bookmarks (small gains).
 * Recommended / Smallest: draw every page as a picture and rebuild the PDF (big gains on scans and photos, text is no longer selectable).
 */
type Level = "light" | "balanced" | "small";
const LEVELS: { id: Level; title: string; sub: string; tag: string; scale: number; q: number }[] = [
  { id: "light", title: "Light", sub: "Keeps text, links and bookmarks. Best for documents that are mostly text; the saving is usually small.", tag: "Keeps text", scale: 0, q: 0 },
  { id: "balanced", title: "Recommended", sub: "Good quality with a big size reduction. Best for scans, photos and presentations.", tag: "Best balance", scale: 1.5, q: 0.7 },
  { id: "small", title: "Smallest", sub: "Maximum reduction for sharing by email or chat. Pages look a little softer.", tag: "Tiny file", scale: 1.1, q: 0.5 },
];
const fmt = (n: number) => (n < 1024 ? `${n} B` : n < 1024 ** 2 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 ** 2).toFixed(2)} MB`);

const LOGO_CSS = `
@keyframes zpc-squeeze { 0%,100% { transform: scale(1,1); } 45% { transform: scale(.82,1.04); } 70% { transform: scale(1.03,.98); } }
@keyframes zpc-arrow-l { 0%,100% { transform: translateX(0); } 45% { transform: translateX(5px); } }
@keyframes zpc-arrow-r { 0%,100% { transform: translateX(0); } 45% { transform: translateX(-5px); } }
@keyframes zpc-glow { 0%,100% { opacity: .35; transform: scale(.92); } 50% { opacity: .85; transform: scale(1.08); } }
.zpc-sheet { transform-box: fill-box; transform-origin: center; animation: zpc-squeeze 3.4s ease-in-out infinite; }
.zpc-al { animation: zpc-arrow-l 3.4s ease-in-out infinite; } .zpc-ar { animation: zpc-arrow-r 3.4s ease-in-out infinite; }
.zpc-glow { animation: zpc-glow 3.4s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .zpc-sheet,.zpc-al,.zpc-ar,.zpc-glow { animation: none !important; } }
`;
function CompressLogo({ size = 112 }: { size?: number }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} aria-hidden="true">
      <style>{LOGO_CSS}</style>
      <div className="zpc-glow absolute inset-2 rounded-full bg-gradient-to-br from-emerald-300/50 via-sky-300/50 to-indigo-400/50 blur-xl" />
      <svg viewBox="0 0 96 96" className="relative h-full w-full drop-shadow-xl">
        <defs>
          <linearGradient id="pc-sheet" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#e0e7ff" /></linearGradient>
          <linearGradient id="pc-badge" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f43f5e" /><stop offset="1" stopColor="#e11d48" /></linearGradient>
        </defs>
        <g className="zpc-sheet">
          <path d="M26 12h28l16 16v52a6 6 0 0 1-6 6H26a6 6 0 0 1-6-6V18a6 6 0 0 1 6-6z" fill="url(#pc-sheet)" stroke="#a5b4fc" strokeWidth="1.5" />
          <path d="M54 12v12a4 4 0 0 0 4 4h12z" fill="#c7d2fe" />
          <rect x="28" y="38" width="32" height="3" rx="1.5" fill="#c7d2fe" /><rect x="28" y="45" width="24" height="3" rx="1.5" fill="#c7d2fe" />
          <rect x="22" y="60" width="38" height="18" rx="5" fill="url(#pc-badge)" />
          <text x="41" y="73.5" textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff" fontFamily="Arial, Helvetica, sans-serif" letterSpacing="1">PDF</text>
        </g>
        <g className="zpc-al"><path d="M3 46h14m0 0-6-6m6 6-6 6" stroke="#6366f1" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" /></g>
        <g className="zpc-ar"><path d="M93 46H79m0 0 6-6m-6 6 6 6" stroke="#10b981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" /></g>
      </svg>
    </div>
  );
}

const FEATURES: [typeof Shield, string, string][] = [
  [Shield, "Private by design", "Your PDF is compressed in your browser and never uploaded to a server."],
  [Gauge, "Three clear levels", "Keep the text, get the best balance, or make the file as small as possible."],
  [Zap, "Fast and free", "No sign-up, no watermark and no file-size limit set by us."],
];

export default function PdfCompressor() {
  const { error, success } = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [level, setLevel] = useState<Level>("balanced");
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [msg, setMsg] = useState("");
  const [result, setResult] = useState<{ bytes: Uint8Array; size: number } | null>(null);

  useEffect(() => { setResult(null); }, [level]);

  const choose = (f?: File | null) => {
    if (!f) return;
    if (!/pdf$/i.test(f.type) && !/\.pdf$/i.test(f.name)) { setMsg("Please choose a PDF file."); return; }
    setFile(f); setResult(null); setMsg(""); setProgress(0);
  };
  const reset = () => { setFile(null); setResult(null); setMsg(""); setProgress(0); };

  const compress = async () => {
    if (!file) return;
    setBusy(true); setMsg(""); setResult(null); setProgress(0);
    try {
      const original = await file.arrayBuffer();
      const cfg = LEVELS.find((l) => l.id === level)!;
      let bytes: Uint8Array;
      if (level === "light") {
        const doc = await PDFDocument.load(original);
        bytes = await doc.save({ useObjectStreams: true, addDefaultPage: false });
        setProgress(100);
      } else {
        const pdf = await pdfjsLib.getDocument({ data: original.slice(0) }).promise;
        const out = await PDFDocument.create();
        for (let n = 1; n <= pdf.numPages; n++) {
          const page = await pdf.getPage(n);
          const base = page.getViewport({ scale: 1 });
          const vp = page.getViewport({ scale: cfg.scale });
          const canvas = document.createElement("canvas");
          canvas.width = Math.ceil(vp.width); canvas.height = Math.ceil(vp.height);
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Canvas is not available in this browser.");
          ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: ctx, viewport: vp }).promise;
          const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", cfg.q));
          if (!blob) throw new Error("Could not process one of the pages.");
          const jpg = await out.embedJpg(new Uint8Array(await blob.arrayBuffer()));
          // keep the original page size so the document looks the same when printed
          out.addPage([base.width, base.height]).drawImage(jpg, { x: 0, y: 0, width: base.width, height: base.height });
          canvas.width = canvas.height = 0;
          setProgress(Math.round((n / pdf.numPages) * 100));
          await new Promise((r) => setTimeout(r, 0));
        }
        await pdf.destroy();
        bytes = await out.save({ useObjectStreams: true });
      }
      setResult({ bytes, size: bytes.length });
      if (bytes.length < file.size) success("Your PDF is smaller now");
    } catch (e: any) {
      console.error(e);
      setMsg(e?.name === "PasswordException" || /encrypt/i.test(e?.message || "") ? "This PDF is password-protected. Remove the password first, then try again." : "Could not compress this PDF. The file may be damaged or protected.");
      error("Compression failed");
    } finally { setBusy(false); }
  };

  const saved = result && file ? ((file.size - result.size) / file.size) * 100 : 0;
  const smaller = !!result && !!file && result.size < file.size;
  const outName = `${(file?.name || "document").replace(/\.pdf$/i, "")}-compressed.pdf`;

  return (
    <SeoToolShell>
      <input ref={input} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => { choose(e.target.files?.[0]); e.target.value = ""; }} />

      {!file ? (
        <>
          <div className={`${seoCard} zseo-rise flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left`}>
            <CompressLogo size={120} />
            <div className="min-w-0">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Compress PDF online</h2>
              <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">Make a PDF smaller so it is easy to email, upload or share. Pick a level, and see the before and after size at once.</p>
              <p className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                {["Free", "No upload", "3 levels", "No watermark"].map((t) => <span key={t} className="rounded-full border border-indigo-200/80 bg-white/80 px-3 py-1 text-xs font-semibold text-indigo-800 dark:border-white/10 dark:bg-white/5 dark:text-indigo-100">{t}</span>)}
              </p>
            </div>
          </div>
          <button type="button" onClick={() => input.current?.click()}
            onDragEnter={(e) => { if (e.dataTransfer.types.includes("Files")) setDrag(true); }} onDragLeave={() => setDrag(false)}
            onDragOver={(e) => { if (e.dataTransfer.types.includes("Files")) e.preventDefault(); }}
            onDrop={(e) => { e.preventDefault(); setDrag(false); choose(e.dataTransfer.files?.[0]); }}
            className={`${seoCard} zseo-rise group flex w-full flex-col items-center justify-center gap-2 border-2 border-dashed px-5 py-12 text-center transition ${drag ? "scale-[1.01] border-indigo-500 bg-indigo-50/80 dark:bg-indigo-500/10" : "border-indigo-300/80 hover:-translate-y-0.5 hover:border-indigo-500"}`}>
            <span className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30 transition group-hover:scale-110 ${drag ? "zseo-float" : ""}`}><UploadCloud className="h-6 w-6" /></span>
            <span className="text-base font-bold text-slate-900 dark:text-white">Drop your PDF here</span>
            <span className="text-xs text-slate-600 dark:text-slate-300">or click to choose a file</span>
          </button>
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(14rem, 1fr))" }}>
            {FEATURES.map(([Icon, t, d], i) => (
              <div key={t} style={{ ["--i" as any]: i }} className={`${seoCard} zseo-rise p-4 transition hover:-translate-y-1`}>
                <span className="zseo-float grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/30" style={{ ["--i" as any]: i }}><Icon className="h-4 w-4" /></span>
                <p className="mt-3 text-sm font-bold text-slate-900 dark:text-white">{t}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{d}</p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className={`${seoCard} zseo-rise flex flex-wrap items-center gap-3 p-4`}>
            <CompressLogo size={52} />
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-900 dark:text-white" title={file.name}>{file.name}</p><p className="text-xs text-slate-600 dark:text-slate-300">Original size: {fmt(file.size)}</p></div>
            <button type="button" onClick={() => input.current?.click()} className={seoBtn}><RefreshCw className="h-4 w-4" />Change file</button>
            <button type="button" onClick={reset} className={seoBtn} aria-label="Remove file"><X className="h-4 w-4" /></button>
          </div>

          <div className={`${seoCard} zseo-rise p-4 sm:p-5`} style={{ ["--i" as any]: 1 }}>
            <p className="mb-3 text-sm font-bold text-slate-800 dark:text-slate-100">Compression level</p>
            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(13rem, 1fr))" }}>
              {LEVELS.map((l) => (
                <button key={l.id} type="button" onClick={() => setLevel(l.id)} aria-pressed={level === l.id}
                  className={`relative rounded-2xl border-2 p-4 text-left transition hover:-translate-y-0.5 ${level === l.id ? "border-indigo-500 bg-indigo-50/80 shadow-lg shadow-indigo-500/15 dark:bg-indigo-500/10" : "border-indigo-100 bg-white/70 dark:border-white/10 dark:bg-white/5"}`}>
                  <span className="flex items-center justify-between"><span className="text-sm font-extrabold text-slate-900 dark:text-white">{l.title}</span>
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-white/10 dark:text-indigo-200">{l.tag}</span></span>
                  <span className="mt-1.5 block text-xs leading-relaxed text-slate-600 dark:text-slate-300">{l.sub}</span>
                  {level === l.id && <span className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-indigo-600 text-white shadow"><Check className="h-3.5 w-3.5" /></span>}
                </button>
              ))}
            </div>
            {level !== "light" && <p className="mt-3 flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300"><AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />This level turns each page into a picture, so the text can no longer be selected or searched.</p>}
          </div>

          <div className={`${seoCard} zseo-rise p-4 sm:p-5`} style={{ ["--i" as any]: 2 }}>
            {busy && (
              <div className="mb-4">
                <div className="h-2 overflow-hidden rounded-full bg-indigo-100 dark:bg-white/10"><div className="zseo-fill h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${progress}%` }} /></div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Compressing… {progress}%</p>
              </div>
            )}
            {!result ? (
              <button type="button" onClick={compress} disabled={busy} className="zseo-shine flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 disabled:opacity-60">
                {busy ? <><Loader2 className="h-5 w-5 animate-spin" />Compressing…</> : <><Gauge className="h-5 w-5" />Compress PDF</>}
              </button>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-center gap-3 text-center">
                  <div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Before</p><p className="text-xl font-extrabold text-slate-700 dark:text-slate-200">{fmt(file.size)}</p></div>
                  <ArrowRight className="h-5 w-5 text-indigo-500" />
                  <div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">After</p><p className={`text-xl font-extrabold ${smaller ? "text-emerald-600 dark:text-emerald-300" : "text-amber-600"}`}>{fmt(result.size)}</p></div>
                  <span className={`rounded-full px-3 py-1 text-sm font-extrabold ${smaller ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-amber-100 text-amber-700"}`}>{smaller ? `−${saved.toFixed(0)}%` : "No saving"}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10"><div className={`zseo-fill h-full rounded-full ${smaller ? "bg-gradient-to-r from-emerald-400 to-sky-500" : "bg-amber-400"}`} style={{ width: `${Math.min(100, (result.size / file.size) * 100)}%` }} /></div>
                {!smaller && <p className="text-center text-xs text-amber-700 dark:text-amber-300">This level did not make the file smaller. Try “Recommended” or “Smallest”, or keep your original.</p>}
                <div className="flex flex-wrap justify-center gap-2">
                  {smaller && <button type="button" onClick={() => downloadBytes(outName, result.bytes, "application/pdf")} className="zseo-shine inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5"><Download className="h-4 w-4" />Download {fmt(result.size)}</button>}
                  <button type="button" onClick={() => setResult(null)} className={seoBtn}>Try another level</button>
                  <button type="button" onClick={reset} className={seoBtn}><FileText className="h-4 w-4" />New file</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {msg && <div className={`${seoCard} flex items-start gap-3 p-4 text-sm text-amber-800 dark:text-amber-200`} role="alert"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><p>{msg}</p></div>}
      <p className="px-1 text-center text-xs text-slate-500 dark:text-slate-400"><Lock className="mr-1 inline h-3 w-3" />Your file stays on your device.</p>
    </SeoToolShell>
  );
}
