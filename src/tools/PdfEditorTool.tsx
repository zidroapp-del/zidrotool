import { useCallback, useEffect, useRef, useState } from "react";
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.js?url";
import {
  AlertCircle, Check, Download, FileText, Loader2, Lock, RefreshCw, RotateCcw, RotateCw, Scissors, Shield, Stamp,
  Trash2, UploadCloud, X, Zap,
} from "lucide-react";
import { useToast } from "@/components/Toast";
import { downloadBytes } from "@/lib/utils";
import { SeoToolShell, seoBtn, seoCard, seoField } from "@/components/SeoToolShell";

if (typeof window !== "undefined") pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

/**
 * Three PDF editors in one file, chosen by slug:
 *  pdf-rotator       rotate all or chosen pages
 *  pdf-page-remover  delete chosen pages
 *  pdf-watermark     stamp text on all or chosen pages
 * Pages are shown as clickable thumbnails. Everything runs in the browser.
 */
type Props = { slug?: string; initial?: unknown };
type Kind = "pdf-rotator" | "pdf-page-remover" | "pdf-watermark";

const META: Record<Kind, { h: string; p: string; chips: string[]; button: string; icon: typeof Stamp; pick: string }> = {
  "pdf-rotator": { h: "Rotate PDF pages", p: "Fix pages that are sideways or upside down. Rotate the whole document or only the pages you choose.", chips: ["Free", "No upload", "90° · 180° · 270°", "Whole file or chosen pages"], button: "Rotate PDF", icon: RotateCw, pick: "Pages to rotate" },
  "pdf-page-remover": { h: "Remove pages from PDF", p: "Delete the pages you do not need and download a clean new PDF. Click the pages to remove.", chips: ["Free", "No upload", "Preview every page", "Instant"], button: "Remove pages", icon: Scissors, pick: "Pages to remove" },
  "pdf-watermark": { h: "Add a watermark to PDF", p: "Stamp your own text, such as DRAFT or your name, across your pages. Choose size, colour, opacity and position.", chips: ["Free", "No upload", "Your own text", "Custom look"], button: "Add watermark", icon: Stamp, pick: "Pages to stamp" },
};

const COLORS: [string, string, [number, number, number]][] = [
  ["Grey", "#64748b", [0.39, 0.45, 0.55]], ["Red", "#e11d48", [0.88, 0.11, 0.28]], ["Blue", "#4f46e5", [0.31, 0.27, 0.9]], ["Black", "#0f172a", [0.06, 0.09, 0.16]],
];
const fmt = (n: number) => (n < 1024 ? `${n} B` : n < 1024 ** 2 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 ** 2).toFixed(2)} MB`);

const LOGO_CSS = `
@keyframes zpe-rot { 0%,15% { transform: rotate(0); } 45%,60% { transform: rotate(90deg); } 90%,100% { transform: rotate(180deg); } }
@keyframes zpe-out { 0%,20% { transform: translate(0,0) rotate(0); opacity: 1; } 55%,100% { transform: translate(34px,-14px) rotate(16deg); opacity: 0; } }
@keyframes zpe-stamp { 0%,30%,100% { transform: translateY(-8px) scale(1.15); opacity: 0; } 45% { transform: translateY(0) scale(1); opacity: .9; } 80% { transform: translateY(0) scale(1); opacity: .9; } }
@keyframes zpe-glow { 0%,100% { opacity: .35; transform: scale(.92); } 50% { opacity: .85; transform: scale(1.08); } }
.zpe-rot { transform-box: fill-box; transform-origin: center; animation: zpe-rot 4s ease-in-out infinite; }
.zpe-out { transform-box: fill-box; transform-origin: center; animation: zpe-out 4s ease-in-out infinite; }
.zpe-stamp { transform-box: fill-box; transform-origin: center; animation: zpe-stamp 4s ease-in-out infinite; }
.zpe-glow { animation: zpe-glow 4s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .zpe-rot,.zpe-out,.zpe-stamp,.zpe-glow { animation: none !important; } .zpe-stamp { opacity: .9; transform: none; } }
`;
function EditLogo({ kind, size = 112 }: { kind: Kind; size?: number }) {
  const sheet = (
    <>
      <path d="M26 14h28l16 16v48a6 6 0 0 1-6 6H26a6 6 0 0 1-6-6V20a6 6 0 0 1 6-6z" fill="url(#pe-sheet)" stroke="#a5b4fc" strokeWidth="1.5" />
      <path d="M54 14v12a4 4 0 0 0 4 4h12z" fill="#c7d2fe" />
      <rect x="28" y="40" width="32" height="3" rx="1.5" fill="#c7d2fe" /><rect x="28" y="47" width="24" height="3" rx="1.5" fill="#c7d2fe" /><rect x="28" y="54" width="28" height="3" rx="1.5" fill="#c7d2fe" />
      <rect x="22" y="64" width="38" height="16" rx="5" fill="url(#pe-badge)" />
      <text x="41" y="75.5" textAnchor="middle" fontSize="10" fontWeight="800" fill="#fff" fontFamily="Arial, Helvetica, sans-serif" letterSpacing="1">PDF</text>
    </>
  );
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} aria-hidden="true">
      <style>{LOGO_CSS}</style>
      <div className="zpe-glow absolute inset-2 rounded-full bg-gradient-to-br from-indigo-400/50 via-violet-400/50 to-sky-300/50 blur-xl" />
      <svg viewBox="0 0 96 96" className="relative h-full w-full drop-shadow-xl">
        <defs>
          <linearGradient id="pe-sheet" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#e0e7ff" /></linearGradient>
          <linearGradient id="pe-badge" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f43f5e" /><stop offset="1" stopColor="#e11d48" /></linearGradient>
        </defs>
        {kind === "pdf-rotator" && <g className="zpe-rot">{sheet}</g>}
        {kind === "pdf-page-remover" && (<><g opacity=".55" transform="translate(6,-4)"><path d="M26 14h28l16 16v48a6 6 0 0 1-6 6H26a6 6 0 0 1-6-6V20a6 6 0 0 1 6-6z" fill="#e0e7ff" /></g><g className="zpe-out">{sheet}</g></>)}
        {kind === "pdf-watermark" && (<>{sheet}<g className="zpe-stamp"><rect x="14" y="30" width="60" height="22" rx="4" fill="none" stroke="#e11d48" strokeWidth="3" transform="rotate(-18 44 41)" /><text x="44" y="46" textAnchor="middle" fontSize="13" fontWeight="900" fill="#e11d48" fontFamily="Arial, Helvetica, sans-serif" transform="rotate(-18 44 41)">DRAFT</text></g></>)}
      </svg>
    </div>
  );
}

function pageList(spec: Set<number>, n: number) { return Array.from({ length: n }, (_, i) => i + 1).filter((p) => spec.has(p)); }

export default function PdfEditorTool({ slug = "pdf-rotator" }: Props) {
  const kind: Kind = slug === "pdf-page-remover" || slug === "pdf-watermark" ? slug : "pdf-rotator";
  const meta = META[kind];
  const { error, success } = useToast();
  const input = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<any>(null);

  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState(0);
  const [thumbs, setThumbs] = useState<Record<number, string>>({});
  const [sel, setSel] = useState<Set<number>>(new Set());
  const [angle, setAngle] = useState<90 | 180 | 270>(90);
  const [wmText, setWmText] = useState("CONFIDENTIAL");
  const [wmSize, setWmSize] = useState(56);
  const [wmOpacity, setWmOpacity] = useState(30);
  const [wmColor, setWmColor] = useState(0);
  const [wmPos, setWmPos] = useState<"diagonal" | "center" | "top" | "bottom">("diagonal");
  const [drag, setDrag] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [result, setResult] = useState<{ bytes: Uint8Array; pages: number } | null>(null);

  useEffect(() => () => { pdfRef.current?.destroy?.(); }, []);
  useEffect(() => { setResult(null); }, [kind, angle, wmText, wmSize, wmOpacity, wmColor, wmPos]);

  const reset = () => { pdfRef.current?.destroy?.(); pdfRef.current = null; setFile(null); setPages(0); setThumbs({}); setSel(new Set()); setResult(null); setMsg(""); };

  const load = useCallback(async (f?: File | null) => {
    if (!f) return;
    if (!/pdf$/i.test(f.type) && !/\.pdf$/i.test(f.name)) { setMsg("Please choose a PDF file."); return; }
    reset(); setFile(f); setLoading(true);
    try {
      const doc = await pdfjsLib.getDocument({ data: await f.arrayBuffer() }).promise;
      pdfRef.current = doc;
      setPages(doc.numPages);
      // rotate and watermark work on every page by default; remove starts with nothing selected
      setSel(kind === "pdf-page-remover" ? new Set() : new Set(Array.from({ length: doc.numPages }, (_, i) => i + 1)));
      setLoading(false);
      for (let n = 1; n <= Math.min(doc.numPages, 120); n++) {
        if (pdfRef.current !== doc) return;
        const page = await doc.getPage(n);
        const vp0 = page.getViewport({ scale: 1 });
        const vp = page.getViewport({ scale: 170 / vp0.width });
        const c = document.createElement("canvas");
        c.width = Math.ceil(vp.width); c.height = Math.ceil(vp.height);
        const ctx = c.getContext("2d");
        if (!ctx) continue;
        ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        const url = c.toDataURL("image/jpeg", 0.7);
        setThumbs((t) => ({ ...t, [n]: url }));
      }
    } catch (e: any) {
      console.error(e);
      setMsg(e?.name === "PasswordException" ? "This PDF is password-protected. Remove the password first, then try again." : "Could not open this PDF. The file may be damaged.");
      setFile(null); setLoading(false);
    }
  }, [kind]);

  const toggle = (n: number) => { setSel((s) => { const c = new Set(s); c.has(n) ? c.delete(n) : c.add(n); return c; }); setResult(null); };
  const setAll = () => { setSel(new Set(Array.from({ length: pages }, (_, i) => i + 1))); setResult(null); };
  const setNone = () => { setSel(new Set()); setResult(null); };
  const setOdd = () => { setSel(new Set(Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n % 2 === 1))); setResult(null); };
  const setEven = () => { setSel(new Set(Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n % 2 === 0))); setResult(null); };

  const run = async () => {
    if (!file) return;
    const chosen = pageList(sel, pages);
    if (!chosen.length) { setMsg(kind === "pdf-page-remover" ? "Click the pages you want to remove." : "Select at least one page."); return; }
    if (kind === "pdf-page-remover" && chosen.length >= pages) { setMsg("You cannot remove every page. Keep at least one."); return; }
    if (kind === "pdf-watermark" && !wmText.trim()) { setMsg("Type the watermark text first."); return; }
    setBusy(true); setMsg(""); setResult(null);
    try {
      const doc = await PDFDocument.load(await file.arrayBuffer());
      if (kind === "pdf-rotator") {
        const all = doc.getPages();
        chosen.forEach((n) => { const p = all[n - 1]; p.setRotation(degrees((((p.getRotation().angle + angle) % 360) + 360) % 360)); });
      } else if (kind === "pdf-page-remover") {
        [...chosen].reverse().forEach((n) => doc.removePage(n - 1));
      } else {
        const font = await doc.embedFont(StandardFonts.HelveticaBold);
        const [, , c] = COLORS[wmColor];
        const text = wmText.trim();
        const all = doc.getPages();
        for (const n of chosen) {
          const p = all[n - 1];
          const { width: W, height: H } = p.getSize();
          let fs = wmSize;
          let w = font.widthOfTextAtSize(text, fs);
          const maxW = (wmPos === "diagonal" ? Math.hypot(W, H) * 0.8 : W * 0.9);
          if (w > maxW) { fs = (fs * maxW) / w; w = maxW; }
          const th = fs * 0.35; // half the visual height of the capital letters
          const rot = wmPos === "diagonal" ? 45 : 0;
          const r = (rot * Math.PI) / 180;
          const cx = W / 2;
          const cy = wmPos === "top" ? H - fs - 30 : wmPos === "bottom" ? fs + 30 : H / 2;
          p.drawText(text, {
            x: cx - (w / 2) * Math.cos(r) + th * Math.sin(r),
            y: cy - (w / 2) * Math.sin(r) - th * Math.cos(r),
            size: fs, font, color: rgb(c[0], c[1], c[2]), opacity: wmOpacity / 100, rotate: degrees(rot),
          });
        }
      }
      const bytes = await doc.save();
      setResult({ bytes, pages: doc.getPageCount() });
      success("Your PDF is ready");
    } catch (e: any) {
      console.error(e);
      const m = String(e?.message || "");
      setMsg(/encrypt/i.test(m) ? "This PDF is protected. Remove the protection first, then try again."
        : /WinAnsi|encode/i.test(m) ? "The watermark uses characters that PDF fonts here cannot draw. Use letters, numbers and common symbols (A–Z, 0–9)."
        : "Could not edit this PDF. The file may be damaged.");
      error("PDF edit failed");
    } finally { setBusy(false); }
  };

  const outName = `${(file?.name || "document").replace(/\.pdf$/i, "")}-${kind === "pdf-rotator" ? "rotated" : kind === "pdf-page-remover" ? "edited" : "watermarked"}.pdf`;
  const Btn = meta.icon;
  const chosenCount = sel.size;

  return (
    <SeoToolShell>
      <input ref={input} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => { load(e.target.files?.[0]); e.target.value = ""; }} />

      {!file ? (
        <>
          <div className={`${seoCard} zseo-rise flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left`}>
            <EditLogo kind={kind} size={120} />
            <div className="min-w-0">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{meta.h}</h2>
              <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">{meta.p}</p>
              <p className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                {meta.chips.map((t) => <span key={t} className="rounded-full border border-indigo-200/80 bg-white/80 px-3 py-1 text-xs font-semibold text-indigo-800 dark:border-white/10 dark:bg-white/5 dark:text-indigo-100">{t}</span>)}
              </p>
            </div>
          </div>
          <button type="button" onClick={() => input.current?.click()}
            onDragEnter={(e) => { if (e.dataTransfer.types.includes("Files")) setDrag(true); }} onDragLeave={() => setDrag(false)}
            onDragOver={(e) => { if (e.dataTransfer.types.includes("Files")) e.preventDefault(); }}
            onDrop={(e) => { e.preventDefault(); setDrag(false); load(e.dataTransfer.files?.[0]); }}
            className={`${seoCard} zseo-rise group flex w-full flex-col items-center justify-center gap-2 border-2 border-dashed px-5 py-12 text-center transition ${drag ? "scale-[1.01] border-indigo-500 bg-indigo-50/80 dark:bg-indigo-500/10" : "border-indigo-300/80 hover:-translate-y-0.5 hover:border-indigo-500"}`}>
            <span className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30 transition group-hover:scale-110 ${drag ? "zseo-float" : ""}`}><UploadCloud className="h-6 w-6" /></span>
            <span className="text-base font-bold text-slate-900 dark:text-white">Drop your PDF here</span>
            <span className="text-xs text-slate-600 dark:text-slate-300">or click to choose a file</span>
          </button>
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(14rem, 1fr))" }}>
            {([[Shield, "Private by design", "Your PDF is edited inside your browser and never uploaded."], [FileText, "See every page", "Clickable previews show exactly which pages you are changing."], [Zap, "Fast and free", "No sign-up, no watermark of ours and no page limit."]] as [typeof Shield, string, string][]).map(([Icon, t, d], i) => (
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
            <EditLogo kind={kind} size={52} />
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-900 dark:text-white" title={file.name}>{file.name}</p><p className="text-xs text-slate-600 dark:text-slate-300">{loading ? "Reading your PDF…" : `${pages} page${pages > 1 ? "s" : ""} · ${fmt(file.size)}`}</p></div>
            <button type="button" onClick={() => input.current?.click()} className={seoBtn}><RefreshCw className="h-4 w-4" />Change file</button>
            <button type="button" onClick={reset} className={seoBtn} aria-label="Remove file"><X className="h-4 w-4" /></button>
          </div>

          {loading && <div className={`${seoCard} flex items-center justify-center gap-3 p-8 text-slate-600 dark:text-slate-300`}><Loader2 className="h-5 w-5 animate-spin" />Opening PDF…</div>}

          {!loading && pages > 0 && (
            <>
              {/* options */}
              {kind !== "pdf-page-remover" && (
                <div className={`${seoCard} zseo-rise p-4 sm:p-5`} style={{ ["--i" as any]: 1 }}>
                  {kind === "pdf-rotator" ? (
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Rotate clockwise by</p>
                      <div className="inline-flex rounded-xl border border-indigo-200/70 bg-white/70 p-0.5 dark:border-white/10 dark:bg-white/5">
                        {([[90, RotateCw, "90°"], [180, RefreshCw, "180°"], [270, RotateCcw, "270° (90° left)"]] as const).map(([v, Icon, l]) => (
                          <button key={v} type="button" aria-pressed={angle === v} onClick={() => setAngle(v as 90 | 180 | 270)}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${angle === v ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow" : "text-slate-600 hover:bg-indigo-50 dark:text-slate-300 dark:hover:bg-white/10"}`}><Icon className="h-3.5 w-3.5" />{l}</button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(14rem, 1fr))" }}>
                      <div>
                        <label htmlFor="wm" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">Watermark text</label>
                        <input id="wm" className={seoField} value={wmText} onChange={(e) => setWmText(e.target.value)} placeholder="CONFIDENTIAL" maxLength={60} />
                      </div>
                      <div>
                        <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">Colour</p>
                        <div className="flex gap-2">{COLORS.map(([n, hex], i) => (
                          <button key={n} type="button" onClick={() => setWmColor(i)} aria-label={n} aria-pressed={wmColor === i} title={n}
                            className={`h-8 w-8 rounded-full border-2 transition hover:scale-110 ${wmColor === i ? "border-indigo-600 ring-2 ring-indigo-400/40" : "border-white"}`} style={{ background: hex }} />
                        ))}</div>
                      </div>
                      <div>
                        <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">Position</p>
                        <div className="inline-flex flex-wrap rounded-xl border border-indigo-200/70 bg-white/70 p-0.5 dark:border-white/10 dark:bg-white/5">
                          {([["diagonal", "Diagonal"], ["center", "Center"], ["top", "Top"], ["bottom", "Bottom"]] as const).map(([v, l]) => (
                            <button key={v} type="button" aria-pressed={wmPos === v} onClick={() => setWmPos(v)}
                              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${wmPos === v ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow" : "text-slate-600 hover:bg-indigo-50 dark:text-slate-300 dark:hover:bg-white/10"}`}>{l}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label htmlFor="wms" className="mb-1.5 flex justify-between text-xs font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-300"><span>Size</span><span>{wmSize}</span></label>
                        <input id="wms" type="range" min={20} max={120} value={wmSize} onChange={(e) => setWmSize(Number(e.target.value))} className="w-full accent-indigo-600" />
                      </div>
                      <div>
                        <label htmlFor="wmo" className="mb-1.5 flex justify-between text-xs font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-300"><span>Opacity</span><span>{wmOpacity}%</span></label>
                        <input id="wmo" type="range" min={10} max={100} value={wmOpacity} onChange={(e) => setWmOpacity(Number(e.target.value))} className="w-full accent-indigo-600" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* pages */}
              <div className={`${seoCard} zseo-rise p-4 sm:p-5`} style={{ ["--i" as any]: 2 }}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{meta.pick}: {chosenCount} of {pages}</p>
                  <div className="flex gap-1 text-xs font-semibold">
                    {[["All", setAll], ["None", setNone], ["Odd", setOdd], ["Even", setEven]].map(([l, fn]: any) => (
                      <button key={l} type="button" onClick={fn} className="rounded-lg px-2.5 py-1 text-indigo-700 transition hover:bg-indigo-100/70 dark:text-indigo-200 dark:hover:bg-white/10">{l}</button>
                    ))}
                  </div>
                </div>
                <ul className="grid max-h-[28rem] gap-3 overflow-y-auto p-1" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(7.5rem, 1fr))" }}>
                  {Array.from({ length: pages }, (_, i) => i + 1).map((n) => {
                    const on = sel.has(n);
                    const remove = kind === "pdf-page-remover";
                    return (
                      <li key={n}>
                        <button type="button" onClick={() => toggle(n)} aria-pressed={on}
                          className={`group relative block w-full overflow-hidden rounded-xl border-2 bg-white text-left transition hover:-translate-y-0.5 ${on ? (remove ? "border-rose-500 shadow-md shadow-rose-500/20" : "border-indigo-500 shadow-md shadow-indigo-500/20") : "border-slate-200 opacity-60 dark:border-white/10"}`}>
                          <div className="relative grid aspect-[3/4] place-items-center overflow-hidden bg-slate-100 dark:bg-slate-900">
                            {thumbs[n]
                              ? <img src={thumbs[n]} alt={`Page ${n}`} className="h-full w-full object-contain transition-transform duration-500" style={{ transform: kind === "pdf-rotator" && on ? `rotate(${angle}deg) scale(${angle === 180 ? 1 : 0.72})` : undefined, filter: remove && on ? "grayscale(1) blur(.5px)" : undefined }} />
                              : <FileText className="h-6 w-6 text-slate-300" />}
                            {kind === "pdf-watermark" && on && (
                              <span className="pointer-events-none absolute inset-0 grid place-items-center overflow-hidden">
                                <span className="whitespace-nowrap font-black" style={{ color: COLORS[wmColor][1], opacity: wmOpacity / 100, fontSize: Math.max(7, wmSize / 6), transform: wmPos === "diagonal" ? "rotate(-45deg)" : undefined, alignSelf: wmPos === "top" ? "start" : wmPos === "bottom" ? "end" : "center", margin: wmPos === "top" || wmPos === "bottom" ? "10%" : 0 }}>{wmText}</span>
                              </span>
                            )}
                            {remove && on && <span className="absolute inset-0 grid place-items-center bg-rose-500/25"><Trash2 className="h-6 w-6 text-rose-600" /></span>}
                          </div>
                          <span className="absolute left-1.5 top-1.5 rounded-full bg-slate-900/70 px-2 py-0.5 text-[11px] font-bold text-white">{n}</span>
                          <span className={`absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full text-white transition ${on ? (remove ? "scale-100 bg-rose-600" : "scale-100 bg-indigo-600") : "scale-0"}`}>{remove ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                {pages > 120 && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Previews are shown for the first 120 pages. All pages are processed.</p>}
              </div>

              {/* action */}
              <div className={`${seoCard} zseo-rise p-4 sm:p-5`} style={{ ["--i" as any]: 3 }}>
                {result ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"><Check className="h-5 w-5" /></span>
                    <div className="min-w-0 flex-1"><p className="truncate font-bold text-slate-900 dark:text-white">{outName}</p><p className="text-xs text-slate-600 dark:text-slate-300">{result.pages} page{result.pages > 1 ? "s" : ""} · {fmt(result.bytes.length)}</p></div>
                    <button type="button" onClick={() => downloadBytes(outName, result.bytes, "application/pdf")} className="zseo-shine inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5"><Download className="h-4 w-4" />Download PDF</button>
                    <button type="button" onClick={reset} className={seoBtn}><FileText className="h-4 w-4" />New file</button>
                  </div>
                ) : (
                  <button type="button" onClick={run} disabled={busy} className="zseo-shine flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 disabled:opacity-60">
                    {busy ? <><Loader2 className="h-5 w-5 animate-spin" />Working…</> : <><Btn className="h-5 w-5" />{meta.button} ({chosenCount} page{chosenCount === 1 ? "" : "s"})</>}
                  </button>
                )}
              </div>
            </>
          )}
        </>
      )}

      {msg && <div className={`${seoCard} flex items-start gap-3 p-4 text-sm text-amber-800 dark:text-amber-200`} role="alert"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><p>{msg}</p></div>}
      <p className="px-1 text-center text-xs text-slate-500 dark:text-slate-400"><Lock className="mr-1 inline h-3 w-3" />Your file stays on your device.</p>
    </SeoToolShell>
  );
}
