import { useState } from "react";
import { Search } from "lucide-react";

export default function SerpPreview() {
  const [title, setTitle] = useState("Your Page Title - Keep It Under 60 Characters");
  const [url, setUrl] = useState("https://example.com/your-page");
  const [desc, setDesc] = useState("Your meta description appears here. Keep it under 160 characters for best results in Google search results.");

  const titleColor = title.length > 60 ? "text-danger" : "text-success-700 dark:text-success-600";
  const descColor = desc.length > 160 ? "text-danger" : "text-success-700 dark:text-success-600";

  return (
    <div>
      <div className="mb-6 space-y-4">
        <div>
          <label className="label mb-1.5 block">Title <span className={`text-xs ${titleColor}`}>{title.length}/60</span></label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input" maxLength={70} />
        </div>
        <div>
          <label className="label mb-1.5 block">URL</label>
          <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} className="input" />
        </div>
        <div>
          <label className="label mb-1.5 block">Description <span className={`text-xs ${descColor}`}>{desc.length}/160</span></label>
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} className="input min-h-[60px] resize-y" maxLength={170} />
        </div>
      </div>

      <h3 className="mb-3 text-sm font-semibold text-ink-900 dark:text-ink-100">Google SERP Preview</h3>
      <div className="max-w-2xl rounded-xl border border-ink-200 p-4 dark:border-ink-700">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-100 dark:bg-ink-800"><Search className="h-4 w-4 text-ink-400" /></div>
          <div>
            <p className="text-xs text-ink-500 dark:text-ink-400">Example Site</p>
            <p className="text-xs text-success-700 dark:text-success-600">{url}</p>
          </div>
        </div>
        <h3 className="mt-1.5 text-lg text-brand-700 hover:underline dark:text-brand-400 cursor-pointer">{title}</h3>
        <p className="mt-0.5 text-sm text-ink-600 dark:text-ink-400">{desc}</p>
      </div>
    </div>
  );
}
