import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import {
  ArrowDown,
  ArrowUp,
  Download,
  FileText,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { ToolLayout } from "@/components/ToolLayout";
import { useToast } from "@/components/Toast";

interface PdfFileItem {
  id: string;
  file: File;
}

export default function PdfMerger() {
  const { t } = useTranslation();
  const { success, error } = useToast();

  const [files, setFiles] = useState<PdfFileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultName, setResultName] = useState("merged.pdf");

  const createItems = (selectedFiles: File[]): PdfFileItem[] =>
    selectedFiles.map((file, index) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${index}-${Math.random()
        .toString(36)
        .slice(2)}`,
      file,
    }));

  const revokeResultUrl = () => {
    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
      setResultUrl(null);
    }
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFiles = Array.from(
      event.target.files ?? [],
    );

    event.target.value = "";

    if (selectedFiles.length === 0) {
      return;
    }

    const hasInvalidFile = selectedFiles.some(
      (file) =>
        file.type !== "application/pdf" &&
        !file.name.toLowerCase().endsWith(".pdf"),
    );

    if (hasInvalidFile) {
      error(t("tool.error"));
      return;
    }

    setFiles((current) => [
      ...current,
      ...createItems(selectedFiles),
    ]);

    revokeResultUrl();
  };

  const removeFile = (id: string) => {
    setFiles((current) =>
      current.filter((item) => item.id !== id),
    );

    revokeResultUrl();
  };

  const clearAll = () => {
    setFiles([]);
    revokeResultUrl();
  };

  const moveFile = (
    index: number,
    direction: "up" | "down",
  ) => {
    setFiles((current) => {
      const targetIndex =
        direction === "up" ? index - 1 : index + 1;

      if (
        targetIndex < 0 ||
        targetIndex >= current.length
      ) {
        return current;
      }

      const next = [...current];

      [next[index], next[targetIndex]] = [
        next[targetIndex],
        next[index],
      ];

      return next;
    });

    revokeResultUrl();
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      error(t("tool.error"));
      return;
    }

    setIsProcessing(true);
    revokeResultUrl();

    try {
      const mergedPdf = await PDFDocument.create();

      for (const item of files) {
        const bytes = await item.file.arrayBuffer();

        const sourcePdf = await PDFDocument.load(bytes, {
          ignoreEncryption: false,
        });

        const pages = await mergedPdf.copyPages(
          sourcePdf,
          sourcePdf.getPageIndices(),
        );

        for (const page of pages) {
          mergedPdf.addPage(page);
        }
      }

      const mergedBytes = await mergedPdf.save();

      const pdfBuffer = new ArrayBuffer(mergedBytes.byteLength);
      new Uint8Array(pdfBuffer).set(mergedBytes);

      const blob = new Blob([pdfBuffer], {
        type: "application/pdf",
      });

      const url = URL.createObjectURL(blob);

      setResultUrl(url);
      setResultName("merged.pdf");

      success(t("tools.pdfMerger.mergeBtn"));
    } catch (err) {
      console.error("PDF merge error:", err);
      const message = err instanceof Error && /encrypt|password|decrypt/i.test(err.message)
        ? "This PDF is password-protected or encrypted. Unlock it first, then try again."
        : err instanceof Error && /Invalid PDF|Failed to parse|PDF header/i.test(err.message)
          ? "One of the selected files is not a valid PDF."
          : "Could not merge the PDF files. Try smaller, non-password-protected PDF files.";
      error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultUrl) {
      return;
    }

    const anchor = document.createElement("a");

    anchor.href = resultUrl;
    anchor.download = resultName;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const handleReset = () => {
    setFiles([]);
    setIsProcessing(false);
    setResultName("merged.pdf");
    revokeResultUrl();
  };

  const howToSteps = [
    {
      titleKey: "tools.pdfMerger.seo.howToTitle",
      descKey: "tools.pdfMerger.seo.step1",
    },
    {
      titleKey: "tools.pdfMerger.seo.howToTitle",
      descKey: "tools.pdfMerger.seo.step2",
    },
    {
      titleKey: "tools.pdfMerger.seo.howToTitle",
      descKey: "tools.pdfMerger.seo.step3",
    },
  ];

  const faqs = [
    {
      qKey: "tools.pdfMerger.faq1Q",
      aKey: "tools.pdfMerger.faq1A",
    },
    {
      qKey: "tools.pdfMerger.faq2Q",
      aKey: "tools.pdfMerger.faq2A",
    },
    {
      qKey: "faq.general.q3",
      aKey: "faq.general.a3",
    },
  ];

  return (
    <ToolLayout
      output=""
      onReset={handleReset}
      howToSteps={howToSteps}
      faqs={faqs}
      slug="pdf-merger"
    >
      <div className="space-y-6">
        <div className="rounded-2xl border-2 border-dashed border-ink-200 bg-ink-50/50 p-8 text-center transition hover:border-brand-500 dark:border-ink-700 dark:bg-ink-900/50">
          <input
            id="pdf-merge-input"
            type="file"
            multiple
            accept="application/pdf,.pdf"
            onChange={handleFileChange}
            className="hidden"
          />

          <label
            htmlFor="pdf-merge-input"
            className="block cursor-pointer"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
              <Upload className="h-7 w-7" />
            </div>

            <h3 className="mt-4 text-lg font-semibold text-ink-900 dark:text-ink-100">
              {t("tools.pdfMerger.dropTitle")}
            </h3>

            <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
              {t("tools.pdfMerger.dropSubtitle")}
            </p>

            <span className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700">
              <Upload className="h-4 w-4" />
              {t("tools.pdfMerger.selectFiles")}
            </span>
          </label>
        </div>

        {files.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold text-ink-900 dark:text-ink-100">
                {t("tools.pdfMerger.selectedFiles", {
                  count: files.length,
                })}
              </h3>

              <button
                type="button"
                onClick={clearAll}
                className="text-sm font-medium text-red-600 hover:underline dark:text-red-400"
              >
                {t("tools.pdfMerger.clearAll")}
              </button>
            </div>

            <div className="space-y-2">
              {files.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-xl border border-ink-200 bg-white p-3 dark:border-ink-700 dark:bg-ink-900"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                    <FileText className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-800 dark:text-ink-200">
                      {index + 1}. {item.file.name}
                    </p>

                    <p className="mt-0.5 text-xs text-ink-400">
                      {(item.file.size / 1024 / 1024).toFixed(
                        2,
                      )}{" "}
                      MB
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveFile(index, "up")}
                      disabled={index === 0}
                      className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-ink-800"
                      aria-label="Move file up"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        moveFile(index, "down")
                      }
                      disabled={index === files.length - 1}
                      className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-ink-800"
                      aria-label="Move file down"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => removeFile(item.id)}
                      className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                      aria-label="Remove file"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleMerge}
              disabled={isProcessing || files.length < 2}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {t("tools.pdfMerger.merging")}
                </>
              ) : (
                <>
                  <FileText className="h-5 w-5" />
                  {t("tools.pdfMerger.mergeBtn")}
                </>
              )}
            </button>

            {files.length < 2 && (
              <p className="text-center text-xs text-ink-400">
                {t("tools.pdfMerger.minimumFiles")}
              </p>
            )}
          </div>
        )}

        {resultUrl && (
          <div className="rounded-2xl border border-success-200 bg-success-50 p-5 dark:border-success-800 dark:bg-success-900/20">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-400">
                  <FileText className="h-5 w-5" />
                </div>

                <div>
                  <p className="font-semibold text-success-800 dark:text-success-300">
                    {t("tool.pdfReady")}
                  </p>

                  <p className="text-sm text-success-700/80 dark:text-success-400/80">
                    {resultName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-success-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-success-700"
              >
                <Download className="h-4 w-4" />
                {t("tool.download")}
              </button>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
