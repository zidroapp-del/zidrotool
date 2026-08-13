import { useEffect, useRef, useState } from "react";
import { Mic, StopCircle, Copy, Download } from "lucide-react";
import { AdSlot } from "@/components/AdSlot";

export default function SpeechToText({ slug }: { slug?: string }) {
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [finalText, setFinalText] = useState("");
  const [interim, setInterim] = useState("");
  const [lang, setLang] = useState("ar-DZ");
  const [error, setError] = useState("");

  const recognitionRef = useRef<any>(null);
  const listeningRef = useRef(false);

  useEffect(() => {
    listeningRef.current = listening;
  }, [listening]);

  useEffect(() => {
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

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
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
            ? `${previous} ${finalTranscript.trim()}`
            : finalTranscript.trim()
        );
      }

      setInterim(interimTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);

      if (event.error === "not-allowed") {
        setError(
          "Microphone permission was denied. Please allow microphone access."
        );
        setListening(false);
      } else if (event.error === "no-speech") {
        // لا نوقف الأداة بسبب عدم وجود كلام مؤقتًا
      } else if (event.error === "audio-capture") {
        setError(
          "No microphone was found. Please connect or enable your microphone."
        );
        setListening(false);
      } else if (event.error === "network") {
        setError(
          "Speech recognition requires a network connection in this browser."
        );
        setListening(false);
      } else {
        setError(`Speech recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      if (listeningRef.current) {
        try {
          recognition.start();
        } catch (error) {
          console.warn("Could not restart speech recognition:", error);
        }
      } else {
        setListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      listeningRef.current = false;

      try {
        recognition.stop();
      } catch {
        // تجاهل إذا كان متوقفًا أصلًا
      }

      recognitionRef.current = null;
    };
  }, [lang]);

  const start = () => {
    const recognition = recognitionRef.current;

    if (!recognition || listeningRef.current) return;

    setError("");
    setInterim("");

    try {
      recognition.lang = lang;
      listeningRef.current = true;
      recognition.start();
    } catch (error) {
      console.error("Failed to start speech recognition:", error);
      listeningRef.current = false;
      setListening(false);
      setError("Could not start speech recognition. Please try again.");
    }
  };

  const stop = () => {
    listeningRef.current = false;
    setListening(false);
    setInterim("");

    try {
      recognitionRef.current?.stop();
    } catch {
      // تجاهل إذا كان متوقفًا أصلًا
    }
  };

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
    } catch (error) {
      console.error("Failed to copy text:", error);
    }
  };

  const downloadTxt = () => {
    const text = finalText.trim();

    if (!text) return;

    const blob = new Blob([text], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${slug || "speech-to-text"}.txt`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-[60vh] items-start">
      <div className="mx-auto w-full max-w-3xl py-8">
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-lg dark:border-ink-800 dark:bg-ink-900">
          <h2 className="mb-3 text-2xl font-semibold text-gray-800 dark:text-white">
            Speech to Text
          </h2>

          <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-sm text-green-700">
            <span>🔒 Your audio is processed through your browser.</span>
          </div>

          {!supported && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Speech recognition is not supported in this browser.
              Please try Google Chrome or Microsoft Edge.
            </div>
          )}

          {supported && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Speaking Language:
                </label>

                <select
                  value={lang}
                  onChange={(e) => {
                    stop();
                    setLang(e.target.value);
                  }}
                  disabled={listening}
                  className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 dark:bg-ink-800 dark:text-white"
                >
                  <option value="ar-DZ">العربية (Algeria)</option>
                  <option value="ar-SA">العربية (Saudi Arabia)</option>
                  <option value="ar-EG">العربية (Egypt)</option>
                  <option value="fr-FR">Français</option>
                  <option value="en-US">English (US)</option>
                  <option value="en-GB">English (UK)</option>
                  <option value="de-DE">Deutsch</option>
                  <option value="es-ES">Español</option>
                  <option value="it-IT">Italiano</option>
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={start}
                  disabled={listening}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 font-medium text-white transition-colors ${
                    listening
                      ? "cursor-not-allowed bg-gray-400"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  <Mic className="h-4 w-4" />
                  {listening ? "Listening..." : "Start Listening"}
                </button>

                <button
                  type="button"
                  onClick={stop}
                  disabled={!listening}
                  className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 transition-colors ${
                    !listening
                      ? "cursor-not-allowed opacity-50"
                      : "border-red-500 text-red-600 hover:bg-red-50"
                  }`}
                >
                  <StopCircle className="h-4 w-4" />
                  Stop
                </button>

                <button
                  type="button"
                  onClick={clearAll}
                  className="rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-ink-800"
                >
                  Clear
                </button>

                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={copyText}
                    disabled={!finalText.trim()}
                    className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-200"
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </button>

                  <button
                    type="button"
                    onClick={downloadTxt}
                    disabled={!finalText.trim()}
                    className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-200"
                  >
                    <Download className="h-4 w-4" />
                    TXT
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <textarea
                value={`${finalText}${interim ? `${finalText ? " " : ""}${interim}` : ""}`}
                onChange={(e) => {
                  setFinalText(e.target.value);
                  setInterim("");
                }}
                rows={10}
                placeholder={
                  listening
                    ? "Listening... Start speaking..."
                    : "Click Start Listening and begin speaking..."
                }
                className="w-full rounded-lg border border-gray-300 p-3 text-base text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-ink-800 dark:text-white"
                dir={lang.startsWith("ar") ? "rtl" : "ltr"}
              />

              {interim && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Recognizing: {interim}
                </div>
              )}

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