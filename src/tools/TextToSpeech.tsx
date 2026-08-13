import { useEffect, useState } from "react";
import { Copy, Volume2, Square } from "lucide-react";
import { AdSlot } from "@/components/AdSlot";

export default function TextToSpeech({ slug }: { slug?: string }) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>("");
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [text, setText] = useState("");
  const [rtl, setRtl] = useState(false);
  const [selectedLang, setSelectedLang] = useState<string>(navigator.language || "en-US");

  useEffect(() => {
    const updateVoices = () => {
      const avail = window.speechSynthesis.getVoices() || [];
      setVoices(avail);
      if (avail.length > 0 && !selectedVoiceURI) {
        const defaultVoice = avail.find(v => v.lang.toLowerCase().startsWith(selectedLang.toLowerCase())) || avail[0];
        if (defaultVoice) setSelectedVoiceURI(defaultVoice.voiceURI);
      }
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const baseLang = selectedLang.split('-')[0].toLowerCase();
  const filteredVoices = voices.filter((v) => (v.lang || '').toLowerCase().startsWith(baseLang));

  const handleLangChange = (lang: string) => {
    setSelectedLang(lang);
    setRtl(lang.startsWith('ar'));
    const base = lang.split('-')[0].toLowerCase();
    const firstMatchingVoice = voices.find(v => (v.lang || '').toLowerCase().startsWith(base));
    if (firstMatchingVoice) setSelectedVoiceURI(firstMatchingVoice.voiceURI);
  };

  const speak = () => {
    if (!text.trim()) return;
    window.speechSynthesis.cancel();

    const ut = new SpeechSynthesisUtterance(text);
    ut.rate = rate;
    ut.pitch = pitch;

    const matchedVoice = voices.find((v) => v.voiceURI === selectedVoiceURI);
    if (matchedVoice) {
      ut.voice = matchedVoice;
      ut.lang = matchedVoice.lang || selectedLang;
    } else {
      ut.lang = selectedLang;
    }
    window.speechSynthesis.speak(ut);
  };

  const stop = () => window.speechSynthesis.cancel();

  const copyText = async () => { try { await navigator.clipboard.writeText(text); } catch {} };

  // Audio download/recording removed — playback-only tool per UX decision

  return (
    <div className="min-h-[60vh] flex items-start lg:items-center">
      <div className="mx-auto w-full max-w-3xl py-8">
        <div className="rounded-xl bg-white p-6 shadow-lg border border-gray-100">
          <h2 className="text-2xl font-semibold mb-3 text-gray-800">Text to Speech</h2>
          
          <div className="mb-4 inline-flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
            <span>🔒 100% Client-Side Privacy: Your text is safe and secure.</span>
          </div>

          <textarea 
            dir={rtl ? 'rtl' : 'ltr'} 
            className="w-full rounded-lg border border-gray-300 p-3 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
            rows={6} 
            value={text} 
            placeholder="Type or paste text here..."
            onChange={(e) => setText(e.target.value)} 
          />

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Language</label>
              <select 
                value={selectedLang} 
                onChange={(e) => handleLangChange(e.target.value)} 
                className="w-full rounded border border-gray-300 p-2 text-sm bg-white"
              >
                <option value="ar">العربية (Arabic)</option>
                <option value="en">English</option>
                <option value="fr">Français (French)</option>
                <option value="es">Español (Spanish)</option>
                <option value="de">Deutsch (German)</option>
                <option value="tr">Türkçe (Turkish)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Voice Accent</label>
              <select 
                value={selectedVoiceURI} 
                onChange={(e) => setSelectedVoiceURI(e.target.value)} 
                className="w-full rounded border border-gray-300 p-2 text-sm bg-white"
              >
                {filteredVoices.length === 0 ? (
                  <option value="">Default System Voice ({selectedLang.toUpperCase()})</option>
                ) : (
                  filteredVoices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Speed: {rate}x</label>
              <input type="range" min={0.5} max={2} step={0.1} value={rate} onChange={(e) => setRate(Number(e.target.value))} className="w-full accent-blue-600" />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Pitch: {pitch}</label>
              <input type="range" min={0.5} max={2} step={0.1} value={pitch} onChange={(e) => setPitch(Number(e.target.value))} className="w-full accent-blue-600" />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 items-center">
            <button onClick={speak} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg inline-flex items-center gap-2">
              <Volume2 className="h-4 w-4" /> Speak
            </button>
            <button onClick={stop} className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg inline-flex items-center gap-2">
              <Square className="h-4 w-4" /> Stop
            </button>
            <button onClick={downloadAudio} className="px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg inline-flex items-center gap-1.5">
              <Download className="h-4 w-4" /> Download Audio (.mp3)
            </button>
            <button onClick={copyText} className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg inline-flex items-center gap-1.5 ml-auto">
              <Copy className="h-4 w-4" /> Copy Text
            </button>
          </div>

          <div className="mt-6">
            <div className="my-6 min-h-[90px] border border-dashed rounded flex items-center justify-center text-xs text-muted-foreground">Ad Space</div>
            <AdSlot variant="inline" />
          </div>
        </div>
      </div>
    </div>
  );
}