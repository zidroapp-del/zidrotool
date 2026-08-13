import { useEffect, useState, useRef } from "react";
import { Copy, Download } from "lucide-react";

export default function TextToSpeech({ slug }: { slug?: string }) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceIdx, setVoiceIdx] = useState(0);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [text, setText] = useState("");
  const [rtl, setRtl] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  useEffect(() => {
    const load = () => setVoices(window.speechSynthesis.getVoices() || []);
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  // Display voices, but ensure common Arabic locales are present in the dropdown
  const preferredArabic = ["ar-SA", "ar-EG", "ar-MA"];
  const displayVoices = [...voices];
  preferredArabic.forEach((lang) => {
    if (!displayVoices.some((v) => v.lang && v.lang.toLowerCase().startsWith(lang.toLowerCase()))) {
      // Push a lightweight placeholder so users can select an Arabic lang and RTL will apply
      displayVoices.push({ name: `Arabic (${lang})`, lang, default: false, localService: false, voiceURI: `placeholder-${lang}` } as unknown as SpeechSynthesisVoice);
    }
  });

  const onSelectVoice = (idx: number) => {
    setVoiceIdx(idx);
    const v = displayVoices[idx];
    const isArabic = v?.lang?.toLowerCase().startsWith("ar");
    setRtl(Boolean(isArabic));
  };

  const speak = () => {
    if (!text) return;
    const ut = new SpeechSynthesisUtterance(text);
    ut.rate = rate;
    ut.pitch = pitch;
    const selected = displayVoices[voiceIdx];
    if (selected && voices.some((v) => v.voiceURI === selected.voiceURI)) {
      ut.voice = voices.find((v) => v.voiceURI === selected.voiceURI) || null;
    } else if (selected && selected.lang) {
      ut.lang = selected.lang;
    }
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(ut);
  };

  const stop = () => window.speechSynthesis.cancel();

  const copyText = async () => { try { await navigator.clipboard.writeText(text); } catch {} };

  // Prefer getDisplayMedia to capture tab audio; improved error handling and cleanup
  const recordAndDownload = async () => {
    if (!text) return;
    // Recommended flow: ask user to Share Tab Audio via getDisplayMedia and record the returned stream
    if (!('mediaDevices' in navigator) || !('getDisplayMedia' in navigator.mediaDevices)) {
      alert('Recording requires a browser that supports sharing tab audio (getDisplayMedia). Please use a Chromium-based browser.');
      return;
    }

    let stream: MediaStream | null = null;
    try {
      // Prompt the user to share the tab (they must select "Share tab" and enable "Share audio")
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
        try { stream?.getTracks().forEach((t: MediaStreamTrack) => t.stop()); } catch {}
      };
      recorderRef.current = mr;
      mr.start();

      // Now speak; the shared tab audio includes this playback so it is captured by the recorder
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.pitch = pitch;
      const selected = displayVoices[voiceIdx];
      if (selected && voices.some((v) => v.voiceURI === selected.voiceURI)) {
        utterance.voice = voices.find((v) => v.voiceURI === selected.voiceURI) || null;
      } else if (selected && selected.lang) {
        utterance.lang = selected.lang;
      }
      utterance.onend = () => {
        try { mr.state !== 'inactive' && mr.stop(); } catch (e) { /* ignore */ }
      };
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error('Recording error or denied:', e);
      try { stream?.getTracks().forEach((t: MediaStreamTrack) => t.stop()); } catch {}
      alert('Recording failed or was denied. Please choose "Share tab" with audio when prompted.');
    }
  };

  return (
    <div className="min-h-[60vh] flex items-start lg:items-center">
      <div className="mx-auto w-full max-w-3xl py-8">
        <div className="rounded-xl bg-white p-6 shadow-lg">
          <h2 className="text-2xl font-semibold mb-3">Text to Speech</h2>
          <textarea dir={rtl ? 'rtl' : 'ltr'} className="w-full textarea" rows={6} value={text} onChange={(e) => setText(e.target.value)} />

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select value={voiceIdx} onChange={(e) => onSelectVoice(Number(e.target.value))} className="select">
              {displayVoices.map((v, i) => (
                <option key={(v.name || '') + i} value={i}>{v.name} {v.lang ? `(${v.lang})` : ""}</option>
              ))}
            </select>
            <div>
              <label className="text-sm">Rate: {rate}</label>
              <input type="range" min={0.5} max={2} step={0.1} value={rate} onChange={(e) => setRate(Number(e.target.value))} />
            </div>
            <div>
              <label className="text-sm">Pitch: {pitch}</label>
              <input type="range" min={0.5} max={2} step={0.1} value={pitch} onChange={(e) => setPitch(Number(e.target.value))} />
            </div>
          </div>

          <div className="mt-3 flex gap-2 items-center">
            <button onClick={speak} className="btn-primary">Speak</button>
            <button onClick={stop} className="btn-ghost">Stop</button>
            <button onClick={copyText} className="btn-ghost inline-flex items-center gap-2 ml-auto"><Copy className="h-4 w-4" /> Copy Text</button>
            <button onClick={recordAndDownload} className="btn-ghost inline-flex items-center gap-2"><Download className="h-4 w-4" /> Record & Download</button>
          </div>

          <div className="mt-2 text-sm text-ink-600">
            <div className="rounded-md bg-amber-50/40 p-2 border-l-4 border-amber-300">
              <strong>Download help:</strong> When prompted, choose <em>Share tab</em> and enable <em>Share audio</em> so the browser records the spoken audio for download.
            </div>
          </div>

          <div className="mt-6">
            <div className="my-6 p-4 border border-dashed rounded text-center text-xs text-muted-foreground">Ad Space</div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <h3 className="font-semibold">How it works</h3>
                <ol className="mt-2 list-decimal list-inside text-sm text-ink-600">
                  <li>Type or paste text into the box.</li>
                  <li>Choose a voice, rate, and pitch.</li>
                  <li>Click Speak to play or Record & Download to save audio (share tab audio recommended).</li>
                </ol>
              </div>
              <div>
                <h3 className="font-semibold">Key features</h3>
                <ul className="mt-2 text-sm text-ink-600">
                  <li>Multiple system voices</li>
                  <li>RTL support for Arabic</li>
                  <li>Download via MediaRecorder (requires sharing tab audio)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold">FAQ</h3>
                <div className="mt-2 text-sm text-ink-600">
                  <p><strong>Q:</strong> How do I save audio?<br/><strong>A:</strong> Use Record & Download and pick "Share tab" with audio when prompted.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
