import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import {
  AlertCircle, BarChart3, Check, ClipboardPaste, Clock, Copy, Dices, Download, ExternalLink, Eye, Hash, History,
  Link2, Loader2, MessageCircle, Play, RefreshCw, Search, Shield, Sparkles, ThumbsUp, Users, Video, Wand2, X, Zap,
} from "lucide-react";
import { useToast } from "@/components/Toast";
import { copyToClipboard, downloadFile } from "@/lib/utils";
import { SeoToolShell, seoBtn, seoCard, seoField } from "@/components/SeoToolShell";

/* ------------------------------------------------------------------ slugs */
const VIDEO_SLUGS = new Set([
  "youtube-region-restriction-checker", "youtube-tag-extractor", "youtube-hashtag-extractor", "youtube-title-extractor",
  "youtube-description-extractor", "youtube-video-statistics", "youtube-views-ratio-calculator",
]);
const CHANNEL_SLUGS = new Set([
  "youtube-channel-finder", "youtube-channel-statistics", "youtube-channel-id-extractor", "youtube-channel-logo-downloader",
  "youtube-channel-banner-downloader", "youtube-video-count-checker", "youtube-channel-age-checker",
]);
const SEARCH_SLUGS = new Set(["youtube-tag-generator", "youtube-hashtag-generator", "youtube-title-generator"]);
const TEXT_OR_VIDEO_SLUGS = new Set(["youtube-title-length-checker", "youtube-video-title-capitalizer"]);
const VIDEO_LINK_SLUGS = new Set(["youtube-embed-code-generator", "youtube-timestamp-link-generator"]);

type Cfg = { label: string; placeholder: string; button: string; example: string; multiline?: boolean; kind: "video" | "channel" | "text" };
const BASE: Record<string, Cfg> = {
  video: { label: "YouTube video link", placeholder: "Paste a video link, e.g. https://www.youtube.com/watch?v=...", button: "Extract", example: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", kind: "video" },
  channel: { label: "Channel link, @handle or channel ID", placeholder: "https://www.youtube.com/@channel  or  @channel", button: "Get data", example: "https://www.youtube.com/@YouTube", kind: "channel" },
  generate: { label: "Topic or main keyword", placeholder: "e.g. home workout for beginners", button: "Generate", example: "home workout for beginners", kind: "text" },
};
const LOCAL: Record<string, Cfg> = {
  "youtube-embed-code-generator": { ...BASE.video, button: "Generate code" },
  "youtube-timestamp-link-generator": { ...BASE.video, button: "Create link" },
  "youtube-subscribe-link-generator": { ...BASE.channel, placeholder: "@yourchannel", button: "Create link", example: "@YouTube" },
  "youtube-money-calculator": { label: "Monthly or total views", placeholder: "e.g. 100000", button: "Estimate", example: "100000", kind: "text" },
  "youtube-comment-picker": { label: "Comments (one per line)", placeholder: "Paste the comments or usernames here, one per line", button: "Pick winner", example: "Alice\nBob\nCarla\nDavid\nEmma", kind: "text", multiline: true },
  "youtube-title-length-checker": { label: "Video link or title text", placeholder: "Paste a video link, or type the title you want to check", button: "Check", example: "How to Start a YouTube Channel in 2026 (Step by Step)", kind: "text" },
  "youtube-video-title-capitalizer": { label: "Video link or title text", placeholder: "Paste a video link, or type the title you want to fix", button: "Capitalize", example: "how to start a youtube channel in 2026 step by step", kind: "text" },
};

const TITLES: Record<string, string> = {
  "youtube-tag-extractor": "Pull the hidden tags out of any video",
  "youtube-tag-generator": "Get tag ideas from videos that already rank",
  "youtube-hashtag-extractor": "See the hashtags a video uses",
  "youtube-hashtag-generator": "Hashtags that fit your topic",
  "youtube-title-extractor": "Copy a video's exact title",
  "youtube-video-statistics": "Views, likes, comments and more for any video",
  "youtube-channel-statistics": "Subscribers, videos and views for any channel",
  "youtube-subscribe-link-generator": "A link that asks people to subscribe instantly",
  "youtube-description-extractor": "Copy a video's full description",
  "youtube-title-generator": "Title inspiration from top-ranking videos",
  "youtube-money-calculator": "Estimate earnings from your views",
};

/* ---------------------------------------------------------------- helpers */
async function api(action: string, params: Record<string, string>) {
  const qs = new URLSearchParams({ action, ...params });
  const r = await fetch(`/api/youtube?${qs}`, { headers: { accept: "application/json" } });
  const raw = await r.text();
  let j: any;
  try { j = JSON.parse(raw); } catch { throw new Error(`YouTube returned an unexpected response (HTTP ${r.status}). Try again in a moment.`); }
  if (!r.ok || !j.ok) throw new Error(j.error || `Request failed (HTTP ${r.status})`);
  return j.data;
}

function videoId(input: string) {
  const s = input.trim();
  try {
    const u = new URL(s);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1).split("/")[0];
    return u.searchParams.get("v") || u.pathname.match(/\/(?:embed|shorts|live|v)\/([\w-]{11})/)?.[1] || "";
  } catch {
    return /^[\w-]{11}$/.test(s) ? s : "";
  }
}
const looksLikeChannel = (s: string) => /^@?[\w.-]{3,}$/.test(s.trim()) || /youtube\.com\/(@|channel\/|c\/|user\/)/i.test(s) || /^UC[\w-]{22}$/.test(s.trim());

const STOP = new Set(("a an and are as at be by for from how i in is it its of on or that the this to was what when where which who why will with you your " +
  "my me we our can do does did not no yes vs new best top video videos official full").split(" "));

const nf = (n: unknown) => (n == null || n === "" ? "Unavailable" : Number(n).toLocaleString());
const dur = (s: number) => {
  if (!s) return "—";
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${m}:${String(sec).padStart(2, "0")}`;
};
const when = (iso: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
};
const SMALL = new Set("a an and as at but by for in nor of on or the to up vs via".split(" "));
function titleCase(s: string) {
  return s.toLowerCase().replace(/[\p{L}\p{N}'’]+/gu, (w, i) => (i > 0 && SMALL.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)));
}
function toSeconds(v: string) {
  const p = v.trim().split(":").map((x) => Number(x));
  if (!p.length || p.some((x) => isNaN(x))) return 0;
  return p.reduce((a, x) => a * 60 + x, 0);
}
function minePhrases(titles: string[], seed: string) {
  const seedWords = new Set(seed.toLowerCase().match(/[\p{L}\p{N}]+/gu) || []);
  const uni = new Map<string, number>(), bi = new Map<string, number>();
  for (const t of titles) {
    const w = (t.toLowerCase().match(/[\p{L}\p{N}]+/gu) || []).filter((x) => x.length > 2);
    w.forEach((x, i) => {
      if (!STOP.has(x) && !seedWords.has(x)) uni.set(x, (uni.get(x) || 0) + 1);
      if (i < w.length - 1 && !STOP.has(x) && !STOP.has(w[i + 1])) {
        const k = `${x} ${w[i + 1]}`;
        bi.set(k, (bi.get(k) || 0) + 1);
      }
    });
  }
  const top = (m: Map<string, number>, min: number) => [...m.entries()].filter(([, c]) => c >= min).sort((a, b) => b[1] - a[1]).map(([k]) => k);
  return { words: top(uni, 2), phrases: top(bi, 2) };
}

function useCountUp(target: number | null, run = true) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (target == null || !run) return;
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || target < 20) { setV(target); return; }
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / 900);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, run]);
  return v;
}

function readHist(key: string): string[] {
  try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; }
}
function writeHist(key: string, val: string) {
  try {
    const next = [val, ...readHist(key).filter((x) => x !== val)].slice(0, 5);
    localStorage.setItem(key, JSON.stringify(next));
    return next;
  } catch { return [val]; }
}

/* ------------------------------------------------------------------- bits */
const CSS = `
.zyt { min-width: 0; max-width: 100%; }
.zyt * { min-width: 0; }
.zyt-row { display: flex; flex-wrap: wrap; gap: .75rem; align-items: flex-start; }
.zyt-row > .zyt-grow { flex: 1 1 15rem; }
.zyt-row > .zyt-fixed { flex: 0 1 10rem; }
.zyt-grid { display: grid; gap: .75rem; grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr)); }
.zyt-head { display: flex; flex-wrap: wrap; gap: 1rem; }
.zyt-head > .zyt-thumb { flex: 0 1 16rem; }
.zyt-head > .zyt-meta { flex: 1 1 14rem; align-self: center; }
.zyt-tile { transition: transform .25s cubic-bezier(.16,1,.3,1), box-shadow .25s, border-color .25s; cursor: pointer; text-align: left; }
.zyt-tile:hover { transform: translateY(-3px); box-shadow: 0 16px 30px -18px rgba(79,70,229,.55); border-color: rgba(99,102,241,.55); }
.zyt-tile:active { transform: translateY(-1px) scale(.99); }
.zyt-skel { position: relative; overflow: hidden; background: rgba(99,102,241,.1); border-radius: 1rem; }
.zyt-skel::after { content: ""; position: absolute; inset: 0; background: linear-gradient(100deg, transparent 20%, rgba(255,255,255,.55) 50%, transparent 80%); transform: translateX(-100%); animation: zyt-skel 1.3s ease-in-out infinite; }
@keyframes zyt-skel { to { transform: translateX(100%); } }
.zyt-step { transition: opacity .3s, transform .3s; }
.zyt-ok { animation: zyt-pop .35s cubic-bezier(.16,1,.3,1); }
@keyframes zyt-pop { from { transform: scale(.7); opacity: 0; } to { transform: none; opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .zyt *, .zyt *::before, .zyt *::after { animation: none !important; transition: none !important; } }
`;

function Tile({ icon, label, value, i = 0, count, onCopy }: { icon?: ReactNode; label: string; value: ReactNode; i?: number; count?: number | null; onCopy: (text: string) => void }) {
  const n = useCountUp(count ?? null);
  const shown = count != null ? n.toLocaleString() : value;
  return (
    <button type="button" onClick={() => onCopy(String(count != null ? count : value))} title="Click to copy"
      className="zyt-tile zseo-rise group rounded-2xl border border-indigo-100/80 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5" style={{ ["--i" as any]: i }}>
      <div className="flex items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-wide text-indigo-600/80 dark:text-indigo-300/80">
        <span className="flex items-center gap-1.5">{icon}{label}</span>
        <Copy className="h-3 w-3 opacity-0 transition group-hover:opacity-70" />
      </div>
      <div className="mt-1.5 break-words text-lg font-extrabold tabular-nums text-slate-900 dark:text-white">{shown}</div>
    </button>
  );
}

function VideoHeader({ r, id }: { r: any; id: string }) {
  const vid = r.id || id;
  const thumb = vid ? `https://i.ytimg.com/vi/${vid}/hqdefault.jpg` : "";
  return (
    <div className={`${seoCard} zseo-rise zyt-head p-4`}>
      {thumb && (
        <div className="zyt-thumb relative aspect-video overflow-hidden rounded-2xl bg-slate-200">
          <img src={thumb} alt={r.title || "Video thumbnail"} className="h-full w-full object-cover" loading="lazy" />
          {r.lengthSeconds ? <span className="absolute bottom-2 right-2 rounded-md bg-black/75 px-1.5 py-0.5 text-xs font-semibold text-white">{dur(r.lengthSeconds)}</span> : null}
        </div>
      )}
      <div className="zyt-meta">
        <h3 className="text-lg font-bold leading-snug text-slate-900 dark:text-white">{r.title || "Untitled video"}</h3>
        {r.channelTitle && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{r.channelTitle}</p>}
        {vid && <a className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-300" href={`https://www.youtube.com/watch?v=${vid}`} target="_blank" rel="noreferrer">Open on YouTube <ExternalLink className="h-3.5 w-3.5" /></a>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- main */
export default function YouTubeTools({ slug: propSlug }: { slug?: string }) {
  const { slug: routeSlug } = useParams<{ slug: string }>();
  const slug = propSlug || routeSlug || "";
  const { success, error } = useToast();

  const [input, setInput] = useState("");
  const [extra, setExtra] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [winners, setWinners] = useState(1);
  const [embedW, setEmbedW] = useState(560);
  const [copied, setCopied] = useState("");
  const [filter, setFilter] = useState("");
  const [sep, setSep] = useState<"comma" | "line" | "space">("comma");
  const [sort, setSort] = useState<"orig" | "az" | "len">("orig");
  const [hist, setHist] = useState<string[]>([]);
  const [phase, setPhase] = useState(0);
  const lastRun = useRef("");

  const isVideo = VIDEO_SLUGS.has(slug) || TEXT_OR_VIDEO_SLUGS.has(slug);
  const isChannel = CHANNEL_SLUGS.has(slug);
  const isSearch = SEARCH_SLUGS.has(slug);
  const c: Cfg = LOCAL[slug] || (isSearch || slug === "youtube-description-generator" ? BASE.generate : isChannel ? BASE.channel : BASE.video);
  const needsTime = slug === "youtube-timestamp-link-generator";
  const needsRpm = slug === "youtube-money-calculator";
  const histKey = `zidro-yt-hist:${slug}`;
  const heading = TITLES[slug] || "Paste a link and get the result in seconds";

  useEffect(() => { setHist(readHist(histKey)); }, [histKey]);
  useEffect(() => { setInput(""); setExtra(""); setResult(null); setErrMsg(""); setSelected([]); setPicked([]); setFilter(""); }, [slug]);
  useEffect(() => {
    if (!loading) return;
    setPhase(0);
    const a = setTimeout(() => setPhase(1), 900), b = setTimeout(() => setPhase(2), 2200);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [loading]);

  const reset = () => { setResult(null); setSelected([]); setPicked([]); setErrMsg(""); setFilter(""); };

  const check = useMemo(() => {
    const s = input.trim();
    if (!s || c.multiline) return null;
    if (c.kind === "video" && (isVideo || VIDEO_LINK_SLUGS.has(slug))) { const id = videoId(s); return id ? { ok: true, text: `Video found · ${id}` } : { ok: false, text: "That doesn't look like a YouTube video link yet" }; }
    if (c.kind === "channel") return looksLikeChannel(s) ? { ok: true, text: "Channel format looks good" } : { ok: false, text: "Use a channel link, @handle or channel ID" };
    return null;
  }, [input, c, isVideo, slug]);

  const doPick = (list0?: string) => {
    const list = [...new Set<string>((list0 ?? input).split(/\r?\n/).map((x) => x.trim()).filter(Boolean))];
    if (!list.length) return;
    const pool = [...list];
    const o: string[] = [];
    for (let i = 0; i < Math.min(winners, pool.length); i++) o.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    setPicked(o);
    setResult({ local: true, total: list.length });
  };

  const run = async (value?: string) => {
    const v = (value ?? input).trim();
    if (!v) { setErrMsg(c.multiline ? "Paste at least one comment first." : "Type or paste something in the box first."); return; }
    lastRun.current = v;
    reset();
    setLoading(true);
    try {
      if (TEXT_OR_VIDEO_SLUGS.has(slug)) {
        setResult(videoId(v) ? await api("video", { url: v }) : { title: v, raw: true });
      } else if (VIDEO_SLUGS.has(slug)) setResult(await api("video", { url: v }));
      else if (isChannel) setResult(await api("channel", { url: v }));
      else if (isSearch) setResult({ search: await api("search", { q: v }) });
      else if (slug === "youtube-comment-picker") doPick(v);
      else setResult({ local: true });
      if (!c.multiline) setHist(writeHist(histKey, v));
    } catch (e: any) {
      setErrMsg(e?.message || "Could not load YouTube data.");
    } finally {
      setLoading(false);
    }
  };

  const doCopy = async (text: string, key = "main") => {
    if (await copyToClipboard(text)) { success("Copied to clipboard"); setCopied(key); setTimeout(() => setCopied(""), 1600); }
    else error("Copy failed. Select the text and copy it manually.");
  };

  const paste = async () => {
    try {
      const t = (await navigator.clipboard.readText()).trim();
      if (!t) return;
      setInput(t);
      if (!c.multiline && (c.kind !== "text") && !needsTime) run(t);
    } catch { error("Your browser blocked clipboard access. Paste with Ctrl+V instead."); }
  };

  /* ---- build the output for the current tool ---- */
  const out = useMemo(() => {
    if (!result) return null;
    const r = result;
    const id = r.id || videoId(input);

    if (slug === "youtube-tag-extractor") {
      const tags: string[] = r.keywords || [];
      return { kind: "chips" as const, header: true, chips: tags, empty: "This video has no public tags. Creators can hide them, and YouTube does not show them on the page.", meter: tags.join(",").length, meterMax: 500, meterLabel: "characters of the 500 limit", file: "youtube-tags.txt", tags: true };
    }
    if (slug === "youtube-hashtag-extractor") {
      const h: string[] = [...new Set<string>(((r.description || "") + " " + (r.title || "")).match(/#[\p{L}\p{N}_-]+/gu) || [])];
      return { kind: "chips" as const, header: true, chips: h, empty: "No hashtags found in the title or description.", file: "youtube-hashtags.txt" };
    }
    if (slug === "youtube-title-extractor") return { kind: "text" as const, header: true, text: r.title || "", meter: (r.title || "").length, meterMax: 100, meterLabel: "characters (limit 100)", file: "youtube-title.txt" };
    if (slug === "youtube-description-extractor") return { kind: "text" as const, header: true, text: r.description || "", meter: (r.description || "").length, meterMax: 5000, meterLabel: "characters (limit 5,000)", file: "youtube-description.txt", tall: true };
    if (slug === "youtube-video-statistics") {
      return {
        kind: "tiles" as const, header: true, file: "video-statistics",
        tiles: [
          [<Eye className="h-3.5 w-3.5" />, "Views", nf(r.viewCount), r.viewCount ?? null],
          [<ThumbsUp className="h-3.5 w-3.5" />, "Likes", nf(r.likeCount), r.likeCount ?? null],
          [<MessageCircle className="h-3.5 w-3.5" />, "Comments", nf(r.commentCount), r.commentCount ?? null],
          [<Clock className="h-3.5 w-3.5" />, "Duration", dur(r.lengthSeconds), null],
          [null, "Published", when(r.publishedAt), null],
          [null, "Category", r.category || r.categoryId || "—", null],
          [null, "Language", r.defaultLanguage || "—", null],
          [null, "Video ID", r.id || id || "—", null],
        ] as any[],
        note: r.statsAvailable === false ? "Only basic public data is available: likes and comments need the YouTube Data API key on the server." : "",
      };
    }
    if (slug === "youtube-views-ratio-calculator") {
      const v = Number(r.viewCount) || 0;
      const pct = (x: unknown) => (v && x != null ? `${((Number(x) / v) * 100).toFixed(2)}%` : "—");
      const eng = v && r.likeCount != null ? (((Number(r.likeCount) + Number(r.commentCount || 0)) / v) * 100) : null;
      return {
        kind: "tiles" as const, header: true, file: "views-ratio",
        bar: eng,
        tiles: [
          [<Eye className="h-3.5 w-3.5" />, "Views", nf(r.viewCount), r.viewCount ?? null],
          [<ThumbsUp className="h-3.5 w-3.5" />, "Likes", nf(r.likeCount), r.likeCount ?? null],
          [<MessageCircle className="h-3.5 w-3.5" />, "Comments", nf(r.commentCount), r.commentCount ?? null],
          [<BarChart3 className="h-3.5 w-3.5" />, "Like rate", pct(r.likeCount), null],
          [<BarChart3 className="h-3.5 w-3.5" />, "Comment rate", pct(r.commentCount), null],
          [<BarChart3 className="h-3.5 w-3.5" />, "Engagement", eng != null ? `${eng.toFixed(2)}%` : "—", null],
        ] as any[],
        note: r.statsAvailable === false ? "Likes and comments are not exposed without the YouTube Data API key." : "Rates are likes or comments divided by views.",
      };
    }
    if (slug === "youtube-region-restriction-checker") {
      const ok = r.playability === "OK";
      return {
        kind: "tiles" as const, header: true, file: "region-check", status: ok,
        tiles: [[null, "Playback status", ok ? "Playable" : r.playability || "Unknown", null], [null, "Details", ok ? "Playable from the tool's server region." : r.playabilityReason || "Restricted or unavailable.", null]] as any[],
        note: "Availability can still differ by country, account, age and YouTube policy.",
      };
    }
    if (slug === "youtube-title-length-checker" || slug === "youtube-video-title-capitalizer") {
      const t: string = r.title || "";
      if (slug === "youtube-video-title-capitalizer") return { kind: "text" as const, header: !r.raw, text: titleCase(t), file: "youtube-title.txt" };
      const n = t.length;
      return { kind: "text" as const, header: !r.raw, text: t, meter: n, meterMax: 100, meterLabel: "characters (limit 100)", file: "youtube-title.txt",
        advice: n === 0 ? "" : n <= 60 ? "Great: the whole title usually shows in search results." : n <= 100 ? "Allowed, but part of it may be cut off in search results (around 60 characters)." : "Too long: YouTube allows 100 characters at most." };
    }
    if (isChannel) {
      return {
        kind: "channel" as const, file: "channel-data",
        tiles: [
          [<Users className="h-3.5 w-3.5" />, "Subscribers", r.subscriberText || "—", r.subscriberCount ?? null],
          [<Video className="h-3.5 w-3.5" />, "Videos", r.videosText || "—", r.videoCount ?? null],
          [<Eye className="h-3.5 w-3.5" />, "Total views", r.viewCount ? nf(r.viewCount) : "—", r.viewCount || null],
          [<Clock className="h-3.5 w-3.5" />, "Joined", r.joinedDate ? (r.joinedDate.length > 10 && !isNaN(new Date(r.joinedDate).getTime()) ? when(r.joinedDate) : r.joinedDate) : "Not exposed on the public page", null],
          [<Hash className="h-3.5 w-3.5" />, "Channel ID", r.channelId || "—", null],
        ] as any[],
        image: slug === "youtube-channel-logo-downloader" ? r.avatar : slug === "youtube-channel-banner-downloader" ? r.banner : "",
        wantImage: slug === "youtube-channel-logo-downloader" || slug === "youtube-channel-banner-downloader",
      };
    }
    if (slug === "youtube-tag-generator") {
      const titles: string[] = (r.search || []).map((x: any) => x.title);
      const { words, phrases } = minePhrases(titles, input);
      const k = input.trim().toLowerCase();
      const tags = [...new Set<string>([k, `${k} tutorial`, `${k} for beginners`, `how to ${k}`, `${k} tips`, `${k} guide`, ...phrases.slice(0, 8), ...words.slice(0, 8).map((w) => `${k} ${w}`)])].filter(Boolean);
      return { kind: "chips" as const, chips: tags, meter: tags.join(",").length, meterMax: 500, meterLabel: "characters of the 500 limit", file: "youtube-tags.txt", tags: true, hint: "Click the tags you like to select them, then copy." };
    }
    if (slug === "youtube-hashtag-generator") {
      const titles: string[] = (r.search || []).map((x: any) => x.title);
      const { words } = minePhrases(titles, input);
      const seed = input.toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
      const tags = [...new Set<string>([seed.join(""), ...seed, ...words.slice(0, 10)].filter((x) => x.length > 1).map((x) => `#${x}`))];
      return { kind: "chips" as const, chips: tags, file: "youtube-hashtags.txt", hint: "3 to 5 hashtags work best. The first three appear above your title." };
    }
    if (slug === "youtube-title-generator") return { kind: "titles" as const, items: r.search || [] };
    if (slug === "youtube-description-generator") {
      const k = input.trim();
      return { kind: "text" as const, tall: true, file: "youtube-description.txt", text: `${k}\n\nIn this video you will learn everything about ${k}. Watch until the end for the key takeaways.\n\n⏱ Timestamps\n00:00 Introduction\n00:45 Main point\n\n🔔 Subscribe for more videos about ${k}\n\n🌐 Website: add your link here\n📩 Business: add your email here\n\n#${k.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "")}` };
    }
    if (slug === "youtube-embed-code-generator") {
      const v = videoId(input);
      if (!v) return { kind: "error" as const, text: "We could not find a video ID in that link." };
      const h = Math.round((embedW * 9) / 16);
      return { kind: "text" as const, file: "embed.html", mono: true, preview: v, text: `<iframe width="${embedW}" height="${h}" src="https://www.youtube.com/embed/${v}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>` };
    }
    if (slug === "youtube-timestamp-link-generator") {
      const v = videoId(input);
      if (!v) return { kind: "error" as const, text: "We could not find a video ID in that link." };
      const s = toSeconds(extra || "0");
      return { kind: "text" as const, file: "timestamp-link.txt", text: `https://www.youtube.com/watch?v=${v}&t=${s}s`, hint: `Starts at ${s ? dur(s) : "0:00"}. Short form: https://youtu.be/${v}?t=${s}` };
    }
    if (slug === "youtube-subscribe-link-generator") {
      const s = input.trim();
      let base = "";
      if (/^UC[\w-]{22}$/.test(s)) base = `https://www.youtube.com/channel/${s}`;
      else {
        try { const u = new URL(s); base = `https://www.youtube.com${u.pathname.replace(/\/+$/, "")}`; }
        catch { base = `https://www.youtube.com/@${s.replace(/^@/, "")}`; }
      }
      const link = `${base}?sub_confirmation=1`;
      return { kind: "text" as const, file: "subscribe-link.txt", mono: true, text: `${link}\n\n<a href="${link}" target="_blank" rel="noopener">Subscribe to my channel</a>`, hint: "Anyone who opens this link is asked to confirm their subscription straight away." };
    }
    if (slug === "youtube-money-calculator") {
      const views = Number(input.replace(/[^0-9.]/g, "")) || 0;
      const custom = Number(extra) || 0;
      const t: any[] = [
        [<Eye className="h-3.5 w-3.5" />, "Views", views.toLocaleString(), views],
        [null, "Low · $1 RPM", `$${(views / 1000).toFixed(2)}`, null],
        [null, "Medium · $4 RPM", `$${((views * 4) / 1000).toFixed(2)}`, null],
        [null, "High · $10 RPM", `$${((views * 10) / 1000).toFixed(2)}`, null],
      ];
      if (custom) t.push([null, `Your RPM · $${custom}`, `$${((views * custom) / 1000).toFixed(2)}`, null]);
      return { kind: "tiles" as const, tiles: t, file: "earnings-estimate", note: "Estimates only. RPM is revenue per 1,000 views and varies by niche, country, audience and ad format." };
    }
    if (slug === "youtube-comment-picker") return { kind: "winners" as const };
    return null;
  }, [result, slug, input, extra, embedW, isChannel]);

  const exportTiles = (o: any, fmt: "csv" | "json") => {
    const rows = o.tiles.map((t: any[]) => [t[1], String(t[3] ?? t[2])]);
    if (fmt === "json") downloadFile(`${o.file || "data"}.json`, JSON.stringify(Object.fromEntries(rows), null, 2), "application/json");
    else downloadFile(`${o.file || "data"}.csv`, ["Metric,Value", ...rows.map((r: string[]) => `"${r[0]}","${r[1].replace(/"/g, '""')}"`)].join("\n"), "text/csv");
  };

  const joiner = sep === "comma" ? ", " : sep === "line" ? "\n" : " ";
  const hasOut = !!out || loading || !!errMsg;

  return (
    <div className="zyt">
      <style>{CSS}</style>
      <SeoToolShell>
        {/* ---------- header ---------- */}
        <div className="zseo-rise flex flex-wrap items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-3">
            <span className="zseo-ico grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg shadow-rose-500/30"><Play className="h-5 w-5 fill-white" /></span>
            <div>
              <p className="text-base font-extrabold leading-tight text-slate-900 dark:text-white">{heading}</p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                <span className="inline-flex items-center gap-1"><Zap className="h-3 w-3 text-amber-500" />Instant</span>
                <span className="inline-flex items-center gap-1"><Shield className="h-3 w-3 text-emerald-500" />Public data only</span>
                <span className="inline-flex items-center gap-1"><Check className="h-3 w-3 text-indigo-500" />Free, no sign-up</span>
              </p>
            </div>
          </div>
        </div>

        {/* ---------- input ---------- */}
        <div className={`${seoCard} zseo-rise p-4 sm:p-5`} style={{ ["--i" as any]: 1 }}>
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="yt-input" className="text-sm font-bold text-slate-800 dark:text-slate-100">{c.label}</label>
            <div className="flex items-center gap-1.5">
              <button type="button" className="rounded-lg px-2 py-1 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100/70 dark:text-indigo-200 dark:hover:bg-white/10" onClick={() => { setInput(c.example); setErrMsg(""); }}><Sparkles className="mr-1 inline h-3 w-3" />Try an example</button>
              {!c.multiline && <button type="button" className="rounded-lg px-2 py-1 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100/70 dark:text-indigo-200 dark:hover:bg-white/10" onClick={paste}><ClipboardPaste className="mr-1 inline h-3 w-3" />Paste</button>}
            </div>
          </div>
          <div className="zyt-row">
            <div className="zyt-grow relative">
              {c.multiline ? (
                <textarea id="yt-input" className={`${seoField} min-h-[150px]`} value={input} onChange={(e) => { setInput(e.target.value); setErrMsg(""); }} placeholder={c.placeholder} />
              ) : (
                <>
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input id="yt-input" className={`${seoField} pl-11 pr-10`} value={input}
                    onChange={(e) => { setInput(e.target.value); setErrMsg(""); }}
                    onKeyDown={(e) => e.key === "Enter" && run()}
                    onPaste={(e) => {
                      const t = e.clipboardData.getData("text").trim();
                      if (!needsTime && c.kind !== "text" && t && (videoId(t) || looksLikeChannel(t)) && t.includes("youtu")) { e.preventDefault(); setInput(t); run(t); }
                    }}
                    placeholder={c.placeholder} inputMode={needsRpm ? "numeric" : undefined} autoComplete="off" spellCheck={false} />
                  {input && <button type="button" onClick={() => { setInput(""); reset(); }} className="absolute right-3 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-white/10" aria-label="Clear"><X className="h-3.5 w-3.5" /></button>}
                </>
              )}
            </div>
            {needsTime && <input className={`${seoField} zyt-fixed`} value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="Start at 1:30" aria-label="Start time" />}
            {needsRpm && <input className={`${seoField} zyt-fixed`} value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="Your RPM ($)" inputMode="decimal" aria-label="Custom RPM" />}
            {slug === "youtube-embed-code-generator" && (
              <select className={`${seoField} zyt-fixed`} value={embedW} onChange={(e) => setEmbedW(Number(e.target.value))} aria-label="Width">
                {[400, 560, 640, 800, 1024].map((w) => <option key={w} value={w}>{w}px wide</option>)}
              </select>
            )}
            {slug === "youtube-comment-picker" && (
              <select className={`${seoField} zyt-fixed`} value={winners} onChange={(e) => setWinners(Number(e.target.value))} aria-label="Winners">
                {[1, 2, 3, 5, 10].map((w) => <option key={w} value={w}>{w} winner{w > 1 ? "s" : ""}</option>)}
              </select>
            )}
            <button onClick={() => run()} disabled={loading} className="zseo-shine inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-base font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {c.button}
            </button>
          </div>
          <div className="mt-2.5 flex min-h-[1.25rem] flex-wrap items-center gap-x-4 gap-y-1.5">
            {check && (
              <span key={check.text} className={`zyt-ok inline-flex items-center gap-1.5 text-xs font-semibold ${check.ok ? "text-emerald-600 dark:text-emerald-300" : "text-amber-600 dark:text-amber-300"}`}>
                {check.ok ? <Check className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}{check.text}
              </span>
            )}
            {hist.length > 0 && !c.multiline && (
              <span className="inline-flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <History className="h-3.5 w-3.5" />
                {hist.slice(0, 3).map((h) => (
                  <button key={h} type="button" onClick={() => { setInput(h); run(h); }} title={h}
                    className="max-w-[11rem] truncate rounded-full border border-indigo-200/70 bg-white/70 px-2.5 py-0.5 font-medium text-indigo-800 transition hover:border-indigo-400 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-indigo-100">
                    {h.replace(/^https?:\/\/(www\.)?/, "")}
                  </button>
                ))}
              </span>
            )}
          </div>
        </div>

        {/* ---------- error ---------- */}
        {errMsg && (
          <div className={`${seoCard} zseo-rise flex flex-wrap items-center gap-3 border-rose-200 p-4 text-rose-700 dark:text-rose-300`} role="alert">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="min-w-0 flex-1 text-sm font-medium">{errMsg}</p>
            {lastRun.current && <button className={seoBtn} onClick={() => run(lastRun.current)}><RefreshCw className="h-4 w-4" />Try again</button>}
          </div>
        )}

        {/* ---------- loading ---------- */}
        {loading && (
          <div className="space-y-3" aria-live="polite">
            <div className={`${seoCard} p-4`}>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                {["Contacting YouTube…", "Reading public data…", "Preparing your result…"][phase]}
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-indigo-100 dark:bg-white/10">
                <div className="zseo-fill h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${[30, 65, 90][phase]}%` }} />
              </div>
            </div>
            <div className="zyt-grid">{[0, 1, 2, 3].map((i) => <div key={i} className="zyt-skel h-20" />)}</div>
          </div>
        )}

        {/* ---------- empty ---------- */}
        {!hasOut && (
          <div className={`${seoCard} zseo-rise p-6 sm:p-8`}>
            <div className="zyt-grid">
              {[[Link2, "1. Paste", `Paste ${c.kind === "channel" ? "a channel link or @handle" : c.kind === "video" ? "a video link" : "your text"} above.`], [Wand2, "2. Run", `Press “${c.button}” or hit Enter.`], [Copy, "3. Use it", "Copy, download or click any card to copy it."]].map(([Icon, t, d]: any, i) => (
                <div key={t} className="zyt-step rounded-2xl border border-indigo-100/80 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
                  <span className="zseo-float grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/30" style={{ ["--i" as any]: i }}><Icon className="h-4 w-4" /></span>
                  <p className="mt-3 text-sm font-bold text-slate-900 dark:text-white">{t}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{d}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---------- results ---------- */}
        {!loading && out?.kind === "error" && (
          <div className={`${seoCard} zseo-rise flex items-center gap-3 p-5 text-rose-700 dark:text-rose-300`}><AlertCircle className="h-5 w-5" />{(out as any).text}</div>
        )}

        {!loading && out && (out as any).header && result && !result.raw && <VideoHeader r={result} id={videoId(input)} />}

        {!loading && out?.kind === "tiles" && (() => {
          const o = out as any;
          return (
            <div className="space-y-3">
              {o.status != null && (
                <div className={`zyt-ok ${seoCard} flex items-center gap-3 p-4 ${o.status ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}`}>
                  {o.status ? <Check className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                  <p className="text-sm font-bold">{o.status ? "This video can be played." : "This video may be restricted or unavailable."}</p>
                </div>
              )}
              <div className="zyt-grid">
                {o.tiles.map((t: any[], i: number) => <Tile key={t[1]} i={i} icon={t[0]} label={t[1]} value={t[2]} count={t[3]} onCopy={(x) => doCopy(x, t[1])} />)}
              </div>
              {o.bar != null && (
                <div className={`${seoCard} p-4`}>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200"><span>Engagement</span><span>{o.bar.toFixed(2)}% of views</span></div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-indigo-100 dark:bg-white/10"><div className="zseo-fill h-full rounded-full bg-gradient-to-r from-sky-400 via-indigo-500 to-violet-500" style={{ width: `${Math.min(100, o.bar * 10)}%` }} /></div>
                  <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">The bar fills completely at 10% engagement.</p>
                </div>
              )}
              {o.note && <p className="px-1 text-xs text-slate-500 dark:text-slate-400">{o.note}</p>}
              {o.file && (
                <div className="flex flex-wrap gap-2">
                  <button className={seoBtn} onClick={() => doCopy(o.tiles.map((t: any[]) => `${t[1]}: ${t[2]}`).join("\n"), "all")}>{copied === "all" ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}Copy all</button>
                  <button className={seoBtn} onClick={() => exportTiles(o, "csv")}><Download className="h-4 w-4" />CSV</button>
                  <button className={seoBtn} onClick={() => exportTiles(o, "json")}><Download className="h-4 w-4" />JSON</button>
                </div>
              )}
            </div>
          );
        })()}

        {!loading && out?.kind === "channel" && (() => {
          const o = out as any;
          return (
            <div className="space-y-4">
              <div className={`${seoCard} zseo-rise flex items-center gap-4 p-4`}>
                {result.avatar && <img src={result.avatar} alt={result.title} className="h-16 w-16 shrink-0 rounded-full border-2 border-white object-cover shadow-md" />}
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-bold text-slate-900 dark:text-white">{result.title || "Channel"}</h3>
                  {result.url && <a className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-300" href={result.url} target="_blank" rel="noreferrer">Open channel <ExternalLink className="h-3.5 w-3.5" /></a>}
                </div>
              </div>
              {o.wantImage && (
                <div className={`${seoCard} zseo-rise p-4`}>
                  {o.image ? (
                    <>
                      <img src={o.image} alt={result.title} className="max-h-72 w-full rounded-2xl bg-slate-100 object-contain dark:bg-slate-900" />
                      <div className="mt-3 flex flex-wrap gap-2">
                        <a className={seoBtn} href={o.image} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" />Open full size</a>
                        <a className={seoBtn} href={o.image} download><Download className="h-4 w-4" />Download</a>
                      </div>
                    </>
                  ) : <p className="text-sm text-slate-600 dark:text-slate-300">This channel has no public image of this kind.</p>}
                </div>
              )}
              <div className="zyt-grid">
                {o.tiles.map((t: any[], i: number) => <Tile key={t[1]} i={i} icon={t[0]} label={t[1]} value={t[2]} count={t[3]} onCopy={(x) => doCopy(x, t[1])} />)}
              </div>
              <div className="flex flex-wrap gap-2">
                <button className={seoBtn} onClick={() => exportTiles(o, "csv")}><Download className="h-4 w-4" />CSV</button>
                <button className={seoBtn} onClick={() => exportTiles(o, "json")}><Download className="h-4 w-4" />JSON</button>
              </div>
            </div>
          );
        })()}

        {!loading && out?.kind === "chips" && (() => {
          const o = out as any;
          const all: string[] = o.chips || [];
          let chips = filter ? all.filter((x) => x.toLowerCase().includes(filter.toLowerCase())) : [...all];
          if (sort === "az") chips.sort((a, b) => a.localeCompare(b));
          if (sort === "len") chips.sort((a, b) => a.length - b.length);
          const chosen = selected.length ? selected : chips;
          const text = chosen.join(o.tags ? joiner : " ");
          return (
            <div className={`${seoCard} zseo-rise p-4 sm:p-6`}>
              {all.length === 0 ? <p className="text-sm text-slate-600 dark:text-slate-300">{o.empty || "Nothing found."}</p> : (
                <>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{all.length} found{selected.length ? ` · ${selected.length} selected` : ""}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      {all.length > 8 && <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter…" aria-label="Filter" className="w-32 rounded-lg border border-indigo-200/80 bg-white/80 px-2.5 py-1.5 text-xs outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-white" />}
                      <select value={sort} onChange={(e) => setSort(e.target.value as any)} aria-label="Sort" className="rounded-lg border border-indigo-200/80 bg-white/80 px-2 py-1.5 text-xs dark:border-white/10 dark:bg-slate-900 dark:text-white">
                        <option value="orig">Original order</option><option value="az">A → Z</option><option value="len">Shortest first</option>
                      </select>
                      {o.tags && (
                        <select value={sep} onChange={(e) => setSep(e.target.value as any)} aria-label="Separator" className="rounded-lg border border-indigo-200/80 bg-white/80 px-2 py-1.5 text-xs dark:border-white/10 dark:bg-slate-900 dark:text-white">
                          <option value="comma">Comma separated</option><option value="line">One per line</option><option value="space">Space separated</option>
                        </select>
                      )}
                    </div>
                  </div>
                  {o.hint && <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">{o.hint}</p>}
                  <div className="flex flex-wrap gap-2">
                    {chips.map((x, i) => {
                      const on = selected.includes(x);
                      return (
                        <button key={x} style={{ ["--i" as any]: Math.min(i, 20) }} onClick={() => setSelected((s) => (s.includes(x) ? s.filter((y) => y !== x) : [...s, x]))}
                          className={`zseo-rise rounded-full border px-3.5 py-1.5 text-sm font-medium transition hover:-translate-y-0.5 ${on ? "border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-500/30" : "border-indigo-200 bg-white/80 text-indigo-900 hover:border-indigo-400 dark:border-white/10 dark:bg-white/5 dark:text-indigo-100"}`}>
                          {on && <Check className="mr-1 inline h-3 w-3" />}{x}
                        </button>
                      );
                    })}
                    {chips.length === 0 && <p className="text-sm text-slate-500">No match for “{filter}”.</p>}
                  </div>
                  {o.meter != null && (
                    <div className="mt-4">
                      <div className="h-2 overflow-hidden rounded-full bg-indigo-100 dark:bg-white/10">
                        <div className={`zseo-fill h-full rounded-full ${text.length > o.meterMax ? "bg-rose-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(100, (text.length / o.meterMax) * 100)}%` }} />
                      </div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{text.length} {o.meterLabel}{selected.length ? " (selected tags)" : ""}</p>
                    </div>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button className={seoBtn} onClick={() => doCopy(text, "chips")}>{copied === "chips" ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}{selected.length ? "Copy selected" : "Copy all"}</button>
                    <button className={seoBtn} onClick={() => downloadFile(o.file || "result.txt", text)}><Download className="h-4 w-4" />Download .txt</button>
                    <button className={seoBtn} onClick={() => setSelected(selected.length === all.length ? [] : [...all])}>{selected.length === all.length ? "Clear selection" : "Select all"}</button>
                  </div>
                </>
              )}
            </div>
          );
        })()}

        {!loading && out?.kind === "text" && (() => {
          const o = out as any;
          return (
            <div className={`${seoCard} zseo-rise space-y-4 p-4 sm:p-6`}>
              {o.preview && (
                <div className="aspect-video w-full max-w-xl overflow-hidden rounded-2xl bg-black">
                  <iframe className="h-full w-full" src={`https://www.youtube.com/embed/${o.preview}`} title="Preview" allowFullScreen loading="lazy" />
                </div>
              )}
              <textarea readOnly value={o.text} onFocus={(e) => e.currentTarget.select()} className={`${seoField} ${o.tall ? "min-h-[300px]" : "min-h-[110px]"} ${o.mono ? "font-mono text-sm" : ""}`} />
              {o.meter != null && (
                <div>
                  <div className="h-2 overflow-hidden rounded-full bg-indigo-100 dark:bg-white/10">
                    <div className={`zseo-fill h-full rounded-full ${o.meter > o.meterMax ? "bg-rose-500" : o.meter > 60 && o.meterMax === 100 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(100, (o.meter / o.meterMax) * 100)}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{o.meter} {o.meterLabel}</p>
                </div>
              )}
              {o.advice && <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{o.advice}</p>}
              {o.hint && <p className="text-xs text-slate-500 dark:text-slate-400">{o.hint}</p>}
              {o.text && (
                <div className="flex flex-wrap gap-2">
                  <button className={seoBtn} onClick={() => doCopy(o.text)}>{copied === "main" ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}Copy</button>
                  <button className={seoBtn} onClick={() => downloadFile(o.file || "result.txt", o.text)}><Download className="h-4 w-4" />Download</button>
                </div>
              )}
            </div>
          );
        })()}

        {!loading && out?.kind === "titles" && (
          <div className={`${seoCard} zseo-rise p-4 sm:p-6`}>
            <p className="mb-3 text-sm font-bold text-slate-800 dark:text-slate-100">Videos ranking for “{input.trim()}” (use the titles as inspiration)</p>
            {(out as any).items.length === 0 ? <p className="text-sm text-slate-600 dark:text-slate-300">No videos found.</p> : (
              <ul className="space-y-2">
                {(out as any).items.map((v: any, i: number) => (
                  <li key={v.id} style={{ ["--i" as any]: Math.min(i, 12) }} className="zseo-rise flex items-center gap-3 rounded-2xl border border-indigo-100/80 bg-white/80 p-3 transition hover:-translate-y-0.5 hover:border-indigo-300 dark:border-white/10 dark:bg-white/5">
                    <img src={`https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`} alt="" className="h-12 w-20 shrink-0 rounded-lg object-cover" loading="lazy" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 dark:text-white">{v.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{[v.channel, v.views, v.published && String(v.published).slice(0, 10)].filter(Boolean).join(" · ")}</p>
                    </div>
                    <button className={seoBtn} onClick={() => doCopy(v.title, v.id)} aria-label="Copy title">{copied === v.id ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {!loading && out?.kind === "winners" && (
          <div className={`${seoCard} zseo-rise p-4 text-center sm:p-8`}>
            <span className="zseo-float mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-xl shadow-amber-500/30"><Dices className="h-6 w-6" /></span>
            <p className="mt-3 text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">{picked.length > 1 ? "Winners" : "Winner"} · picked from {result?.total} unique entries</p>
            <ul className="mx-auto mt-3 max-w-xl space-y-2">
              {picked.map((p, i) => <li key={p + i} style={{ ["--i" as any]: i }} className="zseo-rise rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-lg font-bold text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">{p}</li>)}
            </ul>
            <div className="mt-4 flex justify-center gap-2">
              <button className={seoBtn} onClick={() => doPick()}><Dices className="h-4 w-4" />Pick again</button>
              <button className={seoBtn} onClick={() => doCopy(picked.join("\n"))}><Copy className="h-4 w-4" />Copy</button>
            </div>
          </div>
        )}

        <p className="px-1 text-center text-xs text-slate-500 dark:text-slate-400"><Link2 className="mr-1 inline h-3 w-3" />ZidroTool is not affiliated with YouTube. Only public information is shown.</p>
      </SeoToolShell>
    </div>
  );
}
