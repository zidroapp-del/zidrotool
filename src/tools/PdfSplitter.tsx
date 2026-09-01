import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import {
  Download,
  FileText,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { ToolLayout } from "@/components/ToolLayout";
import { useToast } from "@/components/Toast";

type SplitMode = "all" | "range";

interface OutputFile {
  name: string;
  url: string;
  size: number;
}

function parsePageRanges(
  input: string,
  pageCount: number,
): number[] {
  const result: number[] = [];
  const seen = new Set<number>();

  const parts = input
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  for (const part of parts) {
    if (part.includes("-")) {
      const [startText, endText] = part
        .split("-")
        .map((value) => value.trim());

      const start = Number(startText);
      const end = Number(endText);

      if (
        !Number.isInteger(start) ||
        !Number.isInteger(end) ||
        start < 1 ||
        end < 1 ||
        start > end ||
        end > pageCount
      ) {
        throw new Error("Invalid page range");
      }

      for (let page = start; page <= end; page++) {
        if (!seen.has(page)) {
          seen.add(page);
          result.push(page);
        }
      }
    } else {
      const page = Number(part);

      if (
        !Number.isInteger(page) ||
        page < 1 ||
        page > pageCount
      ) {
        throw new Error("Invalid page number");
      }

      if (!seen.has(page)) {
        seen.add(page);
        result.push(page);
      }
    }
  }

  return result;
}

export default function PdfSplitter() {
  const { t } = useTranslation();
  const { success, error } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);

  const [mode, setMode] = useState<SplitMode>("all");
  const [range, setRange] = useState("");

  const [isProcessing, setIsProcessing] = useState(false);
  const [outputs, setOutputs] = useState<OutputFile[]>([]);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFile = event.target.files?.[0];

    event.target.value = "";

    if (!selectedFile) return;

    const isPdf =
      selectedFile.type === "application/pdf" ||
      selectedFile.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      error(t("tool.error"));
      return;
    }

    try {
      const bytes = await selectedFile.arrayBuffer();

      const pdf = await PDFDocument.load(bytes, {
        ignoreEncryption: false,
      });

      setFile(selectedFile);
      setPageCount(pdf.getPageCount());
      setMode("all");
      setRange("");

      outputs.forEach((output) =>
        URL.revokeObjectURL(output.url),
      );

      setOutputs([]);
    } catch (err) {
      console.error("PDF load error:", err);
      const message = err instanceof Error && /encrypt|password|decrypt/i.test(err.message)
        ? "This PDF is password-protected or encrypted. Unlock it first, then try again."
        : "Could not open this PDF. Make sure the file is a valid, non-corrupted PDF.";
      error(message);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPageCount(0);
    setMode("all");
    setRange("");
    setIsProcessing(false);

    outputs.forEach((output) =>
      URL.revokeObjectURL(output.url),
    );

    setOutputs([]);
  };

  const handleSplit = async () => {
    if (!file) {
      error(t("tool.error"));
      return;
    }

    setIsProcessing(true);

    outputs.forEach((output) =>
      URL.revokeObjectURL(output.url),
    );

    setOutputs([]);

    try {
      const bytes = await file.arrayBuffer();

      const sourcePdf = await PDFDocument.load(bytes, {
        ignoreEncryption: false,
      });

      const totalPages = sourcePdf.getPageCount();

      if (mode === "all") {
        const newOutputs: OutputFile[] = [];

        for (let i = 0; i < totalPages; i++) {
          const singlePdf = await PDFDocument.create();

          const [page] = await singlePdf.copyPages(
            sourcePdf,
            [i],
          );

          singlePdf.addPage(page);

          const pdfBytes = await singlePdf.save();

          const pdfBuffer = new ArrayBuffer(pdfBytes.byteLength);
          new Uint8Array(pdfBuffer).set(pdfBytes);

          const blob = new Blob([pdfBuffer], {
            type: "application/pdf",
          });

          const url = URL.createObjectURL(blob);

          newOutputs.push({
            name: `page-${i + 1}.pdf`,
            url,
            size: blob.size,
          });
        }

        setOutputs(newOutputs);
        success(t("tools.pdfSplitter.splitBtn"));
      } else {
        const pageNumbers = parsePageRanges(
          range,
          totalPages,
        );

        if (pageNumbers.length === 0) {
          throw new Error("No pages selected");
        }

        const newPdf = await PDFDocument.create();

        const zeroBasedIndexes = pageNumbers.map(
          (page) => page - 1,
        );

        const copiedPages = await newPdf.copyPages(
          sourcePdf,
          zeroBasedIndexes,
        );

        copiedPages.forEach((page) => {
          newPdf.addPage(page);
        });

        const pdfBytes = await newPdf.save();

        const pdfBuffer = new ArrayBuffer(pdfBytes.byteLength);
        new Uint8Array(pdfBuffer).set(pdfBytes);

        const blob = new Blob([pdfBuffer], {
          type: "application/pdf",
        });

        const url = URL.createObjectURL(blob);

        setOutputs([
          {
            name: "split-pages.pdf",
            url,
            size: blob.size,
          },
        ]);

        success(t("tools.pdfSplitter.splitBtn"));
      }
    } catch (err) {
      console.error("PDF split error:", err);
      const message = err instanceof Error && /encrypt|password|decrypt/i.test(err.message)
        ? "This PDF is password-protected or encrypted. Unlock it first, then try again."
        : err instanceof Error && /Invalid page range/i.test(err.message)
          ? "Enter valid pages such as 1, 3, 5-7."
          : "Could not split this PDF. Try a valid, non-password-protected PDF.";
      error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadOutput = (output: OutputFile) => {
    const anchor = document.createElement("a");

    anchor.href = output.url;
    anchor.download = output.name;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const downloadAll = () => {
    outputs.forEach((output, index) => {
      window.setTimeout(() => {
        downloadOutput(output);
      }, index * 150);
    });
  };

  const howToSteps = [
    {
      titleKey: "tools.pdfSplitter.seo.howToTitle",
      descKey: "tools.pdfSplitter.seo.step1",
    },
    {
      titleKey: "tools.pdfSplitter.seo.howToTitle",
      descKey: "tools.pdfSplitter.seo.step2",
    },
    {
      titleKey: "tools.pdfSplitter.seo.howToTitle",
      descKey: "tools.pdfSplitter.seo.step3",
    },
  ];

  const faqs = [
    {
      qKey: "tools.pdfSplitter.faq1Q",
      aKey: "tools.pdfSplitter.faq1A",
    },
    {
      qKey: "faq.general.q3",
      aKey: "faq.general.a3",
    },
    {
      qKey: "faq.general.q4",
      aKey: "faq.general.a4",
    },
  ];

  return (
    <ToolLayout
      output=""
      onReset={handleReset}
      howToSteps={howToSteps}
      faqs={faqs}
      slug="pdf-splitter"
    >
      <div className="space-y-6">
        {/* Upload */}
        <div className="rounded-2xl border-2 border-dashed border-ink-200 bg-ink-50/50 p-8 text-center transition hover:border-brand-500 dark:border-ink-700 dark:bg-ink-900/50">
          <input
            id="pdf-split-input"
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleFileChange}
            className="hidden"
          />

          <label
            htmlFor="pdf-split-input"
            className="block cursor-pointer"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
              <Upload className="h-7 w-7" />
            </div>

            <h3 className="mt-4 text-lg font-semibold text-ink-900 dark:text-ink-100">
              {t("tools.pdfSplitter.dropTitle")}
            </h3>

            <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
              {t("tools.pdfSplitter.dropSubtitle")}
            </p>

            <span className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700">
              <Upload className="h-4 w-4" />
              {t("tool.input")}
            </span>
          </label>
        </div>

        {/* Selected File */}
        {file && (
          <div className="rounded-xl border border-ink-200 bg-white p-4 dark:border-ink-700 dark:bg-ink-900">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                <FileText className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink-900 dark:text-ink-100">
                  {file.name}
                </p>

                <p className="mt-1 text-xs text-ink-400">
                  {pageCount} {t("tools.pdfSplitter.pages")} •{" "}
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="rounded-lg p-2 text-ink-400 hover:bg-ink-100 hover:text-red-500 dark:hover:bg-ink-800"
                aria-label="Remove file"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Options */}
        {file && (
          <div className="space-y-4">
            <h3 className="font-semibold text-ink-900 dark:text-ink-100">
              {t("tools.pdfSplitter.optionsTitle")}
            </h3>

            <button
              type="button"
              onClick={() => setMode("all")}
              className={`w-full rounded-xl border p-4 text-left transition ${
                mode === "all"
                  ? "border-brand-500 bg-brand-50 dark:border-brand-500 dark:bg-brand-900/20"
                  : "border-ink-200 bg-white hover:border-ink-300 dark:border-ink-700 dark:bg-ink-900"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 h-4 w-4 rounded-full border-2 ${
                    mode === "all"
                      ? "border-brand-600 bg-brand-600"
                      : "border-ink-300 dark:border-ink-600"
                  }`}
                />

                <div>
                  <p className="font-medium text-ink-900 dark:text-ink-100">
                    {t("tools.pdfSplitter.splitAll")}
                  </p>

                  <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                    {t("tools.pdfSplitter.splitAllDesc")}
                  </p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMode("range")}
              className={`w-full rounded-xl border p-4 text-left transition ${
                mode === "range"
                  ? "border-brand-500 bg-brand-50 dark:border-brand-500 dark:bg-brand-900/20"
                  : "border-ink-200 bg-white hover:border-ink-300 dark:border-ink-700 dark:bg-ink-900"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 h-4 w-4 rounded-full border-2 ${
                    mode === "range"
                      ? "border-brand-600 bg-brand-600"
                      : "border-ink-300 dark:border-ink-600"
                  }`}
                />

                <div className="flex-1">
                  <p className="font-medium text-ink-900 dark:text-ink-100">
                    {t("tools.pdfSplitter.customRange")}
                  </p>

                  <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                    {t("tools.pdfSplitter.customRangeDesc")}
                  </p>
                </div>
              </div>
            </button>

            {mode === "range" && (
              <div>
                <label
                  htmlFor="pdf-page-range"
                  className="mb-2 block text-sm font-medium text-ink-700 dark:text-ink-300"
                >
                  {t("tools.pdfSplitter.customRange")}
                </label>

                <input
                  id="pdf-page-range"
                  type="text"
                  value={range}
                  onChange={(event) =>
                    setRange(event.target.value)
                  }
                  placeholder="1-3, 5, 8-10"
                  className="input w-full"
                  inputMode="text"
                />

                <p className="mt-2 text-xs text-ink-400">
                  Example: 1-3, 5, 8-10
                </p>
              </div>
            )}

            {/* Split Button */}
            <button
              type="button"
              onClick={handleSplit}
              disabled={
                isProcessing ||
                (mode === "range" && !range.trim())
              }
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {t("tools.pdfSplitter.processing")}
                </>
              ) : (
                <>
                  <FileText className="h-5 w-5" />
                  {t("tools.pdfSplitter.splitBtn")}
                </>
              )}
            </button>
          </div>
        )}

        {/* Results */}
        {outputs.length > 0 && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold text-ink-900 dark:text-ink-100">
                  {outputs.length} PDF
                  {outputs.length !== 1 ? "s" : ""} ready
                </h3>

                <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                  Your files have been generated locally.
                </p>
              </div>

              {outputs.length > 1 && (
                <button
                  type="button"
                  onClick={downloadAll}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  <Download className="h-4 w-4" />
                  {t("tool.download")} All
                </button>
              )}
            </div>

            <div className="space-y-2">
              {outputs.map((output) => (
                <div
                  key={output.name}
                  className="flex items-center gap-3 rounded-xl border border-success-200 bg-success-50 p-3 dark:border-success-800 dark:bg-success-900/20"
                >
                  <FileText className="h-5 w-5 shrink-0 text-success-700 dark:text-success-400" />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-success-800 dark:text-success-300">
                      {output.name}
                    </p>

                    <p className="text-xs text-success-700/70 dark:text-success-400/70">
                      {(output.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => downloadOutput(output)}
                    className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-success-600 px-3 py-2 text-xs font-semibold text-white hover:bg-success-700"
                  >
                    <Download className="h-4 w-4" />
                    {t("tool.download")}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}