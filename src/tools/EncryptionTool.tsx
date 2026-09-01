import { useState, useMemo } from "react";
import { Lock, Unlock, Copy, Check, AlertCircle } from "lucide-react";
import { cn, copyToClipboard } from "@/lib/utils";

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt: salt as BufferSource, iterations: 100000, hash: "SHA-256" }, keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

function bufToB64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return btoa(String.fromCharCode(...bytes));
}
function b64ToBuf(s: string): Uint8Array {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}

export default function EncryptionTool() {
  const [mode, setMode] = useState<"encrypt" | "decrypt">("encrypt");
  const [text, setText] = useState("");
  const [password, setPassword] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleAction = async () => {
    if (!text || !password) return;
    setBusy(true); setError("");
    try {
      if (mode === "encrypt") {
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const key = await deriveKey(password, salt);
        const enc = new TextEncoder();
        const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, enc.encode(text));
        setOutput(`${bufToB64(salt)}:${bufToB64(iv)}:${bufToB64(cipher)}`);
      } else {
        const parts = text.split(":");
        if (parts.length !== 3) throw new Error("Invalid encrypted format");
        const salt = b64ToBuf(parts[0]);
        const iv = b64ToBuf(parts[1]);
        const cipher = b64ToBuf(parts[2]);
        const key = await deriveKey(password, salt);
        const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, cipher as BufferSource);
        setOutput(new TextDecoder().decode(plain));
      }
    } catch (e) {
      setError(mode === "decrypt" ? "Decryption failed — wrong password or corrupted data" : (e as Error).message);
      setOutput("");
    }
    setBusy(false);
  };

  const handleCopy = async () => {
    if (!output) return;
    const ok = await copyToClipboard(output);
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  return (
    <div>
      <div className="mb-4 flex gap-1.5">
        <button onClick={() => { setMode("encrypt"); setOutput(""); setError(""); }} className={cn("btn btn-sm", mode === "encrypt" ? "btn-primary" : "btn-secondary")}><Lock className="h-3.5 w-3.5" /> Encrypt</button>
        <button onClick={() => { setMode("decrypt"); setOutput(""); setError(""); }} className={cn("btn btn-sm", mode === "decrypt" ? "btn-primary" : "btn-secondary")}><Unlock className="h-3.5 w-3.5" /> Decrypt</button>
      </div>
      <div className="mb-4"><label className="label mb-1.5 block">{mode === "encrypt" ? "Text to encrypt" : "Encrypted data"}</label><textarea value={text} onChange={(e) => setText(e.target.value)} className="input min-h-[100px] resize-y font-mono text-sm" placeholder={mode === "encrypt" ? "Enter text to encrypt..." : "Paste encrypted data..."} /></div>
      <div className="mb-4"><label className="label mb-1.5 block">Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" placeholder="Enter encryption password..." /></div>
      <button onClick={handleAction} className="btn-primary w-full" disabled={busy || !text || !password}>{busy ? "Processing..." : mode === "encrypt" ? "Encrypt" : "Decrypt"}</button>
      {error && <p className="mt-3 flex items-center gap-1.5 text-sm text-danger"><AlertCircle className="h-4 w-4" />{error}</p>}
      {output && (
        <div className="mt-6"><div className="mb-2 flex items-center justify-between"><span className="label mb-0">Result</span><button onClick={handleCopy} className={cn("btn btn-sm", copied ? "btn-primary" : "btn-secondary")}>{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} Copy</button></div><textarea readOnly value={output} className="input min-h-[100px] resize-y bg-ink-50/50 font-mono text-sm dark:bg-ink-950/50" /></div>
      )}
    </div>
  );
}
