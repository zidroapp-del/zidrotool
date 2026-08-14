import { useEffect, useRef, useState, useCallback } from "react";
import {
  Mic,
  StopCircle,
  Copy,
  Download,
  Trash2,
  Check,
  AlertCircle,
  FileText,
  Radio,
} from "lucide-react";
import { AdSlot } from "@/components/AdSlot";

export default function SpeechToText({ slug }: { slug?: string }) {
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [finalText, setFinalText] = useState("");
  const [interim, setInterim] = useState("");
  const [lang, setLang] = useState("ar-DZ");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const recognitionRef = useRef<any>(null);
  const shouldListenRef = useRef(false);
  const restartTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Stop current recognition instance safely
  const stopEngine = useCallback(() => {
    shouldListenRef.current = false;
    setListening(false);
    setInterim("");

    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore fallback if already stopped
      }
    }
  }, []);

  // Initialize Web Speech Recognition Engine
  useEffect(() => {
    if (typeof window === "undefined") return;

    const win = window as any;
    const SpeechRecognition =
      win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    setSupported(true);
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setError("");
      setListening(true);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0]?.transcript || "";

        if (result.isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript.trim()) {
        setFinalText((previous) =>
          previous
            ? `${previous.trim()} ${finalTranscript.trim()}`
            : finalTranscript.trim()
        );
      }

      setInterim(interimTranscript);
    };

    recognition.onerror = (event: any) => {
      console.warn("Speech recognition event error:", event.error);

      // الأخطاء المؤقتة: السكوت، انقطاع سيرفر متصفح كروم المؤقت، أو إلغاء الجلسة
      // نترك أداء إعادة الاتصال لـ onend دون إيقاف التسجيل
      if (
        event.error === "no-speech" ||
        event.error === "network" ||
        event.error === "aborted"
      ) {
        return;
      }

      if (event.error === "not-allowed") {
        setError("تم رفض إذن استخدام الميكروفون. يرجى السماح بالوصول للميكروفون من إعدادات المتصفح.");
        shouldListenRef.current = false;
        setListening(false);
      } else if (event.error === "audio-capture") {
        setError("لم يتم العثور على ميكروفون. يرجى توصيل ميكروفون والتأكد من عمله.");
        shouldListenRef.current = false;
        setListening(false);
      } else {
        setError("حدث خطأ أثناء التعرف على الصوت. جاري إعادة المحاولة...");
      }
    };

    // Auto-Restart Mechanism On End Event (Resilient Loop)
    recognition.onend = () => {
      setInterim("");

      // إذا كان المستخدم لا يزال يريد التسجيل، نعيد التشغيل فوراً
      if (shouldListenRef.current) {
        if (restartTimerRef.current) clearTimeout(restartTimerRef.current);

        restartTimerRef.current = setTimeout(() => {
          if (shouldListenRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (err: any) {
              console.warn("Initial auto-restart failed, trying fallback retry:", err);
              // محاولة ثانية بعد 400ms في حال كان المحرك بحاجة لوقت أطول لتفريغ الذاكرة
              setTimeout(() => {
                if (shouldListenRef.current && recognitionRef.current) {
                  try {
                    recognitionRef.current.start();
                  } catch (retryErr) {
                    console.error("Fallback auto-restart error:", retryErr);
                  }
                }
              }, 400);
            }
          }
        }, 250);
      } else {
        setListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      shouldListenRef.current = false;
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      try {
        recognition.abort();
      } catch {
        // Safe fallback
      }
      recognitionRef.current = null;
    };
  }, [lang]);

  // Start Recognition Handler
  const start = useCallback(() => {
    if (!recognitionRef.current) return;

    setError("");
    setInterim("");
    shouldListenRef.current = true;

    try {
      recognitionRef.current.lang = lang;
      recognitionRef.current.start();
    } catch (err: any) {
      if (err.name === "InvalidStateError") {
        setListening(true);
      } else {
        console.error("Speech start error:", err);
        shouldListenRef.current = false;
        setListening(false);
        setError("تعذر بدء التسجيل الصوتي. يرجى المحاولة مرة أخرى.");
      }
    }
  }, [lang]);

  const clearAll = () => {
    setFinalText("");
    setInterim("");
    setError("");
  };

  const copyText = async () => {
    const text = finalText.trim();
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy text:", error);
    }
  };

  // Safe TXT Download with UTF-8 BOM Fix for Arabic Text
  const downloadTxt = () => {
    const text = finalText.trim();
    if (!text) return;

    const blob = new Blob(["\uFEFF" + text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${slug || "speech-to-text"}.txt`;

    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleLangChange = (newLang: string) => {
    stopEngine();
    setLang(newLang);
  };

  const wordCount = finalText.trim() ? finalText.trim().split(/\s+/).length : 0;
  const charCount = finalText.length;
  const isRtl = lang.startsWith("ar");

  return (
    <div className="flex min-h-[60vh] items-start">
      <div className="mx-auto w-full max-w-3xl py-8">
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-lg dark:border-ink-800 dark:bg-ink-900">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
              تحويل الصوت إلى نص (Speech to Text)
            </h2>

            {listening && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-600 dark:bg-red-950/60 dark:text-red-400">
                <Radio className="h-3.5 w-3.5 animate-pulse" />
                جاري الاستماع الآن
              </span>
            )}
          </div>

          <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-sm text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300">
            <span>🔒 يتم معالجة صوتك بأمان داخل متصفحك مباشرة.</span>
          </div>

          {!supported && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 shrink-0" />
              خاصية التعرف على الصوت غير مدعومة في هذا المتصفح. يرجى تجربة Google Chrome أو Microsoft Edge.
            </div>
          )}

          {supported && (
            <div className="space-y-4">
              {/* Controls Header */}
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  لغة التحدث:
                </label>

                <select
                  value={lang}
                  onChange={(e) => handleLangChange(e.target.value)}
                  disabled={listening}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 focus:border-blue-500 focus:outline-none dark:border-ink-700 dark:bg-ink-800 dark:text-white"
                >
                  <option value="ar-DZ">العربية (الجزائر)</option>
                  <option value="ar-SA">العربية (السعودية)</option>
                  <option value="ar-EG">العربية (مصر)</option>
                  <option value="fr-FR">Français (فرنسا)</option>
                  <option value="en-US">English (US)</option>
                  <option value="en-GB">English (UK)</option>
                  <option value="de-DE">Deutsch (ألمانيا)</option>
                  <option value="es-ES">Español (إسبانيا)</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={listening ? stopEngine : start}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 font-medium text-white transition-all ${
                    listening
                      ? "bg-red-600 hover:bg-red-700 shadow-md shadow-red-200 dark:shadow-none"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {listening ? (
                    <>
                      <StopCircle className="h-4 w-4" />
                      إيقاف الاستماع
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4" />
                      بدء الاستماع
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={clearAll}
                  disabled={!finalText && !interim}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-ink-800 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  مسح النص
                </button>

                <div className="mr-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={copyText}
                    disabled={!finalText.trim()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-ink-700 dark:text-gray-200 dark:hover:bg-ink-800 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="text-green-600">تم النسخ</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        نسخ
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={downloadTxt}
                    disabled={!finalText.trim()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-ink-700 dark:text-gray-200 dark:hover:bg-ink-800 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    TXT
                  </button>
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
                  {error}
                </div>
              )}

              {/* Text Area Input */}
              <div className="relative">
                <textarea
                  value={finalText}
                  onChange={(e) => setFinalText(e.target.value)}
                  rows={10}
                  placeholder={
                    listening
                      ? "جاري الاستماع... ابدأ بالتحدث الآن..."
                      : "انقر على 'بدء الاستماع' ثم ابدأ بالتحدث..."
                  }
                  className="w-full rounded-lg border border-gray-300 p-3 text-base text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-ink-700 dark:bg-ink-800 dark:text-white transition-all"
                  dir={isRtl ? "rtl" : "ltr"}
                />

                {/* Interim Live Stream Indicator */}
                {interim && (
                  <div className="mt-2 flex items-center gap-2 rounded-md bg-blue-50 p-2.5 text-sm text-blue-700 dark:bg-ink-800 dark:text-blue-300 border border-blue-100 dark:border-ink-700">
                    <Radio className="h-4 w-4 shrink-0 animate-spin text-blue-500" />
                    <span className="font-medium">جاري التعرف: </span>
                    <span className="italic">{interim}</span>
                  </div>
                )}
              </div>

              {/* Text Stats Bar */}
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
                <span className="flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  الكلمات: {wordCount} | الأحرف: {charCount}
                </span>
              </div>

              <div className="mt-6">
                <AdSlot variant="inline" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}