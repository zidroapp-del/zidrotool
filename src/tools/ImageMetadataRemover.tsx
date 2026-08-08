import { useState, useRef, useCallback } from "react";
import { Upload, Download, AlertCircle } from "lucide-react";

export default function ImageMetadataRemover() {
  const [src, setSrc] = useState<string | null>(null);
  const [origName, setOrigName] = useState("");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) { setError("Please select an image file"); return; }
    setError("");
    setOrigName(file.name);
    const reader = new FileReader();
    reader.onload = () => { setSrc(reader.result as string); setResultUrl(null); };
    reader.readAsDataURL(file);
  }, []);

  const handleStrip = () => {
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
        setResultUrl(URL.createObjectURL(blob));
      }, "image/png");
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
          <div className="mb-4 rounded-lg border border-ink-200 p-4 dark:border-ink-700">
            <p className="text-xs text-ink-400">File: {origName}</p>
            <p className="mt-1 text-xs text-ink-400">EXIF, GPS, camera data, and timestamps will be removed by re-encoding the image.</p>
          </div>
          <button onClick={handleStrip} className="btn-primary w-full">Remove Metadata</button>
        </div>
      )}

      {resultUrl && (
        <div className="mt-6 rounded-xl border border-ink-200 p-4 dark:border-ink-700">
          <p className="mb-2 text-sm font-semibold text-ink-900 dark:text-ink-100">Clean image — all metadata removed</p>
          <img src={resultUrl} alt="Clean" className="max-h-48 rounded-lg" />
          <a href={resultUrl} download="clean-image.png" className="btn-primary mt-3 inline-flex">
            <Download className="h-4 w-4" /> Download
          </a>
        </div>
      )}
    </div>
  );
}
