import { useState, useMemo } from "react";
import { Copy, Check } from "lucide-react";
import { cn, copyToClipboard } from "@/lib/utils";

export default function RobotsGenerator() {
  const [userAgent, setUserAgent] = useState("*");
  const [allow, setAllow] = useState("");
  const [disallow, setDisallow] = useState("/admin/\n/private/");
  const [sitemap, setSitemap] = useState("");
  const [crawlDelay, setCrawlDelay] = useState("");
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => {
    const lines: string[] = [];
    lines.push(`User-agent: ${userAgent || "*"}`);
    if (allow.trim()) allow.trim().split("\n").forEach((p) => p.trim() && lines.push(`Allow: ${p.trim()}`));
    if (disallow.trim()) disallow.trim().split("\n").forEach((p) => p.trim() && lines.push(`Disallow: ${p.trim()}`));
    if (crawlDelay.trim()) lines.push(`Crawl-delay: ${crawlDelay.trim()}`);
    lines.push("");
    if (sitemap.trim()) lines.push(`Sitemap: ${sitemap.trim()}`);
    return lines.join("\n");
  }, [userAgent, allow, disallow, sitemap, crawlDelay]);

  const handleCopy = async () => {
    const ok = await copyToClipboard(output);
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  return (
    <div>
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div><label className="label mb-1.5 block">User-agent</label><input type="text" value={userAgent} onChange={(e) => setUserAgent(e.target.value)} className="input" placeholder="*" /></div>
        <div><label className="label mb-1.5 block">Crawl delay (optional)</label><input type="text" value={crawlDelay} onChange={(e) => setCrawlDelay(e.target.value)} className="input" placeholder="10" /></div>
      </div>
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div><label className="label mb-1.5 block">Allow paths (one per line)</label><textarea value={allow} onChange={(e) => setAllow(e.target.value)} className="input min-h-[80px] resize-y font-mono text-sm" placeholder="/public/" /></div>
        <div><label className="label mb-1.5 block">Disallow paths (one per line)</label><textarea value={disallow} onChange={(e) => setDisallow(e.target.value)} className="input min-h-[80px] resize-y font-mono text-sm" placeholder="/admin/" /></div>
      </div>
      <div className="mb-4"><label className="label mb-1.5 block">Sitemap URL</label><input type="text" value={sitemap} onChange={(e) => setSitemap(e.target.value)} className="input" placeholder="https://example.com/sitemap.xml" /></div>

      <div className="mb-2 flex items-center justify-between"><span className="label mb-0">robots.txt</span><button onClick={handleCopy} className={cn("btn btn-sm", copied ? "btn-primary" : "btn-secondary")}>{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? "Copied!" : "Copy"}</button></div>
      <pre className="overflow-x-auto rounded-xl border border-ink-200 bg-ink-50/50 p-4 text-sm dark:border-ink-700 dark:bg-ink-950/50"><code className="font-mono text-ink-800 dark:text-ink-200">{output}</code></pre>
    </div>
  );
}
