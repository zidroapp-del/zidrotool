import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Mic,
  Square,
  Copy,
  Check,
  Globe,
  Trash2,
  Volume2,
  Sparkles,
  Loader2,
} from "lucide-react";

// خريطة اللغات المدعومة للتعرف الصوتي
const LANGUAGES = [
  { code: "ar-SA", name: "العربية", flag: "🇸🇦" },
  { code: "en-US", name: "English (US)", flag: "🇺🇸" },
  { code: "fr-FR", name: "Français", flag: "🇫🇷" },
  { code: "de-DE", name: "Deutsch", flag: "🇩🇪" },
  { code: "es-ES", name: "Español", flag: "🇪🇸" },
];

export default function SpeechToText() {
  const [searchParams] = useSearchParams();
  const urlLang = searchParams.get("lang");

  // الحالات الأساسية
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [selectedLang, setSelectedLang] = useState("en-US");
  const [copied, setCopied] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState("");

  const recognitionRef = useRef<any>(null);

  // 1. تحديد اللغة تلقائياً بناءً على معيار ?lang= المعطى في URL
  useEffect(() => {
    if (urlLang) {
      const lower = urlLang.toLowerCase();
      if (lower === "fr") setSelectedLang("fr-FR");
      else if (lower === "en") setSelectedLang("en-US");
      else if (lower === "ar") setSelectedLang("ar-SA");
      else if (lower === "de") setSelectedLang("de-DE");
      else if (lower === "es") setSelectedLang("es-ES");
    }
  }, [urlLang]);

  // 2. إعداد Web Speech API
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLang;

      recognition.onresult = (event: any) => {
        let currentInterim = "";
        let finalChunk = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptChunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalChunk += transcriptChunk + " ";
          } else {
            currentInterim += transcriptChunk;
          }
        }

        if (finalChunk) {
          setTranscript((prev) => prev + finalChunk);
        }
        setInterimTranscript(currentInterim);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript("");
      };

      recognitionRef.current = recognition;
    }
  }, [selectedLang]);

  // تشغيل / إيقاف التسجيل
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.lang = selectedLang;
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // نسخ النص
  const handleCopy = () => {
    if (!transcript) return;
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // مسح النص
  const handleClear = () => {
    setTranscript("");
    setInterimTranscript("");
    setSummary("");
  };

  // نطق النص (Text to Speech)
  const handleSpeak = () => {
    if (!transcript || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(transcript);
    utterance.lang = selectedLang;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-gray-900">
          Speech to Text Converter
        </h1>
        <p className="text-gray-500">
          Convert your spoken voice into clean, accurate written text in real-time.
        </p>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        {/* Language Selector */}
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-gray-400" />
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            disabled={isListening}
            className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSpeak}
            disabled={!transcript}
            className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition-colors"
            title="Read Aloud"
          >
            <Volume2 className="w-5 h-5" />
          </button>
          <button
            onClick={handleCopy}
            disabled={!transcript}
            className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition-colors"
            title="Copy Text"
          >
            {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
          </button>
          <button
            onClick={handleClear}
            disabled={!transcript && !interimTranscript}
            className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 transition-colors"
            title="Clear Text"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Recording Area */}
      <div className="relative min-h-[250px] bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
        <div className="prose max-w-none text-gray-800 text-lg leading-relaxed space-y-2">
          {transcript || interimTranscript ? (
            <p>
              <span>{transcript}</span>
              <span className="text-gray-400 italic">{interimTranscript}</span>
            </p>
          ) : (
            <p className="text-gray-400 italic">
              Click the microphone button below and start speaking...
            </p>
          )}
        </div>

        {/* Record Button */}
        <div className="flex justify-center pt-8">
          <button
            onClick={toggleListening}
            className={`relative inline-flex items-center justify-center p-5 rounded-full font-bold text-white transition-all shadow-lg ${
              isListening
                ? "bg-red-600 hover:bg-red-700 ring-4 ring-red-200 animate-pulse"
                : "bg-blue-600 hover:bg-blue-700 hover:scale-105"
            }`}
          >
            {isListening ? (
              <Square className="w-6 h-6 fill-current" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}