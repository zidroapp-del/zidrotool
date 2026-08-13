import { useEffect, useState, useRef } from "react";
import { Copy, Download, Volume2, Square } from "lucide-react";
import { AdSlot } from "@/components/AdSlot";

export default function TextToSpeech({ slug }: { slug?: string }) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>("");
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [text, setText] = useState("");
  const [rtl, setRtl] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedLang, setSelectedLang] = useState(() => (navigator.language || 'en').split('-')[0]);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  // 1. تحميل أصوات المتصفح الحقيقية
  useEffect(() => {
    const updateVoices = () => {
      const avail = window.speechSynthesis.getVoices() || [];
      setVoices(avail);
      if (avail.length > 0 && !selectedVoiceURI) {
        // تعيين أول صوت مطبق تلقائياً
        const defaultVoice = avail.find(v => v.lang.startsWith(selectedLang)) || avail[0];
        if (defaultVoice) setSelectedVoiceURI(defaultVoice.voiceURI);
      }
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  // 2. كشف الأجهزة المحمولة
  useEffect(() => {
    const ua = navigator.userAgent || '';
    setIsMobile(/Mobi|Android|iPhone|iPad|iPod/i.test(ua));
  }, []);

  // 3. تصفية الأصوات الحقيقية فقط المتاحة باللغة المختارة
  const filteredVoices = voices.filter((v) => v.lang.toLowerCase().startsWith(selectedLang.toLowerCase()));

  // 4. تغيير اللغة والاتجاه RTL
  const handleLangChange = (lang: string) => {
    setSelectedLang(lang);
    setRtl(lang === 'ar');
    const firstMatchingVoice = voices.find(v => v.lang.toLowerCase().startsWith(lang.toLowerCase()));
    if (firstMatchingVoice) {
      setSelectedVoiceURI(firstMatchingVoice.voiceURI);
    } else {
      setSelectedVoiceURI("");
    }
  };

  // 5. التشغيل الصوتي بالنبرة الحقيقية المحددة
  const speak = () => {
    if (!text.trim()) return;
    window.speechSynthesis.cancel(); // إيقاف أي قراءة سابقة

    const ut = new SpeechSynthesisUtterance(text);
    ut.rate = rate;
    ut.pitch = pitch;

    // البحث عن الصوت المحدد حقيقةً من المتصفح
    const matchedVoice = voices.find((v) => v.voiceURI === selectedVoiceURI);
    if (matchedVoice) {
      ut.voice = matchedVoice;
      ut.lang = matchedVoice.lang;
    } else {
      ut.lang = selectedLang === 'ar' ? 'ar-SA' : selectedLang;
    }

    window.speechSynthesis.speak(ut);
  };

  const stop = () => window.speechSynthesis.cancel();

  const copyText = async () => { try { await navigator.clipboard.writeText(text); } catch {} };

  // 6. تسجيل وتحميل الصوت (DeskTop)
  const recordAndDownload = async () => {
    if (!text) return;
    if (!('mediaDevices' in navigator) || !('getDisplayMedia' in navigator.mediaDevices)) {
      alert('Recording requires a browser that supports sharing tab audio (getDisplayMedia).');
      return;
    }

    let stream: MediaStream | null = null;
    try {
      stream = await (navigator.mediaDevices as any).getDisplayMedia({ audio: true, video: false });
      const mr = new MediaRecorder(stream as MediaStream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data && e.data.size) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${slug || 'tts'}.webm`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        try { stream?.getTracks().forEach((t) => t.stop()); } catch {}
      };
      recorderRef.current = mr;
      mr.start();

      const ut = new SpeechSynthesisUtterance(text);
      ut.rate = rate;
      ut.pitch = pitch;
      const matchedVoice = voices.find((v) => v.voiceURI === selectedVoiceURI);
      if (matchedVoice) {
        ut.voice = matchedVoice;
        ut.lang = matchedVoice.lang;
      } else {
        ut.lang = selectedLang === 'ar' ? 'ar-SA' : selectedLang;
      }

      ut.onend = () => { try { mr.state !== 'inactive' && mr.stop(); } catch (e) {} };
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(ut);
    } catch (e) {
      console.error('Recording error:', e);
      try { stream?.getTracks().forEach((t) => t.stop()); } catch {}
      alert('Recording failed or was denied. Please select "Share tab" with audio.');
    }
  };

  return (
    <div className="min-h-[60vh] flex items-start lg:items-center">
      <div className="mx-auto w-full max-w-3xl py-8">
        <div className="rounded-xl bg-white p-6 shadow-lg border border-gray-100">
          <h2 className="text-2xl font-semibold mb-3 text-gray-800">Text to Speech</h2>
          
          <div className="mb-4 inline-flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
            <span className="text-base">🔒</span>
            <span>100% Client-Side Privacy: Your audio never leaves your device.</span>
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
            {/* اختيار اللغة */}
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

            {/* اختيار الصوت المعين من النظام */}
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

            {/* السرعة Rate */}
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Speed: {rate}x</label>
              <input type="range" min={0.5} max={2} step={0.1} value={rate} onChange={(e) => setRate(Number(e.target.value))} className="w-full accent-blue-600" />
            </div>

            {/* النبرة Pitch */}
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Pitch: {pitch}</label>
              <input type="range" min={0.5} max={2} step={0.1} value={pitch} onChange={(e) => setPitch(Number(e.target.value))} className="w-full accent-blue-600" />
            </div>
          </div>

          {/* أزرار التحكم */}
          <div className="mt-5 flex flex-wrap gap-2 items-center">
            <button onClick={speak} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg inline-flex items-center gap-2">
              <Volume2 className="h-4 w-4" /> Speak
            </button>
            <button onClick={stop} className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg inline-flex items-center gap-2">
              <Square className="h-4 w-4" /> Stop
            </button>
            <button onClick={copyText} className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg inline-flex items-center gap-1.5 ml-auto">
              <Copy className="h-4 w-4" /> Copy Text
            </button>
            {!isMobile && ('mediaDevices' in navigator && 'getDisplayMedia' in navigator.mediaDevices) && (
              <button onClick={recordAndDownload} className="px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg inline-flex items-center gap-1.5">
                <Download className="h-4 w-4" /> Record & Download
              </button>
            )}
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