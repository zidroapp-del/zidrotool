import { useEffect, useState } from "react";

export default function TextToSpeech({ slug }: { slug?: string }) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceIdx, setVoiceIdx] = useState(0);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [text, setText] = useState("");

  useEffect(() => {
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const speak = () => {
    if (!text) return;
    const ut = new SpeechSynthesisUtterance(text);
    ut.rate = rate;
    ut.pitch = pitch;
    ut.voice = voices[voiceIdx] || null;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(ut);
  };

  const stop = () => window.speechSynthesis.cancel();

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Text to Speech</h2>
      <textarea className="w-full textarea" rows={6} value={text} onChange={(e) => setText(e.target.value)} />
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <select value={voiceIdx} onChange={(e) => setVoiceIdx(Number(e.target.value))} className="select">
          {voices.map((v, i) => (
            <option key={v.name + i} value={i}>{v.name} {v.lang ? `(${v.lang})` : ""}</option>
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
      <div className="mt-3 flex gap-2">
        <button onClick={speak} className="btn-primary">Speak</button>
        <button onClick={stop} className="btn-ghost">Stop</button>
      </div>
    </div>
  );
}
