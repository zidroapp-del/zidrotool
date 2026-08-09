import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, Download, AlertCircle, X } from "lucide-react";

type OutputFormat = "image/jpeg" | "image/png" | "image/webp";

export default function ImageCompressor() {
  const [src, setSrc] = useState<string | null>(null);
  const [origSize, setOrigSize] = useState("");
  const [origFileName, setOrigFileName] = useState("");
  const [quality, setQuality] = useState(0.7);
  const [format, setFormat] = useState<OutputFormat>("image/jpeg");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState("");
  const [error, setError] = useState("");
  const [isCompressing, setIsCompressing] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    setError("");
    setResultUrl(null);
    setResultSize("");
    setOrigSize(`${(file.size / 1024).toFixed(1)} KB`);
    setOrigFileName(file.name);

    const reader = new FileReader();

    reader.onload = () => {
      setSrc(reader.result as string);
    };

    reader.onerror = () => {
      setError("Could not read the selected image.");
    };

    reader.readAsDataURL(file);
  }, []);

  const handleCompress = useCallback(() => {
    if (!src) return;

    setIsCompressing(true);
    setError("");

    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        setError("Your browser does not support image processing.");
        setIsCompressing(false);
        return;
      }

      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          setIsCompressing(false);

          if (!blob) {
            setError("Unable to compress this image.");
            return;
          }

          if (resultUrl) {
            URL.revokeObjectURL(resultUrl);
          }

          const url = URL.createObjectURL(blob);

          setResultUrl(url);
          setResultSize(`${(blob.size / 1024).toFixed(1)} KB`);
        },
        format,
        format === "image/png" ? undefined : quality
      );
    };

    img.onerror = () => {
      setError("Unable to load this image.");
      setIsCompressing(false);
    };

    img.src = src;
  }, [src, quality, format, resultUrl]);

  const handleReset = () => {
    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
    }

    setSrc(null);
    setResultUrl(null);
    setOrigSize("");
    setResultSize("");
    setOrigFileName("");
    setError("");

    if (fileRef.current) {
      fileRef.current.value = "";
    }
  };

  const savings =
    origSize && resultSize
      ? Math.max(
          0,
          Math.round(
            (1 -
              parseFloat(resultSize) /
                parseFloat(origSize)) *
              100
          )
        )
      : 0;

  const extension =
    format === "image/webp"
      ? "webp"
      : format === "image/png"
      ? "png"
      : "jpg";

  useEffect(() => {
    return () => {
      if (resultUrl) {
        URL.revokeObjectURL(resultUrl);
      }
    };
  }, [resultUrl]);

  return (
    <div>
      {!src ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();

            const file = e.dataTransfer.files[0];

            if (file) {
              handleFile(file);
            }
          }}
          onClick={() => fileRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-ink-200 py-12 transition-colors hover:border-brand-400 dark:border-ink-700"
        >
          <Upload className="mb-3 h-8 w-8 text-ink-400" />

          <p className="font-medium text-ink-900 dark:text-ink-100">
            Drop an image or click to upload
          </p>

          <p className="mt-1 text-xs text-ink-400">
            JPEG, PNG or WebP
          </p>

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];

              if (file) {
                handleFile(file);
              }
            }}
          />
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-ink-900 dark:text-ink-100">
              {origFileName}
            </p>

            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg p-2 text-ink-400 transition-colors hover:text-danger"
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-ink-200 dark:border-ink-700">
            <img
              src={src}
              alt="Original preview"
              className="max-h-72 w-full object-contain"
            />
          </div>

          <p className="mt-3 text-xs text-ink-400">
            Original size: {origSize}
          </p>

          <div className="mt-5">
            <label className="label mb-1.5 block">
              Quality: {Math.round(quality * 100)}%
            </label>

            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={quality}
              onChange={(e) =>
                setQuality(parseFloat(e.target.value))
              }
              disabled={format === "image/png"}
              className="w-full"
            />

            {format === "image/png" && (
              <p className="mt-1 text-xs text-ink-400">
                Quality control is not available for PNG compression.
              </p>
            )}
          </div>

          <div className="mt-5">
            <label className="label mb-2 block">
              Output format
            </label>

            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setFormat("image/jpeg")}
                className={`btn btn-sm ${
                  format === "image/jpeg"
                    ? "btn-primary"
                    : "btn-secondary"
                }`}
              >
                JPEG
              </button>

              <button
                type="button"
                onClick={() => setFormat("image/png")}
                className={`btn btn-sm ${
                  format === "image/png"
                    ? "btn-primary"
                    : "btn-secondary"
                }`}
              >
                PNG
              </button>

              <button
                type="button"
                onClick={() => setFormat("image/webp")}
                className={`btn btn-sm ${
                  format === "image/webp"
                    ? "btn-primary"
                    : "btn-secondary"
                }`}
              >
                WebP
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCompress}
            disabled={isCompressing}
            className="btn-primary mt-5 w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCompressing ? "Compressing..." : "Compress Image"}
          </button>

          {error && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-danger">
              <AlertCircle className="h-3.5 w-3.5" />
              {error}
            </p>
          )}

          {resultUrl && (
            <div className="mt-6 rounded-xl border border-ink-200 p-4 dark:border-ink-700">
              <p className="mb-2 text-sm font-semibold text-ink-900 dark:text-ink-100">
                Compressed: {resultSize}
              </p>

              <p className="mb-4 text-xs text-ink-400">
                {savings > 0
                  ? `${savings}% smaller than the original`
                  : "No size reduction"}
              </p>

              <img
                src={resultUrl}
                alt="Compressed preview"
                className="max-h-48 w-full rounded-lg object-contain"
              />

              <a
                href={resultUrl}
                download={`compressed.${extension}`}
                className="btn-primary mt-3 inline-flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}