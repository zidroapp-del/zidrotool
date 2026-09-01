import { useState, useMemo } from "react";
import { Copy, Check, Hash, Sparkles } from "lucide-react";
import { cn, copyToClipboard } from "@/lib/utils";

const BASE_TAGS: Record<string, string[]> = {
  general: ["love", "instagood", "photooftheday", "fashion", "beautiful", "happy", "cute", "tbt", "followme", "follow", "picoftheday", "summer", "art", "instadaily", "friends", "repost", "nature", "girl", "fun"],
  youtube: ["youtube", "youtuber", "youtubechannel", "youtubecreator", "video", "subscribe", "vlog", "youtubestudio", "youtubecontent", "trending", "viral", "explore", "shorts", "ytshorts", "contentcreator"],
  tiktok: ["tiktok", "fyp", "foryou", "foryoupage", "viral", "trending", "tiktokdance", "tiktoktrend", "duet", "stitch", "tiktokviral", "fypシ", "explore", "creator", "tiktokcreator"],
  instagram: ["instagood", "instagram", "instadaily", "instalike", "instamood", "instafashion", "instafood", "instatravel", "instaphoto", "instapic", "photooftheday", "picoftheday", "bestoftheday", "instaquote", "instacreative"],
};

export default function HashtagGenerator({ slug }: { slug?: string }) {
  const platform = slug?.startsWith("yt") ? "youtube" : slug?.startsWith("tt") ? "tiktok" : slug?.startsWith("ig") ? "instagram" : "general";
  const [keyword, setKeyword] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const hashtags = useMemo(() => {
    const kw = keyword.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    const base = BASE_TAGS[platform] || BASE_TAGS.general;
    const kwTags = kw ? [kw, `${kw}love`, `${kw}life`, `${kw}gram`, `${kw}oftheday`, `${kw}community`, `${kw}daily`, `${kw}vibes`] : [];
    return [...new Set([...kwTags, ...base])].slice(0, 30);
  }, [keyword, platform]);

  const handleCopy = async (tag: string) => {
    const ok = await copyToClipboard(`#${tag}`);
    if (ok) { setCopied(tag); setTimeout(() => setCopied(null), 2000); }
  };
  const handleCopyAll = async () => {
    const ok = await copyToClipboard(hashtags.map((h) => `#${h}`).join(" "));
    if (ok) { setCopied("all"); setTimeout(() => setCopied(null), 2000); }
  };

  return (
    <div>
      <div className="mb-4">
        <label className="label mb-2 block"><Hash className="mr-1 inline h-4 w-4" />Keyword (optional)</label>
        <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} className="input" placeholder="e.g. travel, fitness, food..." />
      </div>
      <button onClick={handleCopyAll} disabled={!hashtags.length} className={cn("btn w-full", copied === "all" ? "btn-primary" : "btn-secondary")}><Sparkles className="h-4 w-4" /> {copied === "all" ? "All Copied!" : "Copy All Hashtags"}</button>
      <div className="mt-6 flex flex-wrap gap-2">
        {hashtags.map((tag) => (
          <button key={tag} onClick={() => handleCopy(tag)} className={cn("rounded-full px-3 py-1.5 text-sm font-medium transition-all", copied === tag ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-700 hover:bg-brand-100 hover:text-brand-700 dark:bg-ink-800 dark:text-ink-300")}>
            #{tag} {copied === tag && <Check className="ml-1 inline h-3 w-3" />}
          </button>
        ))}
      </div>
      <p className="mt-4 text-xs text-ink-400">{hashtags.length} hashtags generated for {platform}</p>
    </div>
  );
}
