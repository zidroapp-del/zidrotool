import { useMemo, useState } from "react";
import { Copy, Download, RotateCcw } from "lucide-react";

type Props = { slug?: string };
const limits: Record<string, number> = {
  "instagram-caption-counter": 2200, "instagram-bio-counter": 150,
  "tiktok-caption-counter": 4000, "youtube-title-counter": 100,
  "youtube-description-counter": 5000, "facebook-post-counter": 63206,
  "linkedin-post-counter": 3000, "social-character-counter": 280,
};
function outputFor(slug: string, input: string) {
  if (slug === "hashtag-counter") return `Hashtags: ${(input.match(/#[\p{L}\p{N}_-]+/gu)||[]).length}\nCharacters: ${input.length}\nWords: ${(input.trim().match(/\S+/g)||[]).length}`;
  if (slug === "hashtag-cleaner") return [...new Set((input.match(/#[\p{L}\p{N}_-]+/gu)||[]).map(x=>x.toLowerCase()))].join(" ");
  if (slug === "social-utm-builder") { try { const lines=input.split(/\r?\n/).map(x=>x.trim()).filter(Boolean); const [url,source="social",medium="social",campaign="campaign",content=""]=lines; const u=new URL(url); u.searchParams.set("utm_source",source); u.searchParams.set("utm_medium",medium); u.searchParams.set("utm_campaign",campaign); if(content)u.searchParams.set("utm_content",content); return u.toString(); } catch { return "Enter a valid URL on the first line, then source, medium, campaign and optional content."; } }
  if (slug === "social-post-preview") return input.trim() ? `POST PREVIEW\n\n${input.trim()}\n\nCharacters: ${input.length}` : "Write your post to preview it.";
  if (slug === "social-bio-formatter") return input.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).join("\n• ");
  return `Characters: ${input.length}\nWords: ${(input.trim().match(/\S+/g)||[]).length}\nHashtags: ${(input.match(/#[\p{L}\p{N}_-]+/gu)||[]).length}\n${limits[slug] ? `Recommended limit: ${limits[slug]} characters\nStatus: ${input.length <= limits[slug] ? "Within limit" : "Over limit"}` : ""}`;
}
export default function SocialUtilityTool({slug="social-character-counter"}:Props){
 const [input,setInput]=useState(""); const output=useMemo(()=>outputFor(slug,input),[slug,input]); const limit=limits[slug];
 const download=()=>{const b=new Blob([output],{type:"text/plain;charset=utf-8"});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download=`${slug}.txt`;a.click();URL.revokeObjectURL(u)};
 return <div className="space-y-5"><div className="rounded-2xl border border-ink-200 bg-white p-5 dark:border-ink-800 dark:bg-ink-900"><div className="mb-3 flex items-center justify-between"><label className="label">Content</label>{limit&&<span className="text-xs text-ink-400">{input.length}/{limit}</span>}</div><textarea value={input} onChange={e=>setInput(e.target.value)} className="input min-h-[220px] w-full resize-y" placeholder="Paste your social media text here..." /></div><div className="flex flex-wrap gap-2"><button className="btn-secondary" onClick={()=>setInput("")}><RotateCcw className="h-4 w-4"/>Reset</button><button className="btn-secondary" disabled={!output} onClick={()=>navigator.clipboard?.writeText(output)}><Copy className="h-4 w-4"/>Copy</button><button className="btn-primary" disabled={!output} onClick={download}><Download className="h-4 w-4"/>Download</button></div><pre className="whitespace-pre-wrap rounded-2xl border border-ink-200 bg-ink-50 p-5 text-sm dark:border-ink-800 dark:bg-ink-950">{output||"Your result will appear here."}</pre></div>
}
