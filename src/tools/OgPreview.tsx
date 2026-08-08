import { useState } from "react";
import { Globe } from "lucide-react";

export default function OgPreview() {
  const [url, setUrl] = useState("https://example.com");
  const [title, setTitle] = useState("Your Page Title");
  const [desc, setDesc] = useState("Your page description goes here. This is what appears in social media previews.");
  const [image, setImage] = useState("");

  return (
    <div>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div><label className="label mb-1.5 block">URL</label><input type="text" value={url} onChange={(e) => setUrl(e.target.value)} className="input" /></div>
        <div><label className="label mb-1.5 block">Title</label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input" /></div>
        <div className="sm:col-span-2"><label className="label mb-1.5 block">Description</label><input type="text" value={desc} onChange={(e) => setDesc(e.target.value)} className="input" maxLength={160} /></div>
        <div className="sm:col-span-2"><label className="label mb-1.5 block">Image URL</label><input type="text" value={image} onChange={(e) => setImage(e.target.value)} className="input" placeholder="https://example.com/image.jpg" /></div>
      </div>

      <h3 className="mb-3 text-sm font-semibold text-ink-900 dark:text-ink-100">Preview</h3>

      {/* Facebook preview */}
      <div className="mb-6 max-w-lg overflow-hidden rounded-xl border border-ink-200 dark:border-ink-700">
        <div className="flex aspect-[1.91/1] items-center justify-center bg-ink-100 dark:bg-ink-800">
          {image ? <img src={image} alt="OG" className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} /> : <Globe className="h-12 w-12 text-ink-300" />}
        </div>
        <div className="bg-ink-50 p-3 dark:bg-ink-900/50">
          <p className="text-[10px] uppercase text-ink-400">{new URL(url.startsWith("http") ? url : "https://" + url).hostname}</p>
          <p className="mt-0.5 truncate text-sm font-semibold text-ink-900 dark:text-ink-100">{title}</p>
          <p className="mt-0.5 line-clamp-2 text-xs text-ink-500 dark:text-ink-400">{desc}</p>
        </div>
      </div>

      {/* Twitter preview */}
      <div className="max-w-lg overflow-hidden rounded-xl border border-ink-200 dark:border-ink-700">
        <div className="flex aspect-[1.91/1] items-center justify-center bg-ink-100 dark:bg-ink-800">
          {image ? <img src={image} alt="Twitter" className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} /> : <Globe className="h-12 w-12 text-ink-300" />}
        </div>
        <div className="p-3">
          <p className="text-[10px] uppercase text-ink-400">{new URL(url.startsWith("http") ? url : "https://" + url).hostname}</p>
          <p className="mt-0.5 truncate text-sm font-semibold text-ink-900 dark:text-ink-100">{title}</p>
          <p className="mt-0.5 line-clamp-2 text-xs text-ink-500 dark:text-ink-400">{desc}</p>
        </div>
      </div>
    </div>
  );
}
