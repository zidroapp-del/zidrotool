import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { Copy, Download, FileUp } from "lucide-react";
import { AdSlot } from "@/components/AdSlot";

// ضبط رابط الـ Worker ديناميكياً حسب الإصدار المحمل لضمان التوافق 100%
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function PdfToText({ slug }: { slug?: string }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = async (file?: File) => {
    if (!file || file.type !== "application/pdf") {
      alert("Please upload a valid PDF file.");
      return;
    }

    setBusy(true);
    setText("");
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      let out = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        try {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const items = Array.isArray(content?.items) ? content.items : [];
          const pageText = items.map((it: any) => it?.str || "").join(" ");
          
          out += `--- Page ${i} ---\n` + pageText + "\n\n";
        } catch (pageErr) {
          console.error(`Error extracting page ${i}:`, pageErr);
          out += `--- Page ${i} ---\n[Error extracting this page]\n\n`;
        }
      }

      setText(out.trim() || "(No readable text found in this PDF. It might contain scanned images instead)");
    } catch (e) {
      console.error("PdfToText extraction error:", e);
      setText("Failed to extract text from PDF. Ensure the file is not password-protected.");
    } finally {
      setBusy(false);
    }
  };

  const copyText = async () => {
    if (!text) return;
    try { await navigator.clipboard.writeText(text); } catch (e) {}
  };

  const downloadTxt = () => {
    if (!text) return;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug || "extracted-pdf-text"}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-[60vh] flex items-start lg:items-center">
      <div className="mx-auto w-full max-w-3xl py-8">
        <div className="rounded-xl bg-white p-6 shadow-lg border border-gray-100">
          <h2 className="text-2xl font-semibold mb-3 text-gray-800">PDF to Text</h2>

          <div className="mb-4 inline-flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
            <span className="text-base">🔒</span>
            <span>100% Client-Side Privacy: Your PDF never leaves your device.</span>
          </div>

          {/* Drag and Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
            }}
            className={`mb-4 flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
              isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50 hover:bg-gray-100"
            }`}
          >
            <FileUp className="h-10 w-10 text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-700">Drag & drop your PDF file here, or</p>
            <label className="mt-2 cursor-pointer text-sm font-semibold text-blue-600 hover:text-blue-700">
              Browse File
              <input
                className="hidden"
                type="file"
                accept="application/pdf"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </label>
          </div>

          {busy && (
            <div className="flex items-center gap-2 text-sm text-blue-600 mb-3">
              <span className="animate-spin">⏳</span> Processing PDF pages...
            </div>
          )}

          {/* Textarea output */}
          <textarea
            rows={10}
            className="w-full rounded-lg border border-gray-300 p-3 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={text}
            placeholder="Extracted text will appear here..."
            onChange={(e) => setText(e.target.value)}
          />

          {/* Quick Actions */}
          {text && (
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                onClick={copyText}
                className="px-3 py-1.5 text-sm text-gray-700 hover:text-black border border-gray-300 rounded-lg inline-flex items-center gap-1.5"
              >
                <Copy className="h-4 w-4" /> Copy Text
              </button>
              <button
                onClick={downloadTxt}
                className="px-3 py-1.5 text-sm text-gray-700 hover:text-black border border-gray-300 rounded-lg inline-flex items-center gap-1.5"
              >
                <Download className="h-4 w-4" /> Download .txt
              </button>
            </div>
          )}

          {/* Information & Ad Sections */}
          <div className="mt-6">
            <div className="my-6 min-h-[90px] border border-dashed rounded flex items-center justify-center text-xs text-muted-foreground">Ad Space</div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <h3 className="font-semibold text-gray-900">How it works</h3>
                <ol className="mt-2 list-decimal list-inside text-sm text-gray-600 space-y-1">
                  <li>Upload or drop your PDF document.</li>
                  <li>Text is extracted instantly page-by-page.</li>
                  <li>Copy or save as a plain `.txt` file.</li>
                </ol>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Key features</h3>
                <ul className="mt-2 text-sm text-gray-600 space-y-1">
                  <li>Page-separated structured text</li>
                  <li>Drag-and-drop file support</li>
                  <li>No file size limits or server uploads</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">FAQ</h3>
                <div className="mt-2 text-sm text-gray-600">
                  <p><strong>Q:</strong> Works with scanned PDFs?<br/><strong>A:</strong> Only PDFs containing selectable text. Use OCR for scanned images.</p>
                </div>
              </div>
            </div>

            <div className="mt-6"><AdSlot variant="inline" /></div>
          </div>
        </div>
      </div>
    </div>
  );
}