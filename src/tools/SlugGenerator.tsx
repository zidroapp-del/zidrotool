import { useState, useMemo } from "react";
import { Copy, Check } from "lucide-react";
import { cn, copyToClipboard, slugify } from "@/lib/utils";

export default function SlugGenerator() {
  const [text, setText] = useState("");
  const [separator, setSeparator] = useState<"-" | "_">("-");
  const [lower, setLower] = useState(true);
  const [copied, setCopied] = useState(false);

  const slug = useMemo(() => {
    let s = slugify(text);
    if (separator === "_") s = s.replace(/-/g, "_");
    if (!lower) s = s.replace(/\b\w/g, (c) => c.toUpperCase());
    return s;
  }, [text, separator, lower]);

  const handleCopy = async () => {
    if (!slug) return;
    const ok = await copyToClipboard(slug);
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  return (
    <div>
      <div className="mb-4">
        <label className="label mb-2 block">Text</label>
        <input type="text" value={text} onChange={(e) => setText(e.target.value)} className="input" placeholder="Enter a title or phrase..." autoFocus />
      </div>
      <div className="mb-4 flex gap-4">
        <div><label className="label mb-1.5 block">Separator</label><div className="flex gap-1.5"><button onClick={() => setSeparator("-")} className={cn("btn btn-sm", separator === "-" ? "btn-primary" : "btn-secondary")}>Dash (-)</button><button onClick={() => setSeparator("_")} className={cn("btn btn-sm", separator === "_" ? "btn-primary" : "btn-secondary")}>Underscore (_)</button></div></div>
        <div><label className="label mb-1.5 block">Case</label><div className="flex gap-1.5"><button onClick={() => setLower(true)} className={cn("btn btn-sm", lower ? "btn-primary" : "btn-secondary")}>Lowercase</button><button onClick={() => setLower(false)} className={cn("btn btn-sm", !lower ? "btn-primary" : "btn-secondary")}>Title Case</button></div></div>
      </div>
      {slug && (
        <div className="rounded-xl border-2 border-brand-200 bg-brand-50/50 p-4 dark:border-brand-800 dark:bg-brand-900/10">
          <div className="flex items-center gap-3">
            <code className="flex-1 truncate font-mono text-sm font-bold text-ink-900 dark:text-ink-100">{slug}</code>
            <button onClick={handleCopy} className={cn("btn btn-sm", copied ? "btn-primary" : "btn-secondary")}>{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? "Copied!" : "Copy"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
