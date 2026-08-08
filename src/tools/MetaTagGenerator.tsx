import { useState, useMemo } from "react";
import { Copy, Check } from "lucide-react";
import { cn, copyToClipboard } from "@/lib/utils";

export default function MetaTagGenerator() {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [url, setUrl] = useState("");
  const [image, setImage] = useState("");
  const [siteName, setSiteName] = useState("");
  const [twitterHandle, setTwitterHandle] = useState("");
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => {
    const tags: string[] = [];
    if (title) tags.push(`<title>${title}</title>`);
    if (desc) tags.push(`<meta name="description" content="${desc}" />`);
    if (url) tags.push(`<link rel="canonical" href="${url}" />`);
    if (siteName || title || url || image) {
      tags.push("");
      tags.push("<!-- Open Graph / Facebook -->");
      if (url) tags.push(`<meta property="og:url" content="${url}" />`);
      if (title) tags.push(`<meta property="og:title" content="${title}" />`);
      if (desc) tags.push(`<meta property="og:description" content="${desc}" />`);
      if (image) tags.push(`<meta property="og:image" content="${image}" />`);
      if (siteName) tags.push(`<meta property="og:site_name" content="${siteName}" />`);
      tags.push(`<meta property="og:type" content="website" />`);
    }
    if (twitterHandle || title || desc || image) {
      tags.push("");
      tags.push("<!-- Twitter -->");
      tags.push(`<meta name="twitter:card" content="summary_large_image" />`);
      if (twitterHandle) tags.push(`<meta name="twitter:site" content="${twitterHandle.startsWith("@") ? twitterHandle : "@" + twitterHandle}" />`);
      if (title) tags.push(`<meta name="twitter:title" content="${title}" />`);
      if (desc) tags.push(`<meta name="twitter:description" content="${desc}" />`);
      if (image) tags.push(`<meta name="twitter:image" content="${image}" />`);
    }
    return tags.join("\n");
  }, [title, desc, url, image, siteName, twitterHandle]);

  const handleCopy = async () => {
    if (!output) return;
    const ok = await copyToClipboard(output);
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  return (
    <div>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div><label className="label mb-1.5 block">Page Title</label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input" placeholder="My Awesome Page" /></div>
        <div><label className="label mb-1.5 block">Description</label><input type="text" value={desc} onChange={(e) => setDesc(e.target.value)} className="input" placeholder="A brief description of the page" maxLength={160} /></div>
        <div><label className="label mb-1.5 block">URL</label><input type="text" value={url} onChange={(e) => setUrl(e.target.value)} className="input" placeholder="https://example.com/page" /></div>
        <div><label className="label mb-1.5 block">Image URL</label><input type="text" value={image} onChange={(e) => setImage(e.target.value)} className="input" placeholder="https://example.com/image.jpg" /></div>
        <div><label className="label mb-1.5 block">Site Name</label><input type="text" value={siteName} onChange={(e) => setSiteName(e.target.value)} className="input" placeholder="My Website" /></div>
        <div><label className="label mb-1.5 block">Twitter Handle</label><input type="text" value={twitterHandle} onChange={(e) => setTwitterHandle(e.target.value)} className="input" placeholder="@myhandle" /></div>
      </div>

      {output && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="label mb-0">Generated Meta Tags</span>
            <button onClick={handleCopy} className={cn("btn btn-sm", copied ? "btn-primary" : "btn-secondary")}>{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? "Copied!" : "Copy"}</button>
          </div>
          <pre className="overflow-x-auto rounded-xl border border-ink-200 bg-ink-50/50 p-4 text-xs dark:border-ink-700 dark:bg-ink-950/50"><code className="font-mono text-ink-800 dark:text-ink-200">{output}</code></pre>
        </div>
      )}
    </div>
  );
}
