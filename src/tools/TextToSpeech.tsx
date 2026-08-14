import { useEffect, useState, useRef } from "react";
import {
  Copy,
  Volume2,
  Square,
  Pause,
  Play,
  Check,
  Trash2,
  Download,
  Key,
  Sparkles,
  Loader2,
} from "lucide-react";
import { AdSlot } from "@/components/AdSlot";
import { TRANSLATIONS } from "@/lib/translations";

export default function TextToSpeech({ slug }: { slug?: string }) {
  // Mode Selection
  const [engine, setEngine] = useState<"browser" | "elevenlabs">("browser");
  const [uiLang, setUiLang] = useState("ar");

  // Browser Speech State
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState("");
  const [selectedLang, setSelectedLang] = useState("ar-SA"); // Default: Arabic
  const t = (key: string) => TRANSLATIONS[uiLang]?.[key] || TRANSLATIONS['en']?.[key] || key;
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);

  // ElevenLabs State
  const [apiKey, setApiKey] = useState("");
  const [elevenVoice, setElevenVoice] = useState("21m00Tcm4TlvDq8ikWAM");

  // Playback & General State
  const [text, setText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Load ElevenLabs API Key from LocalStorage
  useEffect(() => {
    const savedKey = localStorage.getItem("elevenlabs_key");
    if (savedKey) setApiKey(savedKey);
  }, []);

  const handleApiKeyChange = (key: string) => {
    setApiKey(key);
    localStorage.setItem("elevenlabs_key", key);
  };

  // Browser Voices Setup with Async Fallback Fix
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const updateVoices = () => {
      const availVoices = window.speechSynthesis.getVoices();
      if (availVoices && availVoices.length > 0) {
        setVoices(availVoices);
      }
    };

    updateVoices();

    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    // Stop any active speech synthesis when UI language changes
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, [uiLang]);

  // Filter available voices strictly based on current language prefix (e.g., 'ar', 'en', 'fr')
  const currentBaseLang = selectedLang.split("-")[0].toLowerCase();
  const filteredVoices = voices.filter((voice) =>
    voice.lang.toLowerCase().startsWith(currentBaseLang)
  );

  // Auto-sync selected voice URI when language changes
  useEffect(() => {
    if (filteredVoices.length > 0) {
      const exists = filteredVoices.some((v) => v.voiceURI === selectedVoiceURI);
      if (!exists) {
        setSelectedVoiceURI(filteredVoices[0].voiceURI);
      }
    } else {
      setSelectedVoiceURI("");
    }
  }, [selectedLang, voices]);

  const handleUiLangChange = (lang: string) => {
    // Stop speech engines before switching UI language
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setUiLang(lang);
  };

  // Record Browser Audio Stream for Download
  const startBrowserRecording = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      const dest = audioCtx.createMediaStreamDestination();
      const recorder = new MediaRecorder(dest.stream);

      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(URL.createObjectURL(blob));
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
    } catch (e) {
      console.warn("Direct audio recording not supported by browser environment.");
    }
  };

  // ElevenLabs TTS Synthesis Handler
  const handleElevenLabsSpeak = async () => {
    if (!apiKey.trim()) {
      setError("يرجى إدخال مفتاح ElevenLabs API أولاً.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${elevenVoice}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": apiKey.trim(),
          },
          body: JSON.stringify({
            text: text,
            model_id: "eleven_multilingual_v2",
            voice_settings: { stability: 0.5, similarity_boost: 0.75 },
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.detail?.message || "فشل في توليد الصوت من ElevenLabs.");
      }

      const blob = await response.blob();
      if (audioUrl) URL.revokeObjectURL(audioUrl);

      const newAudioUrl = URL.createObjectURL(blob);
      setAudioUrl(newAudioUrl);

      if (audioRef.current) {
        audioRef.current.src = newAudioUrl;
        audioRef.current.play();
        setIsSpeaking(true);
        setIsPaused(false);
      }
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء الاتصال بـ ElevenLabs API.");
    } finally {
      setLoading(false);
    }
  };

  // Main Speech Handler
  const speak = () => {
    if (!text.trim()) return;

    if (engine === "elevenlabs") {
      handleElevenLabsSpeak();
      return;
    }

    // Resume speech if currently paused
    if (isPaused && "speechSynthesis" in window) {
      window.speechSynthesis.resume();
      setIsSpeaking(true);
      setIsPaused(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    utterance.rate = rate;
    utterance.pitch = pitch;

    // 1. Explicitly assign the language tag
    utterance.lang = selectedLang;

    // 2. Strict Voice Validation Fix:
    // Only bind utterance.voice if it matchingly starts with current selected language
    const selectedVoice = voices.find((v) => v.voiceURI === selectedVoiceURI);
    if (selectedVoice && selectedVoice.lang.toLowerCase().startsWith(currentBaseLang)) {
      utterance.voice = selectedVoice;
    } else {
      // Force null so browser uses native engine matching `selectedLang`
      utterance.voice = null;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      startBrowserRecording();
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      utteranceRef.current = null;
    };

    utterance.onerror = (e) => {
      console.error("Speech Synthesis Error:", e);
      setIsSpeaking(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  // Pause Audio Playback
  const pause = () => {
    if (engine === "browser" && "speechSynthesis" in window) {
      window.speechSynthesis.pause();
      setIsSpeaking(false);
      setIsPaused(true);
    } else if (audioRef.current) {
      audioRef.current.pause();
      setIsSpeaking(false);
      setIsPaused(true);
    }
  };

  // Stop Audio Playback Completely
  const stop = () => {
    if (engine === "browser" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    } else if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsSpeaking(false);
    setIsPaused(false);
  };

  // Copy Text Handler
  const copyText = async () => {
    if (!text.trim()) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-start lg:items-center" dir={uiLang === 'ar' ? 'rtl' : 'ltr'}>
      <audio
        ref={audioRef}
        onEnded={() => {
          setIsSpeaking(false);
          setIsPaused(false);
        }}
        className="hidden"
      />

      <div className="mx-auto w-full max-w-3xl py-8">
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-lg">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-2xl font-semibold text-gray-800">
              {t('tts_title') || t('tts_title')}
            </h2>

            {/* Engine Switcher */}
            <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1 text-sm">
              <button
                onClick={() => {
                  stop();
                  setEngine("browser");
                }}
                className={`rounded-md px-3 py-1 font-medium transition-all ${
                  engine === "browser"
                    ? "bg-white text-gray-800 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t('engine_free')}
              </button>
              <button
                onClick={() => {
                  stop();
                  setEngine("elevenlabs");
                }}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-medium transition-all ${
                  engine === "elevenlabs"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                ElevenLabs AI
              </button>
            </div>
          </div>

          {/* Text Input Area */}
          <div className="relative">
            <textarea
              dir={uiLang === 'ar' ? 'rtl' : 'ltr'}
              className="w-full rounded-lg border border-gray-300 p-3 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={6}
              value={text}
              placeholder={t('textarea_placeholder')}
              onChange={(e) => setText(e.target.value)}
            />
            {text && (
              <button
                onClick={() => {
                  stop();
                  setText("");
                }}
                className="absolute top-3 left-3 rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                title="مسح النص"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Settings Control Panel */}
          {engine === "browser" ? (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-500">
                  {t('language_label')}
                </label>
                <select
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value)}
                  className="w-full rounded border border-gray-300 bg-white p-2 text-sm"
                >
                    <option value="ar-SA">{t('lang_ar')} (العربية)</option>
                    <option value="en-US">{t('lang_en')}</option>
                    <option value="fr-FR">{t('lang_fr')}</option>
                    <option value="es-ES">{t('lang_es')}</option>
                    <option value="de-DE">{t('lang_de')}</option>
                    <option value="it-IT">{t('lang_it')}</option>
                </select>
              </div>

              <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-500">
                  {t('voice_label')}
                </label>
                <select
                  value={selectedVoiceURI}
                  onChange={(e) => setSelectedVoiceURI(e.target.value)}
                  className="w-full rounded border border-gray-300 bg-white p-2 text-sm"
                >
                  {filteredVoices.length > 0 ? (
                    filteredVoices.map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name} ({v.lang})
                      </option>
                    ))
                  ) : (
                    <option value="">{t('default_voice_label')}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-500">
                  {t('rate_label')}: {rate}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-500">
                  {t('pitch_label')}: {pitch}
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={pitch}
                  onChange={(e) => setPitch(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50/50 p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600 flex items-center gap-1">
                      <Key className="h-3 w-3" /> {t('eleven_api_key_label')}
                    </label>
                  <input
                    type="password"
                    placeholder="ضع مفتاح API الخاص بك هنا"
                    value={apiKey}
                    onChange={(e) => handleApiKeyChange(e.target.value)}
                    className="w-full rounded border border-gray-300 bg-white p-2 text-sm"
                  />
                </div>

                <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">
                    {t('eleven_voice_label')}
                  </label>
                  <select
                    value={elevenVoice}
                    onChange={(e) => setElevenVoice(e.target.value)}
                    className="w-full rounded border border-gray-300 bg-white p-2 text-sm"
                  >
                    <option value="21m00Tcm4TlvDq8ikWAM">Rachel</option>
                    <option value="AZnzlk1XvdvUeBnXmlld">Domi</option>
                    <option value="EXAVITQu4vr4xnSDxMaL">Bella</option>
                    <option value="ErXwobaYiN019PkySvjV">Antoni</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Error Message Alert */}
          {error && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {t(error) || error}
            </div>
          )}

          {/* Action Button Controls */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button
              onClick={speak}
              disabled={!text.trim() || loading}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 font-medium text-white transition-colors ${
                !text.trim() || loading
                  ? "cursor-not-allowed bg-blue-300"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('generate_loading')}
                </>
              ) : isPaused ? (
                <>
                  <Play className="h-4 w-4" />
                  {t('resume')}
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4" />
                  {isSpeaking ? t('speaking_now') : t('play_speech')}
                </>
              )}
            </button>

            {isSpeaking && (
                <button
                  onClick={pause}
                  className="inline-flex items-center gap-2 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-2 text-yellow-700 hover:bg-yellow-100 transition-colors"
                >
                  <Pause className="h-4 w-4" />
                  {t('pause_label')}
                </button>
            )}

            {(isSpeaking || isPaused) && (
                <button
                  onClick={stop}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Square className="h-4 w-4" />
                  {t('stop_label')}
                </button>
            )}

            {audioUrl && (
                <a
                  href={audioUrl}
                  download={`${slug || "speech-audio"}.${engine === "elevenlabs" ? "mp3" : "wav"}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  {t('download_audio_label')} ({engine === "elevenlabs" ? "MP3" : "WAV"})
                </a>
            )}

            <button
              onClick={copyText}
              disabled={!text.trim()}
              className="mr-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-green-600">{t('copied_success')}</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  {t('copy_text_label')}
                </>
              )}
            </button>
          </div>

          <div className="mt-6">
            <AdSlot variant="inline" />
          </div>
        </div>
      </div>
    </div>
  );
}