import { useCallback, useEffect, useRef, useState } from "react";
import JSZip from "jszip";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Image as ImageIcon,
  Loader2,
  PackageOpen,
  Upload,
  X,
} from "lucide-react";

type OutputFormat = "image/jpeg" | "image/png" | "image/webp";
type ItemStatus = "ready" | "processing" | "done" | "error";

type ImageItem = {
  id: string;
  file: File;
  sourceUrl: string | null;
  status: ItemStatus;
  error: string;
  resultUrl: string | null;
  resultBlob: Blob | null;
};

type CompressionJob = { completed: number; total: number; currentFile: string } | null;

const SUPPORTED_FORMATS: Record<string, OutputFormat> = {
  "image/jpeg": "image/jpeg",
  "image/png": "image/png",
  "image/webp": "image/webp",
};
const EXTENSION_FORMATS: Record<string, OutputFormat> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};
const MAX_FILE_COUNT = 20;
const MAX_FILE_BYTES = 50 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 40_000_000;
const MAX_ZIP_BYTES = 250 * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
}

function outputExtension(format: OutputFormat): string {
  return format === "image/jpeg" ? "jpg" : format === "image/png" ? "png" : "webp";
}

function outputName(filename: string, format: OutputFormat): string {
  const stem = filename.replace(/\.[^.]+$/, "").trim() || "compressed-image";
  return `${stem}-compressed.${outputExtension(format)}`;
}

function createId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getInputFormat(file: File): OutputFormat | null {
  const mime = file.type.toLowerCase();
  if (mime && SUPPORTED_FORMATS[mime]) return SUPPORTED_FORMATS[mime];
  if (mime && mime !== "application/octet-stream") return null;
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_FORMATS[extension] ?? null;
}

function loadImage(sourceUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not decode this image."));
    image.src = sourceUrl;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, format: OutputFormat, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("The browser could not encode this image."));
          return;
        }
        if (blob.type.toLowerCase() !== format) {
          reject(new Error(`The browser did not produce the requested ${format.split("/")[1].toUpperCase()} format.`));
          return;
        }
        resolve(blob);
      }, format, format === "image/png" ? undefined : quality);
    } catch (error) {
      reject(error instanceof Error ? error : new Error("Image encoding failed."));
    }
  });
}

async function compressImage(sourceUrl: string, format: OutputFormat, quality: number): Promise<Blob> {
  const image = await loadImage(sourceUrl);
  const pixels = image.naturalWidth * image.naturalHeight;
  if (!image.naturalWidth || !image.naturalHeight || !Number.isSafeInteger(pixels)) {
    throw new Error("Image dimensions are invalid.");
  }
  if (pixels > MAX_IMAGE_PIXELS) {
    throw new Error("Image exceeds the 40-megapixel processing limit.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas image processing is unavailable in this browser.");

  // JPEG does not support transparency; composite transparent pixels onto white.
  if (format === "image/jpeg") {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  context.drawImage(image, 0, 0);

  try {
    return await canvasToBlob(canvas, format, quality);
  } finally {
    canvas.width = 0;
    canvas.height = 0;
  }
}

export default function ImageCompressor() {
  const { t } = useTranslation();
  const [items, setItems] = useState<ImageItem[]>([]);
  const [quality, setQuality] = useState(0.7);
  const [format, setFormat] = useState<OutputFormat>("image/jpeg");
  const [isCompressing, setIsCompressing] = useState(false);
  const [isCreatingZip, setIsCreatingZip] = useState(false);
  const [job, setJob] = useState<CompressionJob>(null);
  const [pageError, setPageError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const objectUrlsRef = useRef(new Set<string>());
  const runIdRef = useRef(0);

  const createObjectUrl = useCallback((blob: Blob) => {
    const url = URL.createObjectURL(blob);
    objectUrlsRef.current.add(url);
    return url;
  }, []);

  const revokeObjectUrl = useCallback((url: string | null) => {
    if (!url || !objectUrlsRef.current.has(url)) return;
    URL.revokeObjectURL(url);
    objectUrlsRef.current.delete(url);
  }, []);

  const releaseItems = useCallback((entries: ImageItem[]) => {
    entries.forEach((item) => {
      revokeObjectUrl(item.sourceUrl);
      revokeObjectUrl(item.resultUrl);
    });
  }, [revokeObjectUrl]);

  useEffect(() => () => {
    runIdRef.current += 1;
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrlsRef.current.clear();
  }, []);

  const handleFiles = useCallback((files: FileList | File[]) => {
    if (isCompressing) return;
    const selected = Array.from(files);
    if (selected.length === 0) return;

    runIdRef.current += 1;
    releaseItems(items);
    setPageError("");
    setJob(null);

    const nextItems: ImageItem[] = selected.slice(0, MAX_FILE_COUNT).map((file) => {
      const inputFormat = getInputFormat(file);
      let error = "";
      if (!inputFormat) error = t("tools.imageCompressor.unsupportedFormat");
      else if (file.size === 0) error = t("tools.imageCompressor.emptyFile");
      else if (file.size > MAX_FILE_BYTES) error = t("tools.imageCompressor.fileTooLarge");
      return {
        id: createId(),
        file,
        sourceUrl: error ? null : createObjectUrl(file),
        status: error ? "error" : "ready",
        error,
        resultUrl: null,
        resultBlob: null,
      };
    });

    if (selected.length > MAX_FILE_COUNT) {
      setPageError(t("tools.imageCompressor.maxFiles", { count: MAX_FILE_COUNT }));
    }
    setItems(nextItems);
    if (fileRef.current) fileRef.current.value = "";
  }, [createObjectUrl, isCompressing, items, releaseItems, t]);

  const removeItem = (id: string) => {
    if (isCompressing) return;
    const removed = items.find((item) => item.id === id);
    if (removed) releaseItems([removed]);
    setItems((current) => current.filter((item) => item.id !== id));
    setPageError("");
  };

  const reset = () => {
    if (isCompressing) return;
    runIdRef.current += 1;
    releaseItems(items);
    setItems([]);
    setJob(null);
    setPageError("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleCompress = async () => {
    const pending = items.filter((item) => item.status !== "processing" && item.sourceUrl);
    if (pending.length === 0 || isCompressing) return;

    const runId = ++runIdRef.current;
    const selectedFormat = format;
    const selectedQuality = quality;
    setIsCompressing(true);
    setPageError("");
    setJob({ completed: 0, total: pending.length, currentFile: pending[0].file.name });

    // Discard previous outputs before processing with the newly selected settings.
    pending.forEach((item) => revokeObjectUrl(item.resultUrl));
    setItems((current) => current.map((item) => pending.some((pendingItem) => pendingItem.id === item.id)
      ? { ...item, status: "ready", error: "", resultUrl: null, resultBlob: null }
      : item));

    let completed = 0;
    for (const item of pending) {
      if (runIdRef.current !== runId) return;
      setJob({ completed, total: pending.length, currentFile: item.file.name });
      setItems((current) => current.map((entry) => entry.id === item.id
        ? { ...entry, status: "processing", error: "" }
        : entry));

      try {
        const blob = await compressImage(item.sourceUrl!, selectedFormat, selectedQuality);
        if (runIdRef.current !== runId) return;
        const resultUrl = createObjectUrl(blob);
        setItems((current) => current.map((entry) => entry.id === item.id
          ? { ...entry, status: "done", error: "", resultUrl, resultBlob: blob }
          : entry));
      } catch (error) {
        if (runIdRef.current !== runId) return;
        const message = error instanceof Error && error.message.includes("40-megapixel")
          ? t("tools.imageCompressor.dimensionsTooLarge")
          : error instanceof Error && error.message.includes("requested")
            ? t("tools.imageCompressor.formatUnsupported")
            : t("tools.imageCompressor.processingFailed");
        setItems((current) => current.map((entry) => entry.id === item.id
          ? { ...entry, status: "error", error: message, resultUrl: null, resultBlob: null }
          : entry));
      }

      completed += 1;
      setJob({ completed, total: pending.length, currentFile: item.file.name });
    }

    if (runIdRef.current === runId) setIsCompressing(false);
  };

  const downloadZip = async () => {
    const completedItems = items.filter((item) => item.status === "done" && item.resultBlob);
    if (completedItems.length < 2 || isCreatingZip) return;
    const totalBytes = completedItems.reduce((total, item) => total + item.resultBlob!.size, 0);
    if (totalBytes > MAX_ZIP_BYTES) {
      setPageError(t("tools.imageCompressor.zipTooLarge", { size: formatBytes(MAX_ZIP_BYTES) }));
      return;
    }
    setIsCreatingZip(true);
    setPageError("");

    try {
      const zip = new JSZip();
      const filenameCounts = new Map<string, number>();
      for (const item of completedItems) {
        const resultFormat = item.resultBlob!.type as OutputFormat;
        const baseName = outputName(item.file.name, resultFormat);
        const count = filenameCounts.get(baseName) ?? 0;
        filenameCounts.set(baseName, count + 1);
        const uniqueName = count === 0
          ? baseName
          : `${baseName.replace(/\.[^.]+$/, "")}-${count + 1}.${outputExtension(resultFormat)}`;
        zip.file(uniqueName, item.resultBlob!);
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = createObjectUrl(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "compressed-images.zip";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => revokeObjectUrl(url), 1000);
    } catch {
      setPageError(t("tools.imageCompressor.zipFailed"));
    } finally {
      setIsCreatingZip(false);
    }
  };

  const completedCount = items.filter((item) => item.status === "done").length;
  const compressibleCount = items.filter((item) => item.sourceUrl && item.status !== "processing").length;

  return (
    <div
      className="space-y-5"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        handleFiles([...Array.from(items, (item) => item.file), ...Array.from(event.dataTransfer.files)]);
      }}
    >
      {items.length === 0 ? (
        <label
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            event.stopPropagation();
            handleFiles(event.dataTransfer.files);
          }}
          className="flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ink-200 bg-white px-5 py-12 text-center transition-colors hover:border-brand-400 dark:border-ink-700 dark:bg-ink-950"
        >
          <Upload className="mb-3 h-9 w-9 text-brand-500" aria-hidden="true" />
          <span className="font-semibold text-ink-900 dark:text-ink-100">{t("tools.imageCompressor.dropTitle")}</span>
          <span className="mt-1 text-sm text-ink-500 dark:text-ink-400">{t("tools.imageCompressor.dropSubtitle")}</span>
          <span className="mt-3 text-xs text-ink-400">{t("tools.imageCompressor.supportedFormats")}</span>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            multiple
            className="sr-only"
            aria-label={t("tools.imageCompressor.dropTitle")}
            onChange={(event) => event.target.files && handleFiles(event.target.files)}
          />
        </label>
      ) : (
        <>
          <div className="flex flex-col gap-3 rounded-2xl border border-ink-200 bg-white p-4 dark:border-ink-700 dark:bg-ink-950 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-ink-900 dark:text-ink-100">{t("tools.imageCompressor.settingsHeading")}</p>
              <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">{t("tools.imageCompressor.clientSideNote")}</p>
            </div>
            <label htmlFor="image-compressor-add" className={`btn btn-secondary ${isCompressing ? "pointer-events-none opacity-60" : "cursor-pointer"}`}>
              <Upload className="h-4 w-4" aria-hidden="true" />{t("tools.imageCompressor.addImages")}
            </label>
            <input
              id="image-compressor-add"
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              multiple
              className="sr-only"
              disabled={isCompressing}
              onChange={(event) => event.target.files && handleFiles([...Array.from(items, (item) => item.file), ...Array.from(event.target.files)])}
            />
          </div>

          <div className="grid gap-5 rounded-2xl border border-ink-200 bg-white p-4 dark:border-ink-700 dark:bg-ink-950 sm:grid-cols-2 sm:p-5">
            <div>
              <label htmlFor="image-compressor-quality" className="label mb-2 block">
                {t("tools.imageCompressor.quality", { percent: Math.round(quality * 100) })}
              </label>
              <input
                id="image-compressor-quality"
                type="range"
                min={0.1}
                max={1}
                step={0.05}
                value={quality}
                onChange={(event) => setQuality(Number(event.target.value))}
                disabled={format === "image/png" || isCompressing}
                className="w-full accent-brand-600 disabled:opacity-50"
                aria-describedby="image-compressor-quality-help"
              />
              <p id="image-compressor-quality-help" className="mt-1 text-xs text-ink-500 dark:text-ink-400">
                {format === "image/png" ? t("tools.imageCompressor.pngQualityNote") : t("tools.imageCompressor.qualityHelp")}
              </p>
            </div>
            <fieldset>
              <legend className="label mb-2">{t("tools.imageCompressor.outputFormat")}</legend>
              <div className="flex flex-wrap gap-2">
                {([
                  ["image/jpeg", "JPEG"],
                  ["image/png", "PNG"],
                  ["image/webp", "WebP"],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFormat(value)}
                    disabled={isCompressing}
                    aria-pressed={format === value}
                    className={`btn btn-sm ${format === value ? "btn-primary" : "btn-secondary"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          {isCompressing && job && (
            <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-900 dark:bg-brand-950/30" aria-live="polite">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-brand-800 dark:text-brand-200">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                {t("tools.imageCompressor.progress", { completed: job.completed, total: job.total, filename: job.currentFile })}
              </div>
              <progress className="h-2 w-full accent-brand-600" max={job.total} value={job.completed} aria-label={t("tools.imageCompressor.progressLabel")} />
            </div>
          )}

          {pageError && <p role="alert" className="rounded-lg bg-danger/10 p-3 text-sm text-danger">{pageError}</p>}

          <div className="space-y-4">
            {items.map((item) => {
              const savedBytes = item.resultBlob ? item.file.size - item.resultBlob.size : null;
              const reductionPercent = item.resultBlob && item.file.size > 0
                ? (savedBytes! / item.file.size) * 100
                : null;
              const suffix = item.resultBlob?.type === "image/jpeg" ? "jpg" : item.resultBlob?.type === "image/png" ? "png" : "webp";

              return (
                <article key={item.id} className="rounded-2xl border border-ink-200 bg-white p-4 dark:border-ink-700 dark:bg-ink-950 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      {item.status === "done" ? <CheckCircle2 className="h-5 w-5 shrink-0 text-success-600" aria-hidden="true" />
                        : item.status === "error" ? <AlertCircle className="h-5 w-5 shrink-0 text-danger" aria-hidden="true" />
                          : item.status === "processing" ? <Loader2 className="h-5 w-5 shrink-0 animate-spin text-brand-500" aria-hidden="true" />
                            : <ImageIcon className="h-5 w-5 shrink-0 text-brand-500" aria-hidden="true" />}
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-ink-900 dark:text-ink-100">{item.file.name}</h3>
                        <p className="text-xs text-ink-500 dark:text-ink-400">{t("tools.imageCompressor.originalSize", { size: formatBytes(item.file.size) })}</p>
                      </div>
                    </div>
                    {!isCompressing && <button type="button" onClick={() => removeItem(item.id)} className="rounded-lg p-2 text-ink-400 hover:text-danger" aria-label={t("tools.imageCompressor.removeImage", { filename: item.file.name })}><X className="h-4 w-4" /></button>}
                  </div>

                  {item.error && <p role="alert" className="mt-3 flex items-center gap-2 text-sm text-danger"><AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />{item.error}</p>}

                  {item.sourceUrl && (
                    <div className={`mt-4 grid gap-3 ${item.resultUrl ? "sm:grid-cols-2" : ""}`}>
                      <figure className="min-w-0 rounded-xl border border-ink-200 bg-ink-50 p-3 dark:border-ink-700 dark:bg-ink-900">
                        <figcaption className="mb-2 text-xs font-semibold text-ink-600 dark:text-ink-300">{t("tools.imageCompressor.before")}</figcaption>
                        <img src={item.sourceUrl} alt={t("tools.imageCompressor.previewAlt", { filename: item.file.name })} className="mx-auto max-h-64 w-full object-contain" />
                      </figure>
                      {item.resultUrl && item.resultBlob && (
                        <figure className="min-w-0 rounded-xl border border-brand-200 bg-brand-50/40 p-3 dark:border-brand-900 dark:bg-brand-950/20">
                          <figcaption className="mb-2 text-xs font-semibold text-ink-600 dark:text-ink-300">{t("tools.imageCompressor.after", { format: suffix.toUpperCase() })}</figcaption>
                          <img src={item.resultUrl} alt={t("tools.imageCompressor.compressedPreviewAlt", { filename: item.file.name })} className="mx-auto max-h-64 w-full object-contain" />
                        </figure>
                      )}
                    </div>
                  )}

                  {item.resultBlob && item.resultUrl && reductionPercent !== null && savedBytes !== null && (
                    <>
                      <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <div className="rounded-lg bg-ink-50 p-3 dark:bg-ink-900"><dt className="text-xs text-ink-500 dark:text-ink-400">{t("tools.imageCompressor.original")}</dt><dd className="mt-1 text-sm font-semibold text-ink-900 dark:text-ink-100">{formatBytes(item.file.size)}</dd></div>
                        <div className="rounded-lg bg-ink-50 p-3 dark:bg-ink-900"><dt className="text-xs text-ink-500 dark:text-ink-400">{t("tools.imageCompressor.compressed")}</dt><dd className="mt-1 text-sm font-semibold text-ink-900 dark:text-ink-100">{formatBytes(item.resultBlob.size)}</dd></div>
                        <div className="rounded-lg bg-ink-50 p-3 dark:bg-ink-900"><dt className="text-xs text-ink-500 dark:text-ink-400">{savedBytes >= 0 ? t("tools.imageCompressor.savedBytes") : t("tools.imageCompressor.extraBytes")}</dt><dd className="mt-1 text-sm font-semibold text-ink-900 dark:text-ink-100">{formatBytes(Math.abs(savedBytes))}</dd></div>
                        <div className="rounded-lg bg-ink-50 p-3 dark:bg-ink-900"><dt className="text-xs text-ink-500 dark:text-ink-400">{reductionPercent >= 0 ? t("tools.imageCompressor.reduction") : t("tools.imageCompressor.increase")}</dt><dd className="mt-1 text-sm font-semibold text-ink-900 dark:text-ink-100">{Math.abs(reductionPercent).toFixed(1)}%</dd></div>
                      </dl>
                      <a href={item.resultUrl} download={outputName(item.file.name, item.resultBlob.type as OutputFormat)} className="btn btn-primary mt-4 inline-flex w-full items-center justify-center sm:w-auto">
                        <Download className="h-4 w-4" aria-hidden="true" />{t("tools.imageCompressor.downloadImage")}
                      </a>
                    </>
                  )}
                </article>
              );
            })}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={handleCompress} disabled={isCompressing || !compressibleCount} className="btn btn-primary flex-1 justify-center disabled:cursor-not-allowed disabled:opacity-60">
              {isCompressing ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />{t("tools.imageCompressor.compressing")}</> : <><ImageIcon className="h-4 w-4" aria-hidden="true" />{t("tools.imageCompressor.compressBtn")}</>}
            </button>
            {completedCount > 1 && (
              <button type="button" onClick={downloadZip} disabled={isCreatingZip || isCompressing} className="btn btn-secondary flex-1 justify-center disabled:opacity-60">
                {isCreatingZip ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <PackageOpen className="h-4 w-4" aria-hidden="true" />}
                {isCreatingZip ? t("tools.imageCompressor.creatingZip") : t("tools.imageCompressor.downloadZip", { count: completedCount })}
              </button>
            )}
            <button type="button" onClick={reset} disabled={isCompressing} className="btn btn-secondary justify-center disabled:opacity-60">{t("tools.imageCompressor.startOver")}</button>
          </div>
        </>
      )}
    </div>
  );
}
