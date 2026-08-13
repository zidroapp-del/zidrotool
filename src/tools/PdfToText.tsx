import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { Copy, Download, FileUp, Loader2 } from "lucide-react";
import { AdSlot } from "@/components/AdSlot";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  
export default function PdfToText({ slug }: { slug?: string }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file?: File) => {
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Please upload a valid PDF file.");
      return;
    }

    setBusy(true);
    setText("");
    setError("");

    try {
      const arrayBuffer = await file.arrayBuffer();

      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
      });

      const pdf = await loadingTask.promise;

      let extractedText = "";

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();

        const pageText = content.items
          .map((item) => {
            if ("str" in item) {
              return item.str;
            }
            return "";
          })
          .join(" ")
          .trim();

        extractedText += `--- Page ${pageNumber} ---\n`;

        if (pageText) {
          extractedText += `${pageText}\n\n`;
        } else {
          extractedText +=
            "[No selectable text found on this page. This PDF may be scanned as an image.]\n\n";
        }
      }

      setText(extractedText.trim());

      await pdf.destroy();
    } catch (err) {
      console.error("PDF extraction error:", err);

      setError(
        "Failed to extract text from this PDF. The file may be damaged, password-protected, or unsupported."
      );
    } finally {
      setBusy(false);
    }
  };

  const copyText = async () => {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Copy failed:", err);
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

    URL.revokeObjectURL(url);
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
              100% Client-Side Privacy: Your PDF never leaves your device.
            </span>
          </div>

          {/* Upload area */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);

              const file = e.dataTransfer.files?.[0];

              if (file) {
                handleFile(file);
              }
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

            <p className="mt-1 text-sm text-gray-500">
              or
            </p>

            <label className="mt-2 cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Browse PDF
              <input
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];

                  if (file) {
                    handleFile(file);
                  }

                                    e.currentTarget.value = "";
                }}
              />
            </label>
          </div>

          {/* Loading */}
          {busy && (
            <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              Extracting text from PDF...
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Result */}
          <textarea
            rows={12}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Extracted text will appear here..."
            className="mt-4 w-full rounded-lg border border-gray-300 p-3 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />

          {/* Actions */}
          {text && (
            <div className="mt-3 flex flex-wrap justify-end gap-2">
              <button
                onClick={copyText}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Copy className="h-4 w-4" />
                Copy Text
              </button>

              <button
                onClick={downloadTxt}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
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
