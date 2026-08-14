import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { Copy, Download, FileUp, Loader2, Check } from "lucide-react";
import { AdSlot } from "@/components/AdSlot";

// إعداد الـ Worker بطريقة موثوقة تمنع خطأ Fake Worker
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
}

export default function PdfToText({ slug }: { slug?: string }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file?: File) => {
    if (!file) return;

    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      setError("Please upload a valid PDF file.");
      return;
    }

    setBusy(true);
    setProgress(0);
    setText("");
    setError("");

    try {
      const arrayBuffer = await file.arrayBuffer();

      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
      });

      const pdf = await loadingTask.promise;
      let extractedPages: string[] = [];

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();

        // تحسين استخراج النصوص وحفظ الفواصل
        const pageText = content.items
          .map((item: any) => item.str || "")
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();

        let pageFormatted = `--- Page ${pageNumber} ---\n\n`;
        if (pageText) {
          pageFormatted += `${pageText}\n\n`;
        } else {
          pageFormatted +=
            "[No selectable text found on this page. This page may be a scanned image.]\n\n";
        }

        extractedPages.push(pageFormatted);

        // تحديث نسبة التقدم للـ UI
        setProgress(Math.round((pageNumber / pdf.numPages) * 100));
      }

      setText(extractedPages.join("").trim());
      await pdf.destroy();
    } catch (err: any) {
      console.error("PDF extraction error:", err);
      const errorMessage =
        err?.message ||
        err?.name ||
        "Unknown error while extracting text.";

      setError(`PDF Error: ${errorMessage}`);
      setText("");
    } finally {
      setBusy(false);
      setProgress(0);
    }
  };

  const copyText = async () => {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
      setError("Could not copy the text. Please copy it manually.");
    }
  };

  const downloadTxt = () => {
    if (!text) return;

    const blob = new Blob([text], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${slug || "extracted-pdf-text"}.txt`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
  };

  return (
    <div className="min-h-[60vh] flex items-start lg:items-center">
      <div className="mx-auto w-full max-w-3xl py-8">
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-lg">
          <h2 className="mb-3 text-2xl font-semibold text-gray-800">
            PDF to Text
          </h2>

          <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-sm text-green-700">
            <span>🔒</span>
            <span>
              Your PDF is processed securely in your browser.
            </span>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => {
              setIsDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);

              const file = e.dataTransfer.files?.[0];
              if (file) handleFile(file);
            }}
            className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
              isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 bg-gray-50 hover:bg-gray-100"
            }`}
          >
            <FileUp className="mb-2 h-10 w-10 text-gray-400" />

            <p className="text-center text-sm font-medium text-gray-700">
              Drag and drop your PDF here
            </p>

            <p className="mt-1 text-sm text-gray-500">or</p>

            <label className="mt-3 cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700">
              Browse PDF
              <input
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                  e.currentTarget.value = "";
                }}
              />
            </label>
          </div>

          {busy && (
            <div className="mt-4 flex flex-col gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Extracting text from PDF...
                </span>
                <span className="font-semibold">{progress}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-blue-200 overflow-hidden">
                <div
                  className="h-1.5 rounded-full bg-blue-600 transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <textarea
            rows={12}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Extracted text will appear here..."
            className="mt-4 w-full rounded-lg border border-gray-300 p-3 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />

          {text && (
            <div className="mt-3 flex flex-wrap justify-end gap-2">
              <button
                onClick={copyText}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy Text
                  </>
                )}
              </button>

              <button
                onClick={downloadTxt}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                Download TXT
              </button>
            </div>
          )}

          <div className="mt-6">
            <AdSlot variant="inline" />
          </div>
        </div>
      </div>
    </div>
  );
}