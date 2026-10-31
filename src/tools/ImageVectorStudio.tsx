import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle, Check, Copy, Download, FileCode2, ImageIcon, Layers, Loader2, Lock, RefreshCw, Shield, SlidersHorizontal,
  UploadCloud, Wand2, X, Zap,
} from "lucide-react";
import { useToast } from "@/components/Toast";
import { copyToClipboard, downloadFile } from "@/lib/utils";
import { SeoToolShell, seoBtn, seoCard, seoField } from "@/components/SeoToolShell";

/**
 * PNG to SVG (tracing to vector paths) and SVG to PNG, both in the browser. No upload, no extra package.
 *  slug "svg-to-png"  -> rasterize an SVG
 *  anything else      -> trace a PNG / JPG / WebP into an SVG
 */
type Props = { slug?: string; initial?: unknown };

const fmtSize = (n: number) => (n < 1024 ? `${n} B` : n < 1024 ** 2 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 ** 2).toFixed(2)} MB`);
const CHECK = "repeating-conic-gradient(#e2e8f0 0% 25%, #fff 0% 50%) 50% / 16px 16px";

/* ------------------------------------------------------------------ tracing */
type Trace = { svg: string; paths: number; colors: string[]; w: number; h: number };
type Opts = { mode: "color" | "bw"; colors: number; threshold: number; detail: number; speckle: number; smooth: boolean; maxSide: number };

function kmeans(px: Uint8ClampedArray, k: number) {
  const pts: number[][] = [];
  const step = Math.max(1, Math.floor(px.length / 4 / 20000));
  for (let i = 0; i < px.length; i += 4 * step) if (px[i + 3] >= 128) pts.push([px[i], px[i + 1], px[i + 2]]);
  if (!pts.length) return [] as number[][];
  const d2 = (a: number[], b: number[]) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
  const cent: number[][] = [pts[0].slice()];
  while (cent.length < k) {
    let best = -1, bd = -1;
    for (let i = 0; i < pts.length; i += 3) { let m = Infinity; for (const c of cent) m = Math.min(m, d2(pts[i], c)); if (m > bd) { bd = m; best = i; } }
    if (bd <= 8) break;
    cent.push(pts[best].slice());
  }
  for (let it = 0; it < 8; it++) {
    const sum = cent.map(() => [0, 0, 0, 0]);
    for (const p of pts) {
      let bi = 0, bd = Infinity;
      for (let c = 0; c < cent.length; c++) { const d = d2(p, cent[c]); if (d < bd) { bd = d; bi = c; } }
      sum[bi][0] += p[0]; sum[bi][1] += p[1]; sum[bi][2] += p[2]; sum[bi][3]++;
    }
    sum.forEach((s, i) => { if (s[3]) cent[i] = [s[0] / s[3], s[1] / s[3], s[2] / s[3]]; });
  }
  return cent;
}

function simplify(pts: [number, number][], eps: number): [number, number][] {
  if (pts.length < 4 || eps <= 0) return pts;
  const keep = new Uint8Array(pts.length);
  // closed loop: split at the point farthest from the first one
  let far = 0, fd = -1;
  for (let i = 1; i < pts.length; i++) { const d = (pts[i][0] - pts[0][0]) ** 2 + (pts[i][1] - pts[0][1]) ** 2; if (d > fd) { fd = d; far = i; } }
  keep[0] = 1; keep[far] = 1;
  const stack: [number, number][] = [[0, far], [far, pts.length]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    const A = pts[a], B = pts[b % pts.length];
    const dx = B[0] - A[0], dy = B[1] - A[1], len = Math.hypot(dx, dy) || 1;
    let md = -1, mi = -1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + B[0] * A[1] - B[1] * A[0]) / len;
      if (d > md) { md = d; mi = i; }
    }
    if (md > eps && mi > 0) { keep[mi] = 1; stack.push([a, mi], [mi, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}

function maskToPath(mask: Uint8Array, W: number, H: number, o: Opts, scale: number): { d: string; n: number } {
  const V = W + 1;
  const out = new Map<number, number[]>();
  const add = (a: number, b: number) => { const l = out.get(a); if (l) l.push(b); else out.set(a, [b]); };
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!mask[y * W + x]) continue;
      if (y === 0 || !mask[(y - 1) * W + x]) add(y * V + x, y * V + x + 1);
      if (x === W - 1 || !mask[y * W + x + 1]) add(y * V + x + 1, (y + 1) * V + x + 1);
      if (y === H - 1 || !mask[(y + 1) * W + x]) add((y + 1) * V + x + 1, (y + 1) * V + x);
      if (x === 0 || !mask[y * W + x - 1]) add((y + 1) * V + x, y * V + x);
    }
  }
  const f = (v: number) => Math.round(v * scale * 10) / 10;
  let d = "", n = 0;
  for (const [s, arr] of out) {
    while (arr.length) {
      let cur = s;
      const raw: [number, number][] = [];
      let guard = 0;
      do {
        const a = out.get(cur);
        if (!a || !a.length) break;
        raw.push([cur % V, Math.floor(cur / V)]);
        cur = a.pop()!;
      } while (cur !== s && ++guard < 5_000_000);
      if (raw.length < 4) continue;
      let area = 0;
      for (let i = 0; i < raw.length; i++) { const p = raw[i], q = raw[(i + 1) % raw.length]; area += p[0] * q[1] - q[0] * p[1]; }
      if (Math.abs(area) / 2 < o.speckle) continue;
      // drop points on straight runs, then simplify
      const corners = raw.filter((p, i) => {
        const a = raw[(i + raw.length - 1) % raw.length], b = raw[(i + 1) % raw.length];
        return (p[0] - a[0]) * (b[1] - p[1]) !== (p[1] - a[1]) * (b[0] - p[0]);
      });
      const pts = simplify(corners, o.detail);
      if (pts.length < 3) continue;
      n++;
      if (o.smooth && pts.length > 3) {
        const m = (a: [number, number], b: [number, number]) => `${f((a[0] + b[0]) / 2)} ${f((a[1] + b[1]) / 2)}`;
        const L = pts.length;
        d += `M${m(pts[L - 1], pts[0])}`;
        for (let i = 0; i < L; i++) d += `Q${f(pts[i][0])} ${f(pts[i][1])} ${m(pts[i], pts[(i + 1) % L])}`;
        d += "Z";
      } else {
        d += `M${f(pts[0][0])} ${f(pts[0][1])}`;
        for (let i = 1; i < pts.length; i++) d += `L${f(pts[i][0])} ${f(pts[i][1])}`;
        d += "Z";
      }
    }
  }
  return { d, n };
}

async function traceImage(file: File, o: Opts): Promise<Trace> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, o.maxSide / Math.max(bmp.width, bmp.height));
  const W = Math.max(1, Math.round(bmp.width * k)), H = Math.max(1, Math.round(bmp.height * k));
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas is not available in this browser.");
  ctx.drawImage(bmp, 0, 0, W, H);
  bmp.close?.();
  const px = ctx.getImageData(0, 0, W, H).data;
  const hex = (r: number[]) => "#" + r.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
  let body = "", total = 0;
  const used: string[] = [];

  if (o.mode === "bw") {
    const mask = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) { const j = i * 4; mask[i] = px[j + 3] >= 128 && 0.299 * px[j] + 0.587 * px[j + 1] + 0.114 * px[j + 2] < o.threshold ? 1 : 0; }
    const { d, n } = maskToPath(mask, W, H, o, 1);
    if (n) { body = `<path d="${d}" fill="#000" fill-rule="evenodd"/>`; total = n; used.push("#000000"); }
  } else {
    const pal = kmeans(px, o.colors);
    if (!pal.length) throw new Error("This image is fully transparent.");
    const idx = new Int16Array(W * H).fill(-1);
    const count = new Array(pal.length).fill(0);
    for (let i = 0; i < W * H; i++) {
      const j = i * 4;
      if (px[j + 3] < 128) continue;
      let bi = 0, bd = Infinity;
      for (let q = 0; q < pal.length; q++) { const d = (px[j] - pal[q][0]) ** 2 + (px[j + 1] - pal[q][1]) ** 2 + (px[j + 2] - pal[q][2]) ** 2; if (d < bd) { bd = d; bi = q; } }
      idx[i] = bi; count[bi]++;
    }
    const order = pal.map((_, i) => i).sort((a, b) => count[b] - count[a]); // biggest areas first, details on top
    for (const q of order) {
      if (!count[q]) continue;
      const mask = new Uint8Array(W * H);
      for (let i = 0; i < W * H; i++) if (idx[i] === q) mask[i] = 1;
      const { d, n } = maskToPath(mask, W, H, o, 1);
      if (!n) continue;
      const col = hex(pal[q]);
      body += `<path d="${d}" fill="${col}" stroke="${col}" stroke-width=".6" stroke-linejoin="round" fill-rule="evenodd"/>`;
      total += n; used.push(col);
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${body}</svg>`;
  return { svg, paths: total, colors: used, w: W, h: H };
}

/* ---------------------------------------------------------------- svg -> png */
function prepareSvg(text: string): { svg: string; w: number; h: number } {
  const doc = new DOMParser().parseFromString(text, "image/svg+xml");
  const root = doc.documentElement;
  if (!root || root.nodeName.toLowerCase() !== "svg" || doc.querySelector("parsererror")) throw new Error("This file is not a valid SVG.");
  const num = (v: string | null) => { const m = (v || "").match(/^\s*([\d.]+)\s*(px)?\s*$/); return m ? parseFloat(m[1]) : 0; };
  let w = num(root.getAttribute("width")), h = num(root.getAttribute("height"));
  const vb = (root.getAttribute("viewBox") || "").split(/[\s,]+/).map(Number);
  if ((!w || !h) && vb.length === 4 && vb[2] > 0 && vb[3] > 0) {
    if (!w && !h) { w = vb[2]; h = vb[3]; } else if (!w) w = (h * vb[2]) / vb[3]; else h = (w * vb[3]) / vb[2];
  }
  if (!w || !h) { w = 512; h = 512; }
  root.setAttribute("width", String(w)); root.setAttribute("height", String(h));
  if (!root.getAttribute("xmlns")) root.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  root.querySelectorAll("script").forEach((s) => s.remove()); // never run scripts from an uploaded file
  return { svg: new XMLSerializer().serializeToString(root), w, h };
}

/* ------------------------------------------------------------------- visuals */
const LOGO_CSS = `
@keyframes zvec-px { 0%,100% { opacity: 1; } 45%,70% { opacity: 0; } }
@keyframes zvec-pt { 0%,20% { opacity: 0; transform: scale(.3); } 55%,85% { opacity: 1; transform: scale(1); } 100% { opacity: 0; } }
@keyframes zvec-draw { 0%,15% { stroke-dashoffset: 190; } 60%,90% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: 0; opacity: 0; } }
@keyframes zvec-glow { 0%,100% { opacity: .35; transform: scale(.92); } 50% { opacity: .85; transform: scale(1.08); } }
.zvec-px { animation: zvec-px 4.4s ease-in-out infinite; }
.zvec-pt { transform-box: fill-box; transform-origin: center; animation: zvec-pt 4.4s ease-in-out infinite; }
.zvec-draw { stroke-dasharray: 190; animation: zvec-draw 4.4s ease-in-out infinite; }
.zvec-glow { animation: zvec-glow 4.4s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .zvec-px,.zvec-pt,.zvec-draw,.zvec-glow { animation: none !important; } .zvec-draw { stroke-dashoffset: 0; } .zvec-pt { opacity: 1; } }
`;
function VecLogo({ size = 112, flip = false }: { size?: number; flip?: boolean }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} aria-hidden="true">
      <style>{LOGO_CSS}</style>
      <div className="zvec-glow absolute inset-2 rounded-full bg-gradient-to-br from-sky-400/50 via-indigo-400/50 to-violet-400/50 blur-xl" />
      <svg viewBox="0 0 96 96" className="relative h-full w-full drop-shadow-xl">
        <defs>
          <linearGradient id="vec-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#e0e7ff" /></linearGradient>
          <linearGradient id="vec-fill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#38bdf8" /><stop offset=".55" stopColor="#6366f1" /><stop offset="1" stopColor="#a855f7" /></linearGradient>
        </defs>
        <rect x="8" y="8" width="80" height="80" rx="14" fill="url(#vec-bg)" stroke="#a5b4fc" strokeWidth="1.5" />
        {/* pixel version fades out, vector version draws itself */}
        <g className="zvec-px" style={flip ? { animationDirection: "reverse" } : undefined}>
          {Array.from({ length: 5 }).flatMap((_, r) => Array.from({ length: 5 }).map((__, c) => {
            const on = [[1, 2], [1, 3], [2, 1], [2, 2], [2, 3], [2, 4], [3, 1], [3, 2], [3, 3], [3, 4], [4, 2], [4, 3]].some(([a, b]) => a === r && b === c);
            return on ? <rect key={`${r}${c}`} x={22 + c * 11} y={18 + r * 11} width="10" height="10" fill="#6366f1" opacity=".85" /> : null;
          }))}
        </g>
        <path className="zvec-draw" d="M48 22c14 0 26 10 26 24 0 16-14 28-26 28-14 0-24-10-24-26 0-14 10-26 24-26z" fill="none" stroke="url(#vec-fill)" strokeWidth="4" strokeLinecap="round" />
        {[[48, 22], [74, 46], [48, 74], [24, 48]].map(([x, y], i) => (
          <g key={i} className="zvec-pt" style={{ animationDelay: `${i * 0.12}s` }}><rect x={x - 3.5} y={y - 3.5} width="7" height="7" rx="1.5" fill="#fff" stroke="#6366f1" strokeWidth="2" /></g>
        ))}
      </svg>
    </div>
  );
}

const FEATURES: [typeof Shield, string, string][] = [
  [Shield, "Private by design", "Your picture is processed inside your browser and never uploaded to a server."],
  [SlidersHorizontal, "Control the result", "Choose colour or black and white, the number of colours, the detail level and smooth curves."],
  [Zap, "Fast and free", "No sign-up, no watermark and no limit on how many images you convert."],
];

/* ----------------------------------------------------------------------- main */
export default function ImageVectorStudio({ slug = "png-to-svg" }: Props) {
  const reverse = slug === "svg-to-png";
  const { error, success } = useToast();
  const input = useRef<HTMLInputElement>(null);
  const blobUrl = useRef<string>("");

  const [file, setFile] = useState<File | null>(null);
  const [srcUrl, setSrcUrl] = useState("");
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [copied, setCopied] = useState(false);

  // png -> svg
  const [o, setO] = useState<Opts>({ mode: "color", colors: 32, threshold: 140, detail: 0.8, speckle: 3, smooth: true, maxSide: 900 });
  const [trace, setTrace] = useState<Trace | null>(null);
  const timer = useRef<number | null>(null);
  const runId = useRef(0);

  // svg -> png
  const [svgText, setSvgText] = useState("");
  const [svgDims, setSvgDims] = useState<{ w: number; h: number } | null>(null);
  const [outW, setOutW] = useState(1024);
  const [bg, setBg] = useState<"transparent" | "white" | "black">("transparent");
  const [png, setPng] = useState<{ url: string; blob: Blob; w: number; h: number } | null>(null);

  useEffect(() => () => { if (blobUrl.current) URL.revokeObjectURL(blobUrl.current); if (png?.url) URL.revokeObjectURL(png.url); }, []); // eslint-disable-line

  const reset = () => {
    if (blobUrl.current) URL.revokeObjectURL(blobUrl.current);
    blobUrl.current = ""; setFile(null); setSrcUrl(""); setTrace(null); setMsg(""); setSvgText(""); setSvgDims(null);
    setPng((p) => { if (p) URL.revokeObjectURL(p.url); return null; });
  };

  const load = useCallback(async (f?: File | null) => {
    if (!f) return;
    setMsg("");
    if (reverse) {
      if (!/svg/i.test(f.type) && !/\.svg$/i.test(f.name)) { setMsg("Please choose an SVG file."); return; }
      try {
        const t = await f.text();
        const p = prepareSvg(t);
        reset();
        setFile(f); setSvgText(p.svg); setSvgDims({ w: p.w, h: p.h });
        setSrcUrl(URL.createObjectURL(new Blob([p.svg], { type: "image/svg+xml" })));
        blobUrl.current = "";
        setOutW(Math.min(4096, Math.max(256, Math.round(p.w))));
      } catch (e: any) { setMsg(e?.message || "Could not read this SVG."); }
    } else {
      if (!/^image\//i.test(f.type) || /svg/i.test(f.type)) { setMsg("Please choose a PNG, JPG or WebP image."); return; }
      reset();
      const u = URL.createObjectURL(f);
      blobUrl.current = u;
      setFile(f); setSrcUrl(u);
    }
  }, [reverse]); // eslint-disable-line

  // live re-trace when the options change (debounced)
  useEffect(() => {
    if (reverse || !file) return;
    if (timer.current) window.clearTimeout(timer.current);
    const id = ++runId.current;
    setBusy(true);
    timer.current = window.setTimeout(async () => {
      try {
        await new Promise((r) => setTimeout(r, 20));
        const t = await traceImage(file, o);
        if (id === runId.current) { setTrace(t); setMsg(t.paths ? "" : "Nothing was traced. Try a higher threshold or more colours."); }
      } catch (e: any) { if (id === runId.current) { setMsg(e?.message || "Could not trace this image."); setTrace(null); } }
      finally { if (id === runId.current) setBusy(false); }
    }, 250);
    return () => { if (timer.current) window.clearTimeout(timer.current); };
  }, [file, o, reverse]);

  const svgUrl = useMemo(() => (trace ? "data:image/svg+xml;charset=utf-8," + encodeURIComponent(trace.svg) : ""), [trace]);
  const base = (file?.name || "image").replace(/\.[^.]+$/, "").replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-") || "image";

  const makePng = async () => {
    if (!svgText || !svgDims) return;
    setBusy(true); setMsg("");
    try {
      const w = Math.max(16, Math.min(8192, outW));
      const h = Math.max(1, Math.round((w * svgDims.h) / svgDims.w));
      const img = new Image();
      const u = URL.createObjectURL(new Blob([svgText], { type: "image/svg+xml;charset=utf-8" }));
      await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error("The browser could not draw this SVG.")); img.src = u; });
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      const ctx = c.getContext("2d");
      if (!ctx) throw new Error("Canvas is not available in this browser.");
      if (bg !== "transparent") { ctx.fillStyle = bg === "white" ? "#fff" : "#000"; ctx.fillRect(0, 0, w, h); }
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(u);
      const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/png"));
      if (!blob) throw new Error("Could not create the PNG.");
      setPng((p) => { if (p) URL.revokeObjectURL(p.url); return { url: URL.createObjectURL(blob), blob, w, h }; });
      success("Your PNG is ready");
    } catch (e: any) { setMsg(e?.message || "Conversion failed."); error("Conversion failed"); }
    finally { setBusy(false); }
  };

  const saveUrl = (url: string, name: string) => { const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); };
  const copy = async () => { if (trace && (await copyToClipboard(trace.svg))) { setCopied(true); success("SVG code copied"); setTimeout(() => setCopied(false), 1600); } };

  const Seg = <T extends string | number>({ value, set, opts }: { value: T; set: (v: T) => void; opts: [T, string][] }) => (
    <div className="inline-flex flex-wrap rounded-xl border border-indigo-200/70 bg-white/70 p-0.5 dark:border-white/10 dark:bg-white/5" role="group">
      {opts.map(([v, l]) => (
        <button key={String(v)} type="button" aria-pressed={value === v} onClick={() => set(v)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${value === v ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow" : "text-slate-600 hover:bg-indigo-50 dark:text-slate-300 dark:hover:bg-white/10"}`}>{l}</button>
      ))}
    </div>
  );
  const Lbl = ({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) => (
    <p className="mb-1.5 flex justify-between text-xs font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-300"><span>{children}</span>{right && <span>{right}</span>}</p>
  );

  const title = reverse ? "SVG to PNG converter" : "PNG to SVG converter";
  const blurb = reverse
    ? "Turn any SVG into a sharp PNG at the size you choose, with a transparent or coloured background. Ready for social media, documents and apps."
    : "Turn a PNG, JPG or WebP picture into a scalable SVG vector. Choose colour or black and white, tune the detail, and download the result.";
  const chips = reverse ? ["Free", "No upload", "Any size up to 8192 px", "Transparent background"] : ["Free", "No upload", "Colour or black & white", "Live preview"];

  return (
    <SeoToolShell>
      <input ref={input} type="file" accept={reverse ? ".svg,image/svg+xml" : "image/png,image/jpeg,image/webp,image/*"} className="hidden" onChange={(e) => { load(e.target.files?.[0]); e.target.value = ""; }} />

      {!file ? (
        <>
          <div className={`${seoCard} zseo-rise flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left`}>
            <VecLogo size={120} flip={reverse} />
            <div className="min-w-0">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{title}</h2>
              <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">{blurb}</p>
              <p className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                {chips.map((t) => <span key={t} className="rounded-full border border-indigo-200/80 bg-white/80 px-3 py-1 text-xs font-semibold text-indigo-800 dark:border-white/10 dark:bg-white/5 dark:text-indigo-100">{t}</span>)}
              </p>
            </div>
          </div>
          <button type="button" onClick={() => input.current?.click()}
            onDragEnter={(e) => { if (e.dataTransfer.types.includes("Files")) setDrag(true); }} onDragLeave={() => setDrag(false)}
            onDragOver={(e) => { if (e.dataTransfer.types.includes("Files")) e.preventDefault(); }}
            onDrop={(e) => { e.preventDefault(); setDrag(false); load(e.dataTransfer.files?.[0]); }}
            className={`${seoCard} zseo-rise group flex w-full flex-col items-center justify-center gap-2 border-2 border-dashed px-5 py-12 text-center transition ${drag ? "scale-[1.01] border-indigo-500 bg-indigo-50/80 dark:bg-indigo-500/10" : "border-indigo-300/80 hover:-translate-y-0.5 hover:border-indigo-500"}`}>
            <span className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30 transition group-hover:scale-110 ${drag ? "zseo-float" : ""}`}><UploadCloud className="h-6 w-6" /></span>
            <span className="text-base font-bold text-slate-900 dark:text-white">{reverse ? "Drop your SVG here" : "Drop your image here"}</span>
            <span className="text-xs text-slate-600 dark:text-slate-300">{reverse ? "or click to choose an .svg file" : "PNG, JPG or WebP · or click to choose"}</span>
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
            <VecLogo size={52} flip={reverse} />
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-900 dark:text-white" title={file.name}>{file.name}</p><p className="text-xs text-slate-600 dark:text-slate-300">{fmtSize(file.size)}{svgDims ? ` · ${Math.round(svgDims.w)}×${Math.round(svgDims.h)}` : trace ? ` · traced at ${trace.w}×${trace.h}` : ""}</p></div>
            <button type="button" onClick={() => input.current?.click()} className={seoBtn}><RefreshCw className="h-4 w-4" />Change file</button>
            <button type="button" onClick={reset} className={seoBtn} aria-label="Remove file"><X className="h-4 w-4" /></button>
          </div>

          {/* options */}
          <div className={`${seoCard} zseo-rise p-4 sm:p-5`} style={{ ["--i" as any]: 1 }}>
            {reverse ? (
              <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(15rem, 1fr))" }}>
                <div>
                  <Lbl right={svgDims ? `${outW} × ${Math.round((outW * svgDims.h) / svgDims.w)} px` : ""}>Width</Lbl>
                  <div className="flex flex-wrap items-center gap-2">
                    <Seg value={[256, 512, 1024, 2048, 4096].includes(outW) ? outW : 0} set={(v) => v && setOutW(v)} opts={[[256, "256"], [512, "512"], [1024, "1024"], [2048, "2048"], [4096, "4096"]] as [number, string][]} />
                    <input type="number" min={16} max={8192} value={outW} onChange={(e) => setOutW(Number(e.target.value) || 16)} className={`${seoField} !w-28 !py-1.5 !text-sm`} aria-label="Custom width in pixels" />
                  </div>
                </div>
                <div>
                  <Lbl>Background</Lbl>
                  <Seg value={bg} set={setBg} opts={[["transparent", "Transparent"], ["white", "White"], ["black", "Black"]]} />
                </div>
              </div>
            ) : (
              <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(15rem, 1fr))" }}>
                <div className="sm:col-span-full" style={{ gridColumn: "1 / -1" }}>
                  <Lbl>Quick presets</Lbl>
                  <div className="flex flex-wrap gap-2">
                    {([
                      ["Logo · flat colours", { mode: "color", colors: 8, detail: 1.2, speckle: 6, smooth: true, maxSide: 700 }],
                      ["Detailed artwork", { mode: "color", colors: 32, detail: 0.8, speckle: 3, smooth: true, maxSide: 900 }],
                      ["Photo · closest look", { mode: "color", colors: 64, detail: 0.4, speckle: 1, smooth: true, maxSide: 1100 }],
                      ["Black & white", { mode: "bw", detail: 0.8, speckle: 3, smooth: true, maxSide: 900 }],
                    ] as [string, Partial<Opts>][]).map(([l, v]) => (
                      <button key={l} type="button" onClick={() => setO({ ...o, ...v })} className={seoBtn}>{l}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <Lbl>Mode</Lbl>
                  <Seg value={o.mode} set={(v) => setO({ ...o, mode: v })} opts={[["color", "Colour"], ["bw", "Black & white"]]} />
                </div>
                {o.mode === "color" ? (
                  <div>
                    <Lbl right={`${o.colors} colours`}>Colours</Lbl>
                    <input type="range" min={2} max={64} value={o.colors} onChange={(e) => setO({ ...o, colors: Number(e.target.value) })} className="w-full accent-indigo-600" />
                  </div>
                ) : (
                  <div>
                    <Lbl right={o.threshold}>Threshold</Lbl>
                    <input type="range" min={20} max={235} value={o.threshold} onChange={(e) => setO({ ...o, threshold: Number(e.target.value) })} className="w-full accent-indigo-600" />
                  </div>
                )}
                <div>
                  <Lbl right={o.detail <= 0.6 ? "High" : o.detail <= 1.6 ? "Medium" : "Low"}>Detail</Lbl>
                  <input type="range" min={0.3} max={3} step={0.1} value={3.3 - o.detail} onChange={(e) => setO({ ...o, detail: Math.round((3.3 - Number(e.target.value)) * 10) / 10 })} className="w-full accent-indigo-600" aria-label="Detail level" />
                </div>
                <div>
                  <Lbl right={`${o.speckle}px`}>Ignore small specks</Lbl>
                  <input type="range" min={0} max={60} value={o.speckle} onChange={(e) => setO({ ...o, speckle: Number(e.target.value) })} className="w-full accent-indigo-600" />
                </div>
                <div>
                  <Lbl>Curves</Lbl>
                  <Seg value={o.smooth ? "smooth" : "sharp"} set={(v) => setO({ ...o, smooth: v === "smooth" })} opts={[["smooth", "Smooth"], ["sharp", "Sharp corners"]]} />
                </div>
                <div>
                  <Lbl>Working size</Lbl>
                  <Seg value={o.maxSide} set={(v) => setO({ ...o, maxSide: v })} opts={[[500, "Fast"], [900, "Balanced"], [1400, "Precise"]]} />
                </div>
              </div>
            )}
          </div>

          {/* preview */}
          <div className={`${seoCard} zseo-rise p-4 sm:p-5`} style={{ ["--i" as any]: 2 }}>
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(16rem, 1fr))" }}>
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">{reverse ? "Your SVG" : "Original"}</p>
                <div className="grid aspect-square place-items-center overflow-hidden rounded-2xl border border-indigo-100 dark:border-white/10" style={{ background: CHECK }}>
                  {srcUrl && <img src={srcUrl} alt="Original" className="max-h-full max-w-full object-contain" />}
                </div>
              </div>
              <div>
                <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">{reverse ? "PNG result" : "SVG result"}{busy && <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-500" />}</p>
                <div className="grid aspect-square place-items-center overflow-hidden rounded-2xl border border-indigo-100 dark:border-white/10" style={{ background: CHECK }}>
                  {reverse
                    ? (png ? <img src={png.url} alt="PNG result" className="max-h-full max-w-full object-contain" /> : <span className="px-6 text-center text-sm text-slate-500">Press “Create PNG” to see the result.</span>)
                    : (svgUrl ? <img src={svgUrl} alt="SVG result" className="max-h-full max-w-full object-contain" /> : <span className="px-6 text-center text-sm text-slate-500">{busy ? "Tracing…" : "No result yet."}</span>)}
                </div>
              </div>
            </div>
          </div>

          {/* result actions */}
          <div className={`${seoCard} zseo-rise p-4 sm:p-5`} style={{ ["--i" as any]: 3 }}>
            {reverse ? (
              png ? (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"><Check className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1"><p className="font-bold text-slate-900 dark:text-white">{base}.png</p><p className="text-xs text-slate-600 dark:text-slate-300">{png.w} × {png.h} px · {fmtSize(png.blob.size)}</p></div>
                  <button type="button" onClick={() => saveUrl(png.url, `${base}.png`)} className="zseo-shine inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5"><Download className="h-4 w-4" />Download PNG</button>
                  <button type="button" onClick={makePng} className={seoBtn}><RefreshCw className="h-4 w-4" />Redo</button>
                </div>
              ) : (
                <button type="button" onClick={makePng} disabled={busy} className="zseo-shine flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 disabled:opacity-60">
                  {busy ? <><Loader2 className="h-5 w-5 animate-spin" />Creating…</> : <><ImageIcon className="h-5 w-5" />Create PNG</>}
                </button>
              )
            ) : trace && trace.paths > 0 ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"><Check className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 dark:text-white">{base}.svg</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300">{fmtSize(trace.svg.length)} · {trace.paths} shape{trace.paths > 1 ? "s" : ""} · {trace.colors.length} colour{trace.colors.length > 1 ? "s" : ""}</p>
                  </div>
                  <button type="button" onClick={() => downloadFile(`${base}.svg`, trace.svg, "image/svg+xml")} className="zseo-shine inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5"><Download className="h-4 w-4" />Download SVG</button>
                  <button type="button" onClick={copy} className={seoBtn}>{copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}Copy code</button>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <FileCode2 className="h-4 w-4 text-slate-400" />
                  {trace.colors.map((c) => <span key={c} title={c} className="h-5 w-5 rounded-full border border-white shadow ring-1 ring-slate-300" style={{ background: c }} />)}
                </div>
              </div>
            ) : (
              <p className="text-center text-sm text-slate-600 dark:text-slate-300">{busy ? "Tracing your picture…" : "Adjust the options to see the SVG."}</p>
            )}
          </div>
        </>
      )}

      {msg && <div className={`${seoCard} flex items-start gap-3 p-4 text-sm text-amber-800 dark:text-amber-200`} role="alert"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><p>{msg}</p></div>}
      <p className="px-1 text-center text-xs text-slate-500 dark:text-slate-400"><Lock className="mr-1 inline h-3 w-3" />Your file stays on your device.{!reverse && " Tracing works best on logos, icons and drawings; photos become stylised artwork."}</p>
    </SeoToolShell>
  );
}
