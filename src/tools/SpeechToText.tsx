import { useEffect, useRef, useState } from "react";
import { Mic, StopCircle, Copy, Download } from "lucide-react";
import { AdSlot } from "@/components/AdSlot";

export default function SpeechToText({ slug }: { slug?: string }) {
  const [supported, setSupported] = useState<boolean>(false);
  const [listening, setListening] = useState(false);
  const [finalText, setFinalText] = useState("");
  const [preview, setPreview] = useState("");
  const recognitionRef = useRef<any>(null);
  const finalRef = useRef<string>("");

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
      // Maintain a running confirmed transcript in a ref to avoid duplication
      let interim = "";
      for (let i = ev.resultIndex; i < ev.results.length; ++i) {
        const res = ev.results[i];
        const t = res[0]?.transcript || "";
        if (res.isFinal) {
          // append confirmed into the ref
          finalRef.current = finalRef.current ? finalRef.current + " " + t : t;
        } else {
          // keep only the latest interim (show live while speaking)
          interim = t;
        }
      }
      // update state from ref + interim for instant live preview
      setFinalText(finalRef.current);
      setPreview(interim);
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
        <div className="rounded-xl bg-white p-6 shadow-lg">
          <h2 className="text-2xl font-semibold mb-3">Speech to Text</h2>
          {!supported && (
            <p className="text-sm text-ink-500">Your browser does not support the Web Speech API.</p>
          )}

          {supported && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <button onClick={start} disabled={listening} className="btn-primary inline-flex items-center gap-2">
                  <Mic className="h-4 w-4" /> Start
                </button>
                <button onClick={stop} disabled={!listening} className="btn-ghost inline-flex items-center gap-2">
                  <StopCircle className="h-4 w-4" /> Stop
                </button>
                <button onClick={() => { setFinalText(""); setPreview(""); }} className="btn-secondary">Clear</button>
                <button onClick={copyText} className="btn-ghost inline-flex items-center gap-2 ml-auto"><Copy className="h-4 w-4" /> Copy Text</button>
                <button onClick={downloadTxt} className="btn-ghost inline-flex items-center gap-2"><Download className="h-4 w-4" /> Download .txt</button>
              </div>

              <div className="rounded border border-ink-100 p-3 bg-ink-50">
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <div className={`h-3 w-3 rounded-full ${listening ? 'bg-red-500' : 'bg-ink-300'}`}></div>
                    {listening && <span className="absolute -right-2 -top-2 h-3 w-3 animate-ping rounded-full bg-red-400/60" />}
                    <div className={`absolute -left-4 top-1/2 h-6 w-1 rounded-full ${listening ? 'bg-red-300/60 animate-pulse' : 'bg-ink-200'}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-ink-500">Live preview</p>
                    <div className="mt-2 min-h-[48px] text-ink-900">
                      {preview ? <em className="text-ink-600">{preview}</em> : <span className="text-ink-400">Waiting...</span>}
                    </div>
                  </div>
                </div>
              </div>

                  <div className="mt-3 rounded border-l-4 border-ink-200 bg-amber-50/30 p-3 text-sm text-ink-700">
                    <strong>Recording help:</strong>
                    <p className="mt-1 text-xs">If your browser prompts to share audio when recording, choose "Share Tab" and enable the "Share audio" option. This allows capturing playback audio for downloads.</p>
                  </div>

              <textarea value={finalText + (preview ? ` ${preview}` : "")} onChange={(e) => setFinalText(e.target.value)} rows={8} className="w-full textarea" />

              <div className="mt-6">
                <div className="my-6 p-4 border border-dashed rounded text-center text-xs text-muted-foreground">Ad Space</div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <h3 className="font-semibold">How it works</h3>
                    <ol className="mt-2 list-decimal list-inside text-sm text-ink-600">
                      <li>Click Start and allow microphone access.</li>
                      <li>Speak clearly; interim text appears live.</li>
                      <li>Stop and download or copy the transcript.</li>
                    </ol>
                  </div>
                  <div>
                    <h3 className="font-semibold">Key features</h3>
                    <ul className="mt-2 text-sm text-ink-600">
                      <li>Separate confirmed transcripts and interim preview</li>
                      <li>Download transcript as .txt</li>
                      <li>Copy to clipboard</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold">FAQ</h3>
                    <div className="mt-2 text-sm text-ink-600">
                      <p><strong>Q:</strong> Is my audio uploaded? <br/><strong>A:</strong> No — recognition runs in your browser.</p>
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
