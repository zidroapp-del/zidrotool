import { useEffect, useRef, useState } from "react";
import { Mic, StopCircle } from "lucide-react";

export default function SpeechToText({ slug }: { slug?: string }) {
  const [supported, setSupported] = useState<boolean>(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
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
    rec.lang = navigator.language || "en-US";
    rec.onresult = (ev: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      for (let i = ev.resultIndex; i < ev.results.length; ++i) {
        const res = ev.results[i];
        if (res.isFinal) final += res[0].transcript;
        else interim += res[0].transcript;
      }
      setTranscript((prev) => prev + final + (interim ? ` ${interim}` : ""));
    };
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    return () => {
      try { rec.stop(); } catch (e) {}
    };
  }, []);

  const start = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch (e) {
      setListening(false);
    }
  };
  const stop = () => {
    if (!recognitionRef.current) return;
    try { recognitionRef.current.stop(); } catch (e) {}
    setListening(false);
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Speech to Text</h2>
      {!supported && (
        <p className="text-sm text-ink-500">Your browser does not support the Web Speech API.</p>
      )}

      {supported && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <button onClick={start} disabled={listening} className="btn-primary inline-flex items-center gap-2">
              <Mic className="h-4 w-4" /> Start
            </button>
            <button onClick={stop} disabled={!listening} className="btn-ghost inline-flex items-center gap-2">
              <StopCircle className="h-4 w-4" /> Stop
            </button>
            <button onClick={() => setTranscript("")} className="btn-secondary">Clear</button>
          </div>
          <textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} rows={8} className="w-full textarea" />
        </div>
      )}
    </div>
  );
}
