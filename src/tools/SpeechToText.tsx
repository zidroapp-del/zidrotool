import { useEffect, useRef, useState } from "react";
import { Mic, StopCircle, Copy, Download } from "lucide-react";
import { AdSlot } from "@/components/AdSlot";

export default function SpeechToText({ slug }: { slug?: string }) {
  const [supported, setSupported] = useState<boolean>(false);
  const [listening, setListening] = useState(false);
  const [finalText, setFinalText] = useState("");
  const [preview, setPreview] = useState("");
  const [lang, setLang] = useState<string>("ar-SA");

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const win: any = window as any;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }
    setSupported(true);

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = lang;

    rec.onresult = (ev: any) => {
      let currentInterim = "";
      let newFinal = "";

      for (let i = ev.resultIndex; i < ev.results.length; ++i) {
        const transcript = ev.results[i][0]?.transcript || "";
        if (ev.results[i].isFinal) {
          newFinal += transcript + " ";
        } else {
          currentInterim += transcript;
        }
      }

      if (newFinal) {
        setFinalText((prev) => (prev ? prev.trim() + " " + newFinal.trim() : newFinal.trim()));
        setPreview("");
      } else {
        setPreview(currentInterim);
      }
    };

    rec.onerror = (err: any) => {
      console.error("STT Error:", err);
      setListening(false);
    };

    rec.onend = () => {
      setListening(false);
      setPreview("");
    };

    recognitionRef.current = rec;

    return () => {
      try { rec.stop(); } catch (e) {}
    };
  }, [lang]);

  const start = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.lang = lang;
      recognitionRef.current.start();
      setListening(true);
    } catch (e) {
      console.error(e);
      setListening(false);
    }
  };

  const stop = () => {
    if (!recognitionRef.current) return;
    try { recognitionRef.current.stop(); } catch (e) {}
    setListening(false);
    setPreview("");
  };

  const copyText = async () => {
    try { await navigator.clipboard.writeText(finalText); }
    catch (e) { /* ignore */ }
  };

  const downloadTxt = () => {
    const blob = new Blob([finalText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug || "transcript"}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-[60vh] flex items-start lg:items-center">
      <div className="mx-auto w-full max-w-3xl py-8">
        <div className="rounded-xl bg-white p-6 shadow-lg border border-gray-100">
          <h2 className="text-2xl font-semibold mb-3 text-gray-800">Speech to Text</h2>
          
          <div className="mb-4 inline-flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
            <span className="text-base">🔒</span>
            <span>100% Client-Side Privacy: Your audio never leaves your device.</span>
          </div>

          {!supported && (
            <p className="text-sm text-red-500">Your browser does not support the Web Speech API (Please use Chrome or Edge).</p>
          )}

          {supported && (
            <div className="space-y-4">
              {/* اختيار اللغة */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Speaking Language:</label>
                <select 
                  value={lang} 
                  onChange={(e) => {
                    stop();
                    setLang(e.target.value);
                  }} 
                  disabled={listening}
                  className="rounded border border-gray-300 px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ar-SA">العربية (Saudi Arabia)</option>
                  <option value="ar-EG">العربية (Egypt)</option>
                  <option value="ar-DZ">العربية (Algeria)</option>
                  <option value="fr-FR">Français (French)</option>
                  <option value="en-US">English (US)</option>
                  <option value="es-ES">Español (Spanish)</option>
                  <option value="de-DE">Deutsch (German)</option>
                  <option value="tr-TR">Türkçe (Turkish)</option>
                </select>
              </div>

              {/* أزرار التحكم */}
              <div className="flex flex-wrap items-center gap-3">
                <button 
                  onClick={start} 
                  disabled={listening} 
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white transition-colors ${listening ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  <Mic className="h-4 w-4" /> Start Listening
                </button>
                
                <button 
                  onClick={stop} 
                  disabled={!listening} 
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${!listening ? 'opacity-50 cursor-not-allowed' : 'border-red-500 text-red-600 hover:bg-red-50'}`}
                >
                  <StopCircle className="h-4 w-4" /> Stop
                </button>
                
                <button onClick={() => { setFinalText(""); setPreview(""); }} className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
                  Clear
                </button>

                <div className="ml-auto flex items-center gap-2">
                  <button onClick={copyText} className="inline-flex items-center gap-1.5 text-sm text-gray-700 hover:text-black border px-3 py-1.5 rounded-lg">
                    <Copy className="h-4 w-4" /> Copy
                  </button>
                  <button onClick={downloadTxt} className="inline-flex items-center gap-1.5 text-sm text-gray-700 hover:text-black border px-3 py-1.5 rounded-lg">
                    <Download className="h-4 w-4" /> .txt
                  </button>
                </div>
              </div>

              {/* شاشة الاستماع اللحظي */}
              <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
                <div className="flex items-start gap-3">
                  <div className="relative mt-1">
                    <div className={`h-3 w-3 rounded-full ${listening ? 'bg-red-500 animate-ping' : 'bg-gray-300'}`}></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-500">Live Status</p>
                    <div className="mt-1 min-h-[24px] text-sm text-gray-800">
                      {preview ? <em className="text-blue-600 font-medium">{preview}</em> : <span className="text-gray-400">{listening ? "Listening... Speak clearly into your mic." : "Click Start Listening to begin."}</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* مربع النص الرئيسي */}
              <textarea 
                value={finalText} 
                onChange={(e) => setFinalText(e.target.value)} 
                rows={8} 
                placeholder="Transcribed text will accumulate here..."
                className="w-full rounded-lg border border-gray-300 p-3 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                dir={lang.startsWith("ar") ? "rtl" : "ltr"}
              />

              {/* قسم الإعلانات والشرح */}
              <div className="mt-6">
                <div className="my-6 min-h-[90px] border border-dashed rounded flex items-center justify-center text-xs text-muted-foreground">Ad Space</div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">How it works</h3>
                    <ol className="mt-2 list-decimal list-inside text-sm text-gray-600 space-y-1">
                      <li>Select your speaking language.</li>
                      <li>Click Start and allow mic permissions.</li>
                      <li>Speak clearly; your words will be typed live.</li>
                    </ol>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Key features</h3>
                    <ul className="mt-2 text-sm text-gray-600 space-y-1">
                      <li>Real-time live transcription</li>
                      <li>Multi-dialect Arabic support</li>
                      <li>Instant copy & text export</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">FAQ</h3>
                    <div className="mt-2 text-sm text-gray-600">
                      <p><strong>Q:</strong> Is my audio saved?<br/><strong>A:</strong> No, audio processing is strictly local in your browser.</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6"><AdSlot variant="inline" /></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}