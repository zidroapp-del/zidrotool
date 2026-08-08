import { useState, useMemo } from "react";
import { Copy, Check, Plus, Trash2 } from "lucide-react";
import { cn, copyToClipboard } from "@/lib/utils";

export default function SitemapGenerator() {
  const [urls, setUrls] = useState([{ url: "", freq: "weekly", priority: "0.8" }]);
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => {
    const entries = urls.filter((u) => u.url.trim()).map((u) => `  <url>\n    <loc>${u.url.trim()}</loc>\n    <changefreq>${u.freq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`).join("\n");
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`;
  }, [urls]);

  const handleCopy = async () => {
    const ok = await copyToClipboard(output);
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };
  const addRow = () => setUrls([...urls, { url: "", freq: "weekly", priority: "0.8" }]);
  const removeRow = (i: number) => setUrls(urls.filter((_, idx) => idx !== i));
  const updateRow = (i: number, key: string, val: string) => setUrls(urls.map((u, idx) => idx === i ? { ...u, [key]: val } : u));

  return (
    <div>
      <div className="mb-4 space-y-2">
        {urls.map((u, i) => (
          <div key={i} className="flex gap-2">
            <input type="text" value={u.url} onChange={(e) => updateRow(i, "url", e.target.value)} className="input flex-1" placeholder="https://example.com/page" />
            <select value={u.freq} onChange={(e) => updateRow(i, "freq", e.target.value)} className="input w-32"><option>always</option><option>hourly</option><option>daily</option><option>weekly</option><option>monthly</option><option>yearly</option><option>never</option></select>
            <input type="text" value={u.priority} onChange={(e) => updateRow(i, "priority", e.target.value)} className="input w-16" placeholder="0.8" />
            <button onClick={() => removeRow(i)} className="btn btn-sm btn-secondary shrink-0"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        ))}
        <button onClick={addRow} className="btn btn-sm btn-secondary"><Plus className="h-3.5 w-3.5" /> Add URL</button>
      </div>

      <div className="mb-2 flex items-center justify-between"><span className="label mb-0">sitemap.xml</span><button onClick={handleCopy} className={cn("btn btn-sm", copied ? "btn-primary" : "btn-secondary")}>{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? "Copied!" : "Copy"}</button></div>
      <pre className="overflow-x-auto rounded-xl border border-ink-200 bg-ink-50/50 p-4 text-xs dark:border-ink-700 dark:bg-ink-950/50 max-h-[300px]"><code className="font-mono text-ink-800 dark:text-ink-200">{output}</code></pre>
    </div>
  );
}
