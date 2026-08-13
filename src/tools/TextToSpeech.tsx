import { useEffect, useState } from "react";
import { Copy, Volume2, Square } from "lucide-react";
import { AdSlot } from "@/components/AdSlot";

export default function TextToSpeech({ slug }: { slug?: string }) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState("");
  const [selectedLang, setSelectedLang] = useState("en-US");
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [text, setText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window)
    ) {
      setSupported(false);
      return;
    }

    const updateVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    updateVoices();

    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const baseLang = selectedLang.split("-")[0].toLowerCase();

  const filteredVoices = voices.filter((voice) =>
    voice.lang.toLowerCase().startsWith(baseLang)
  );

  useEffect(() => {
    if (filteredVoices.length > 0) {
      const currentVoiceExists = filteredVoices.some(
        (voice) => voice.voiceURI === selectedVoiceURI
      );

      if (!currentVoiceExists) {
        setSelectedVoiceURI(filteredVoices[0].voiceURI);
      }
    } else {
      setSelectedVoiceURI("");
    }
  }, [selectedLang, voices]);

  const handleLanguageChange = (language: string) => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setSelectedLang(language);
  };

  const speak = () => {
    if (!text.trim()) {
      alert("Please enter some text first.");
      return;
    }

    if (!("speechSynthesis" in window)) {
      alert("Text to Speech is not supported in this browser.");
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.lang = selectedLang;

    const selectedVoice = voices.find(
      (voice) => voice.voiceURI === selectedVoiceURI
    );

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stop = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    setIsSpeaking(false);
  };

  const copyText = async () => {
    if (!text.trim()) return;

    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  if (!supported) {
    return (
      <div className="min-h-[60vh] flex items-start lg:items-center">
        <div className="mx-auto w-full max-w-3xl py-8">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <h2 className="text-2xl font-semibold text-red-700">
              Text to Speech is not supported
            </h2>

            <p className="mt-2 text-sm text-red-600">
              Your browser does not support the Speech Synthesis API.
              Please try a modern browser such as Google Chrome or Microsoft Edge.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-start lg:items-center">
      <div className="mx-auto w-full max-w-3xl py-8">
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-lg">
          <h2 className="mb-3 text-2xl font-semibold text-gray-800">
            Text to Speech
          </h2>

          <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-sm text-green-700">
            <span>🔒</span>
            <span>
              100% Client-Side Privacy: Your text stays on your device.
            </span>
          </div>

          <textarea
            dir={selectedLang.startsWith("ar") ? "rtl" : "ltr"}
            className="w-full rounded-lg border border-gray-300 p-3 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            rows={7}
            value={text}
            placeholder="Type or paste your text here..."
            onChange={(e) => setText(e.target.value)}
          />

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Language */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">
                Language
              </label>

              <select
                value={selectedLang}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="w-full rounded border border-gray-300 bg-white p-2 text-sm"
              >
                <option value="ar-SA">العربية</option>
                <option value="ar-DZ">العربية الجزائرية</option>
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
                <option value="fr-FR">Français</option>
                <option value="es-ES">Español</option>
                <option value="de-DE">Deutsch</option>
                <option value="it-IT">Italiano</option>
              </select>
            </div>

            {/* Voice */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">
                Voice
              </label>

              <select
                value={selectedVoiceURI}
                onChange={(e) => setSelectedVoiceURI(e.target.value)}
                className="w-full rounded border border-gray-300 bg-white p-2 text-sm"
              >
                {filteredVoices.length === 0 ? (
                  <option value="">
                    Default system voice
                  </option>
                ) : (
                  filteredVoices.map((voice) => (
                    <option
                      key={voice.voiceURI}
                      value={voice.voiceURI}
                    >
                      {voice.name} ({voice.lang})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Speed */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">
                Speed: {rate}x
              </label>

              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Pitch */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">
                Pitch: {pitch}
              </label>

              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={pitch}
                onChange={(e) => setPitch(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button
              onClick={speak}
              disabled={isSpeaking}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 font-medium text-white ${
                isSpeaking
                  ? "cursor-not-allowed bg-gray-400"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              <Volume2 className="h-4 w-4" />
              {isSpeaking ? "Speaking..." : "Speak"}
            </button>

            <button
              onClick={stop}
              disabled={!isSpeaking}
              className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 ${
                !isSpeaking
                  ? "cursor-not-allowed border-gray-200 text-gray-400"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Square className="h-4 w-4" />
              Stop
            </button>

            <button
              onClick={copyText}
              disabled={!text.trim()}
              className={`ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm ${
                !text.trim()
                  ? "cursor-not-allowed text-gray-400"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Copy className="h-4 w-4" />
              Copy Text
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