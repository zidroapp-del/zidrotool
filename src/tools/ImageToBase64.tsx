import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Upload, Copy, Check, X } from "lucide-react";
import { copyToClipboard } from "@/lib/utils";

export default function ImageToBase64() {
  const { t } = useTranslation();
  const [base64, setBase64] = useState("");
  const [preview, setPreview] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const handleFile = (file: File) => {
    setError("");
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setBase64(result);
      setPreview(result);
    };
    reader.onerror = () => setError("Failed to read the file.");
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleCopy = async () => {
    if (await copyToClipboard(base64)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const clear = () => {
    setBase64("");
    setPreview("");
    setCopied(false);
    setError("");
  };

  return (
    <div>
      {!base64 && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-ink-300 bg-ink-50 py-16 text-center dark:border-ink-700 dark:bg-ink-950/50"
        >
          <Upload className="h-10 w-10 text-ink-400" />
          <p className="mt-3 text-sm text-ink-600 dark:text-ink-400">
            Drag and drop an image here, or
          </p>
          <label className="mt-3 cursor-pointer">
            <span className="btn-primary">Choose File</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </label>
          {error && <p className="mt-3 text-sm text-danger">{error}</p>}
        </div>
      )}

      {base64 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <img src={preview} alt="Preview" className="max-h-40 rounded-lg border border-ink-200 dark:border-ink-700" />
            <button onClick={clear} className="btn-secondary btn-sm">
              <X className="h-4 w-4" />
              {t("tool.clear")}
            </button>
          </div>
          <div className="flex items-center justify-between">
            <label className="label">Base64 Data URI</label>
            <button onClick={handleCopy} className="flex items-center gap-1 text-xs font-medium text-ink-400 hover:text-brand-600 dark:text-ink-500">
              {copied ? <Check className="h-3.5 w-3.5 text-success-700" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? t("tool.copied") : t("tool.copy")}
            </button>
          </div>
          <textarea
            value={base64}
            readOnly
            className="input mt-1 min-h-[200px] break-all font-mono text-xs"
            spellCheck={false}
          />
          <p className="mt-2 text-xs text-ink-400">
            Size: {(base64.length / 1024).toFixed(1)} KB
          </p>
        </div>
      )}
    </div>
  );
}
