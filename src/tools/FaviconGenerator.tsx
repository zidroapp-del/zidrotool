import { useState, useRef, useCallback } from "react";
import { Upload, Download, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const SIZES = [16, 32, 48, 64, 128, 256];

export default function FaviconGenerator() {
  const [src, setSrc] = useState<string | null>(null);
  const [size, setSize] = useState(64);
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

  const handleGenerate = () => {
    if (!src) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const scale = Math.min(size / img.naturalWidth, size / img.naturalHeight);
      const sw = img.naturalWidth * scale;
      const sh = img.naturalHeight * scale;
      ctx.drawImage(img, (size - sw) / 2, (size - sh) / 2, sw, sh);
      canvas.toBlob((blob) => {
        if (!blob) return;
        setResultUrl(URL.createObjectURL(blob));
      }, "image/x-icon");
    };
    img.src = src;
  };

  return (
    <div>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
        onClick={() => !src && fileRef.current?.click()}
        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-ink-200 py-12 transition-colors hover:border-brand-400 dark:border-ink-700"
      >
        {src ? <img src={src} alt="Preview" className="max-h-48 rounded-lg object-contain" /> : (
          <>
            <Upload className="h-10 w-10 text-ink-300 dark:text-ink-700" />
            <p className="mt-3 text-sm text-ink-500 dark:text-ink-400">Drop an image or click to upload</p>
          </>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </div>

      {error && <p className="mt-2 flex items-center gap-1.5 text-xs text-danger"><AlertCircle className="h-3.5 w-3.5" />{error}</p>}

      {src && (
        <div className="mt-6">
          <label className="label mb-2 block">Favicon size</label>
          <div className="mb-4 flex flex-wrap gap-1.5">
            {SIZES.map((s) => (
              <button key={s} onClick={() => setSize(s)} className={cn("btn btn-sm", size === s ? "btn-primary" : "btn-secondary")}>
                {s}×{s}
              </button>
            ))}
          </div>
          <button onClick={handleGenerate} className="btn-primary w-full">Generate Favicon</button>
        </div>
      )}

      {resultUrl && (
        <div className="mt-6 rounded-xl border border-ink-200 p-4 dark:border-ink-700">
          <p className="mb-2 text-sm font-semibold text-ink-900 dark:text-ink-100">Favicon ({size}×{size})</p>
          <div className="flex items-center gap-4">
            <img src={resultUrl} alt="Favicon" className="rounded border border-ink-200 dark:border-ink-700" style={{ width: size, height: size }} />
            <a href={resultUrl} download="favicon.ico" className="btn-primary inline-flex">
              <Download className="h-4 w-4" /> Download .ico
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
