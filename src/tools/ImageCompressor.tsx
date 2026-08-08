import { useState, useRef, useCallback } from "react";
import { Upload, Download, AlertCircle } from "lucide-react";

export default function ImageCompressor() {
  const [src, setSrc] = useState<string | null>(null);
  const [origSize, setOrigSize] = useState("");
  const [quality, setQuality] = useState(0.7);
  const [format, setFormat] = useState<"image/jpeg" | "image/webp">("image/jpeg");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) { setError("Please select an image file"); return; }
    setError("");
    setOrigSize(`${(file.size / 1024).toFixed(1)} KB`);
    const reader = new FileReader();
    reader.onload = () => { setSrc(reader.result as string); setResultUrl(null); };
    reader.readAsDataURL(file);
  }, []);

  const handleCompress = () => {
    if (!src) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        setResultUrl(url);
        setResultSize(`${(blob.size / 1024).toFixed(1)} KB`);
      }, format, quality);
    };
    img.src = src;
  };

  const savings = origSize && resultSize ? Math.round((1 - parseFloat(resultSize) / parseFloat(origSize)) * 100) : 0;

  return (
    <div>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
        onClick={() => fileRef.current?.click()}
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
          <p className="mb-3 text-xs text-ink-400">Original size: {origSize}</p>
          <div className="mb-4">
            <label className="label mb-1.5 block">Quality: {Math.round(quality * 100)}%</label>
            <input type="range" min={0.1} max={1} step={0.05} value={quality} onChange={(e) => setQuality(parseFloat(e.target.value))} className="w-full" />
          </div>
          <div className="mb-4">
            <label className="label mb-2 block">Output format</label>
            <div className="flex gap-1.5">
              <button onClick={() => setFormat("image/jpeg")} className={`btn btn-sm ${format === "image/jpeg" ? "btn-primary" : "btn-secondary"}`}>JPEG</button>
              <button onClick={() => setFormat("image/webp")} className={`btn btn-sm ${format === "image/webp" ? "btn-primary" : "btn-secondary"}`}>WebP</button>
            </div>
          </div>
          <button onClick={handleCompress} className="btn-primary w-full">Compress Image</button>
        </div>
      )}

      {resultUrl && (
        <div className="mt-6 rounded-xl border border-ink-200 p-4 dark:border-ink-700">
          <p className="mb-2 text-sm font-semibold text-ink-900 dark:text-ink-100">
            Compressed: {resultSize} ({savings > 0 ? `${savings}% smaller` : "no change"})
          </p>
          <img src={resultUrl} alt="Compressed" className="max-h-48 rounded-lg" />
          <a href={resultUrl} download={`compressed.${format === "image/webp" ? "webp" : "jpg"}`} className="btn-primary mt-3 inline-flex">
            <Download className="h-4 w-4" /> Download
          </a>
        </div>
      )}
    </div>
  );
}
