import { useState, useRef, useCallback } from "react";
import { Upload, Download, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const SIZES = [
  { platform: "Instagram", name: "Square Post", w: 1080, h: 1080 },
  { platform: "Instagram", name: "Story / Reel", w: 1080, h: 1920 },
  { platform: "Instagram", name: "Portrait", w: 1080, h: 1350 },
  { platform: "Facebook", name: "Cover Photo", w: 820, h: 312 },
  { platform: "Facebook", name: "Shared Post", w: 1200, h: 630 },
  { platform: "Twitter / X", name: "Header", w: 1500, h: 500 },
  { platform: "Twitter / X", name: "Post Image", w: 1200, h: 675 },
  { platform: "YouTube", name: "Thumbnail", w: 1280, h: 720 },
  { platform: "LinkedIn", name: "Cover", w: 1584, h: 396 },
  { platform: "Pinterest", name: "Standard Pin", w: 1000, h: 1500 },
];

export default function SocialImageResizer() {
  const [src, setSrc] = useState<string | null>(null);
  const [selected, setSelected] = useState(SIZES[0]);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) { setError("Please select an image file"); return; }
    setError("");
    const reader = new FileReader();
    reader.onload = () => { setSrc(reader.result as string); setResultUrl(null); };
    reader.readAsDataURL(file);
  }, []);

  const handleResize = () => {
    if (!src) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = selected.w;
      canvas.height = selected.h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const scale = Math.max(selected.w / img.naturalWidth, selected.h / img.naturalHeight);
      const sw = img.naturalWidth * scale;
      const sh = img.naturalHeight * scale;
      ctx.drawImage(img, (selected.w - sw) / 2, (selected.h - sh) / 2, sw, sh);
      canvas.toBlob((blob) => {
        if (!blob) return;
        setResultUrl(URL.createObjectURL(blob));
      }, "image/png");
    };
    img.src = src;
  };

  return (
    <div>
      <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }} onClick={() => !src && fileRef.current?.click()} className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-ink-200 py-10 transition-colors hover:border-brand-400 dark:border-ink-700">
        {src ? <img src={src} alt="Preview" className="max-h-40 rounded-lg object-contain" /> : <><Upload className="h-10 w-10 text-ink-300 dark:text-ink-700" /><p className="mt-3 text-sm text-ink-500 dark:text-ink-400">Drop an image or click to upload</p></>}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </div>
      {error && <p className="mt-2 flex items-center gap-1.5 text-xs text-danger"><AlertCircle className="h-3.5 w-3.5" />{error}</p>}
      {src && (
        <div className="mt-6">
          <label className="label mb-2 block">Target size</label>
          <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {SIZES.map((s, i) => (
              <button key={i} onClick={() => { setSelected(s); setResultUrl(null); }} className={cn("flex items-center justify-between rounded-lg border p-2 text-left transition-all", selected === s ? "border-brand-500 bg-brand-50 dark:border-brand-700 dark:bg-brand-900/20" : "border-ink-200 dark:border-ink-700")}>
                <div><p className="text-xs font-medium text-ink-900 dark:text-ink-100">{s.platform} — {s.name}</p><p className="text-[10px] text-ink-400">{s.w} × {s.h} px</p></div>
              </button>
            ))}
          </div>
          <button onClick={handleResize} className="btn-primary w-full">Resize to {selected.w}×{selected.h}</button>
        </div>
      )}
      {resultUrl && (
        <div className="mt-6 rounded-xl border border-ink-200 p-4 dark:border-ink-700">
          <p className="mb-2 text-sm font-semibold text-ink-900 dark:text-ink-100">{selected.platform} — {selected.name} ({selected.w}×{selected.h})</p>
          <img src={resultUrl} alt="Resized" className="max-h-40 rounded-lg" />
          <a href={resultUrl} download={`social-${selected.w}x${selected.h}.png`} className="btn-primary mt-3 inline-flex"><Download className="h-4 w-4" /> Download</a>
        </div>
      )}
    </div>
  );
}
