import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { AlertCircle, ArrowRight, Download, ImagePlus, Images, Info, Trash2, UploadCloud } from "lucide-react";
import { SeoToolShell, seoBtn, seoCard } from "@/components/SeoToolShell";

/**
 * Image converter: PNG, JPG and WebP, many files at once, quality, optional resize.
 * Everything happens in the browser (canvas). Files are never uploaded.
 */
interface Props { slug?: string; initial?: { format?: string } }

type Fmt = "image/png" | "image/jpeg" | "image/webp";
const FORMATS: { value: Fmt; label: string; ext: string; note: string; tone: string }[] = [
  { value: "image/jpeg", label: "JPG", ext: "jpg", note: "Photos, small files", tone: "from-amber-500 to-orange-500" },
  { value: "image/png", label: "PNG", ext: "png", note: "Logos, transparency", tone: "from-sky-500 to-indigo-500" },
  { value: "image/webp", label: "WebP", ext: "webp", note: "Smallest for the web", tone: "from-emerald-500 to-teal-500" },
];
const MAX_FILES = 30;
const SIZES = [{ label: "Original size", v: 0 }, { label: "Max 3840 px", v: 3840 }, { label: "Max 1920 px", v: 1920 }, { label: "Max 1280 px", v: 1280 }, { label: "Max 800 px", v: 800 }];

interface Item { id: number; file: File; url: string; w: number; h: number }
interface Result { url: string; size: number; w: number; h: number; name: string; error?: string }

const fmtSize = (n: number) => (n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 / 1024).toFixed(2)} MB`);
const baseName = (n: string) => n.replace(/\.[^.]+$/, "") || "image";

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("This file could not be read as an image."));
    img.src = url;
  });
}

export default function ImageConverterStudio({ initial }: Props) {
  const startFmt = FORMATS.find((f) => f.ext === initial?.format || f.value === initial?.format)?.value ?? "image/jpeg";
  const [items, setItems] = useState<Item[]>([]);
  const [fmt, setFmt] = useState<Fmt>(startFmt);
  const [quality, setQuality] = useState(0.9);
  const [maxW, setMaxW] = useState(0);
  const [bg, setBg] = useState("#ffffff");
  const [results, setResults] = useState<Record<number, Result>>({});
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const idRef = useRef(0);
  const urlsRef = useRef<string[]>([]);

  const addFiles = useCallback(async (list: FileList | File[] | null) => {
    if (!list) return;
    const all = Array.from(list);
    const images = all.filter((f) => f.type.startsWith("image/"));
    const skipped = all.length - images.length;
    const next: Item[] = [];
    for (const file of images) {
      const url = URL.createObjectURL(file);
      urlsRef.current.push(url);
      try {
        const img = await loadImage(url);
        next.push({ id: ++idRef.current, file, url, w: img.naturalWidth, h: img.naturalHeight });
      } catch {
        URL.revokeObjectURL(url);
        setMsg(`“${file.name}” could not be opened as an image.`);
      }
    }
    setItems((prev) => {
      const merged = [...prev, ...next];
      if (merged.length > MAX_FILES) setMsg(`Only the first ${MAX_FILES} images are used.`);
      else if (skipped) setMsg(`${skipped} file${skipped > 1 ? "s were" : " was"} skipped because it is not an image.`);
      else if (!next.length) return prev;
      else setMsg("");
      return merged.slice(0, MAX_FILES);
    });
  }, []);

  // convert again whenever the files or the settings change
  useEffect(() => {
    let cancelled = false;
    const made: string[] = [];
    if (!items.length) { setResults({}); setBusy(false); return; }
    setBusy(true);
    const timer = window.setTimeout(async () => {
      const out: Record<number, Result> = {};
      const f = FORMATS.find((x) => x.value === fmt) ?? FORMATS[0];
      for (const it of items) {
        if (cancelled) return;
        try {
          const img = await loadImage(it.url);
          let w = img.naturalWidth, h = img.naturalHeight;
          if (maxW && Math.max(w, h) > maxW) { const k = maxW / Math.max(w, h); w = Math.max(1, Math.round(w * k)); h = Math.max(1, Math.round(h * k)); }
          const canvas = document.createElement("canvas");
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Your browser could not create a canvas.");
          if (fmt === "image/jpeg") { ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h); }
          ctx.drawImage(img, 0, 0, w, h);
          const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, fmt, quality));
          if (!blob) throw new Error("Conversion failed.");
          if (blob.type && blob.type !== fmt) throw new Error(`Your browser cannot save ${f.label} files. Try another format.`);
          const url = URL.createObjectURL(blob);
          made.push(url);
          out[it.id] = { url, size: blob.size, w, h, name: `${baseName(it.file.name)}.${f.ext}` };
        } catch (e) {
          out[it.id] = { url: "", size: 0, w: 0, h: 0, name: "", error: e instanceof Error ? e.message : "Conversion failed." };
        }
      }
      if (cancelled) { made.forEach((u) => URL.revokeObjectURL(u)); return; }
      setResults((prev) => { Object.values(prev).forEach((r) => r.url && URL.revokeObjectURL(r.url)); return out; });
      setBusy(false);
    }, 250);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [items, fmt, quality, maxW, bg]);

  useEffect(() => () => { urlsRef.current.forEach((u) => URL.revokeObjectURL(u)); }, []);

  const remove = (id: number) => setItems((prev) => { const it = prev.find((x) => x.id === id); if (it) URL.revokeObjectURL(it.url); return prev.filter((x) => x.id !== id); });
  const clear = () => { items.forEach((i) => URL.revokeObjectURL(i.url)); setItems([]); setMsg(""); };

  const done = items.filter((i) => results[i.id] && !results[i.id].error);
  const totalIn = done.reduce((s, i) => s + i.file.size, 0);
  const totalOut = done.reduce((s, i) => s + results[i.id].size, 0);
  const saved = totalIn ? Math.round((1 - totalOut / totalIn) * 100) : 0;
  const f = useMemo(() => FORMATS.find((x) => x.value === fmt) ?? FORMATS[0], [fmt]);

  const downloadAll = async () => {
    for (const it of done) {
      const r = results[it.id];
      const a = document.createElement("a");
      a.href = r.url; a.download = r.name;
      document.body.appendChild(a); a.click(); a.remove();
      await new Promise((res) => window.setTimeout(res, 250));
    }
  };

  return (
    <SeoToolShell>
      <div className={`${seoCard} zseo-rise flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5`}>
        <div className="flex items-center gap-3">
          <span className="zseo-ico zseo-float flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-sky-500 text-white shadow-lg shadow-indigo-500/30"><Images className="h-6 w-6" aria-hidden="true" /></span>
          <div>
            <p className="text-base font-extrabold text-slate-900 dark:text-white">Image converter</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">JPG · PNG · WebP — many images at once, nothing is uploaded</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-200" aria-hidden="true">
          <span className="rounded-lg bg-white/80 px-2.5 py-1 shadow-sm dark:bg-white/10">Any image</span>
          <ArrowRight className="h-4 w-4 text-indigo-500" />
          <span className={`rounded-lg bg-gradient-to-r ${f.tone} px-2.5 py-1 text-white shadow-sm`}>{f.label}</span>
        </div>
      </div>

      {/* drop zone */}
      <section className={`${seoCard} zseo-rise p-4 sm:p-6`} style={{ "--i": 1 } as CSSProperties}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); void addFiles(e.dataTransfer.files); }}>
        <button type="button" onClick={() => fileRef.current?.click()}
          className={`group flex w-full flex-col items-center bg-transparent justify-center gap-3 rounded-2xl border-2 border-dashed px-4 py-10 text-center transition ${drag ? "border-indigo-500 bg-indigo-100/70 dark:bg-indigo-400/10" : "border-indigo-300/80 hover:border-indigo-500 hover:bg-white/60 dark:border-indigo-300/30 dark:hover:bg-white/5"}`}>
          <span className="zseo-float flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30 transition group-hover:scale-110">{items.length ? <ImagePlus className="h-7 w-7" /> : <UploadCloud className="h-7 w-7" />}</span>
          <span className="text-base font-extrabold text-slate-900 dark:text-white">{items.length ? "Add more images" : "Drop images here or click to choose"}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">PNG, JPG, WebP, GIF, BMP, SVG… up to {MAX_FILES} images</span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple className="sr-only" aria-label="Choose images" onChange={(e) => { void addFiles(e.target.files); e.target.value = ""; }} />
        {msg && <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-300" role="status"><AlertCircle className="h-4 w-4 shrink-0" />{msg}</p>}
      </section>

      {/* options */}
      <section className={`${seoCard} zseo-rise p-4 sm:p-6`} style={{ "--i": 2 } as CSSProperties}>
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">Convert to</p>
        <div className="grid grid-cols-3 gap-2">
          {FORMATS.map((x) => (
            <button key={x.value} type="button" aria-pressed={fmt === x.value} onClick={() => setFmt(x.value)}
              className={`rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 ${fmt === x.value ? `border-transparent bg-gradient-to-br ${x.tone} text-white shadow-lg` : "border-white/80 bg-white/70 text-slate-800 hover:border-indigo-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-100"}`}>
              <span className="block text-lg font-black">{x.label}</span>
              <span className={`block text-[11px] leading-tight ${fmt === x.value ? "text-white/85" : "text-slate-500 dark:text-slate-400"}`}>{x.note}</span>
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div className={fmt === "image/png" ? "opacity-50" : ""}>
            <label className="mb-1.5 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300" htmlFor="ic-q">
              <span>Quality</span><span className="tabular-nums text-slate-600 dark:text-slate-300">{fmt === "image/png" ? "lossless" : `${Math.round(quality * 100)}%`}</span>
            </label>
            <input id="ic-q" type="range" min={0.1} max={1} step={0.05} value={quality} disabled={fmt === "image/png"} onChange={(e) => setQuality(parseFloat(e.target.value))} className="w-full accent-indigo-600" />
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{fmt === "image/png" ? "PNG keeps every detail, so it has no quality setting." : "Between 75% and 90% is a good balance of size and detail."}</p>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300" htmlFor="ic-size">Size</label>
            <select id="ic-size" value={maxW} onChange={(e) => setMaxW(Number(e.target.value))} className="w-full rounded-2xl border border-indigo-200/80 bg-white/90 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-100">
              {SIZES.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}
            </select>
          </div>
          {fmt === "image/jpeg" && (
            <div className="sm:col-span-2">
              <label className="mb-1.5 flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300" htmlFor="ic-bg">
                Background for transparent areas
                <input id="ic-bg" type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="h-8 w-12 cursor-pointer rounded-lg border border-indigo-200 bg-transparent" />
              </label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">JPG cannot be transparent, so transparent parts are filled with this colour.</p>
            </div>
          )}
        </div>
      </section>

      {/* results */}
      {items.length > 0 && (
        <section className={`${seoCard} zseo-rise p-4 sm:p-6`} style={{ "--i": 3 } as CSSProperties} aria-live="polite">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">{items.length} image{items.length > 1 ? "s" : ""} {busy ? "· converting…" : "· ready"}</h3>
              {!busy && done.length > 0 && (
                <p className="text-xs text-slate-500 dark:text-slate-400">{fmtSize(totalIn)} → {fmtSize(totalOut)} {saved > 0 ? <span className="font-bold text-emerald-600 dark:text-emerald-400">(−{saved}%)</span> : saved < 0 ? <span className="font-bold text-amber-600 dark:text-amber-400">(+{-saved}%)</span> : null}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={seoBtn} onClick={clear}><Trash2 className="h-4 w-4" />Clear all</button>
              <button type="button" disabled={busy || !done.length} onClick={() => void downloadAll()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50">
                <Download className="h-4 w-4" />Download {done.length > 1 ? `all (${done.length})` : f.label}
              </button>
            </div>
          </div>

          <ul className="space-y-2.5">
            {items.map((it, i) => {
              const r = results[it.id];
              const diff = r && !r.error && it.file.size ? Math.round((1 - r.size / it.file.size) * 100) : 0;
              return (
                <li key={it.id} className="zseo-rise flex flex-wrap items-center gap-3 rounded-2xl border border-white/80 bg-white/70 p-2.5 dark:border-white/10 dark:bg-white/5" style={{ "--i": Math.min(i, 8) } as CSSProperties}>
                  <img src={r && !r.error ? r.url : it.url} alt="" className="h-14 w-14 shrink-0 rounded-xl bg-[conic-gradient(#e2e8f0_25%,#fff_0_50%,#e2e8f0_0_75%,#fff_0)] bg-[length:12px_12px] object-contain" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100" title={it.file.name}>{it.file.name}</p>
                    {r?.error ? (
                      <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">{r.error}</p>
                    ) : (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {it.w}×{it.h} · {fmtSize(it.file.size)}
                        {r ? <> <ArrowRight className="mx-0.5 inline h-3 w-3" /> {r.w}×{r.h} · {fmtSize(r.size)}</> : " · waiting…"}
                      </p>
                    )}
                  </div>
                  {r && !r.error && (
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${diff > 0 ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200" : "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200"}`}>{diff > 0 ? `−${diff}%` : `+${-diff}%`}</span>
                  )}
                  <div className="flex items-center gap-1.5">
                    {r && !r.error && <a href={r.url} download={r.name} className={`${seoBtn} !px-3 !py-1.5`} aria-label={`Download ${r.name}`}><Download className="h-4 w-4" /></a>}
                    <button type="button" onClick={() => remove(it.id)} className={`${seoBtn} !px-3 !py-1.5`} aria-label={`Remove ${it.file.name}`}><Trash2 className="h-4 w-4" /></button>
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />Everything is converted on your device. Several downloads at once may ask your browser for permission. Animated GIFs become a single still image.</p>
        </section>
      )}
    </SeoToolShell>
  );
}
