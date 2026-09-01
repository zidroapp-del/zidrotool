import { useMemo, useState } from 'react';
import { Copy, Download, ExternalLink, Loader2, RefreshCw, Search, Sparkles, Wand2 } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { copyToClipboard, downloadFile } from '@/lib/utils';
import { useParams } from 'react-router-dom';

const VIDEO_SLUGS = new Set([
  'youtube-region-restriction-checker','youtube-tag-extractor','youtube-hashtag-extractor','youtube-title-extractor','youtube-description-extractor','youtube-video-statistics','youtube-embed-code-generator','youtube-timestamp-link-generator','youtube-title-length-checker','youtube-video-title-capitalizer','youtube-views-ratio-calculator'
]);
const CHANNEL_SLUGS = new Set(['youtube-channel-finder','youtube-channel-statistics','youtube-channel-id-extractor','youtube-channel-logo-downloader','youtube-channel-banner-downloader','youtube-video-count-checker','youtube-channel-age-checker']);
const GENERATOR_SLUGS = new Set(['youtube-tag-generator','youtube-hashtag-generator','youtube-title-generator','youtube-description-generator','youtube-subscribe-link-generator','youtube-money-calculator','youtube-comment-picker']);

async function api(action:string, params:Record<string,string>) {
  const qs = new URLSearchParams({action,...params});
  const r = await fetch(`/api/youtube?${qs}`, { headers: { accept: 'application/json' } });
  const raw = await r.text();
  let j: any;
  try {
    j = JSON.parse(raw);
  } catch {
    throw new Error(`YouTube API returned a non-JSON response (HTTP ${r.status}).`);
  }
  if (!r.ok || !j.ok) throw new Error(j.error || `Request failed (HTTP ${r.status})`);
  return j.data;
}
function videoId(input:string) { try { const u=new URL(input.trim()); if(u.hostname.includes('youtu.be')) return u.pathname.slice(1).split('/')[0]; return u.searchParams.get('v') || u.pathname.match(/\/(?:embed|shorts|live)\/([\w-]{11})/)?.[1] || ''; } catch { return /^[\w-]{11}$/.test(input.trim())?input.trim():''; } }
function copyList(items:string[]) { return items.join(', '); }

export default function YouTubeTools({ slug:propSlug }:{slug?:string}) {
  const { slug:routeSlug }=useParams<{slug:string}>(); const slug=propSlug||routeSlug||'';
  const {success,error}=useToast(); const [input,setInput]=useState(''); const [language,setLanguage]=useState('English'); const [country,setCountry]=useState('US'); const [result,setResult]=useState<any>(null); const [loading,setLoading]=useState(false);
  const [selected,setSelected]=useState<string[]>([]);
  const title=slug.replace(/^youtube-/,'').replace(/-/g, ' ');
  const run=async()=>{
    if(!input.trim()){error('Enter a YouTube URL or keyword.');return;} setLoading(true); setResult(null);
    try {
      if (VIDEO_SLUGS.has(slug)) setResult(await api('video',{url:input}));
      else if (CHANNEL_SLUGS.has(slug)) setResult(await api('channel',{url:input}));
      else if (slug==='youtube-tag-generator' || slug==='youtube-hashtag-generator' || slug==='youtube-title-generator') setResult(await api('search',{q:input}));
      else if (slug==='youtube-money-calculator' || slug==='youtube-comment-picker' || slug==='youtube-description-generator') setResult({ keyword:input });
      else if (slug==='youtube-subscribe-link-generator') setResult({ url:`https://www.youtube.com/subscribe_to?channel=${input.replace(/^https?:\/\/www\.youtube\.com\/(?:channel\/)?/,'').replace(/^@/,'')}` });
    } catch(e:any){ error(e.message||'Could not load YouTube data.'); }
    finally{setLoading(false);}
  };
  const output=useMemo(()=>{
    if(!result) return null;
    if(slug==='youtube-region-restriction-checker') return {stats:[['Playback status',result.playability||'Unknown'],['Availability signal',result.playability==='OK'?'Playable from the tool server region':result.playabilityReason||'Restricted or unavailable'],['Important','Availability can vary by country, account, age and YouTube policy.'] ]};
    if(slug==='youtube-tag-extractor') return {chips:result.keywords||[], text:copyList(result.keywords||[])};
    if(slug==='youtube-hashtag-extractor') { const h=(result.description||'').match(/#[\p{L}\p{N}_-]+/gu)||[]; return {chips:[...new Set(h)], text:[...new Set(h)].join(' ')}; }
    if(slug==='youtube-title-extractor') return {text:result.title};
    if(slug==='youtube-description-extractor') return {text:result.description};
    if(slug==='youtube-video-statistics') { const stats=[['Title',result.title||'—'],['Channel',result.channelTitle||'—'],['Views',result.viewCount==null?'Unavailable':Number(result.viewCount).toLocaleString()],['Likes',result.likeCount==null?'Unavailable':Number(result.likeCount).toLocaleString()],['Comments',result.commentCount==null?'Unavailable':Number(result.commentCount).toLocaleString()],['Published',result.publishedAt||'—'],['Category',result.category||result.categoryId||'—'],['Language',result.defaultLanguage||'—'],['Duration',result.lengthSeconds?`${Math.floor(result.lengthSeconds/60)}:${String(result.lengthSeconds%60).padStart(2,'0')}`:'—'],['Tags',(result.keywords||[]).length?result.keywords.join(', '):'No public tags found']]; return {stats, note: result.statsAvailable===false?'Basic metadata only. Configure YOUTUBE_API_KEY in Vercel for reliable public statistics.':`Source: ${result.source||'YouTube'}`}; };
    if(slug==='youtube-embed-code-generator') return {text:`<iframe width="560" height="315" src="${result.embedUrl}" title="YouTube video player" frameborder="0" allowfullscreen></iframe>`};
    if(slug==='youtube-timestamp-link-generator') return {text:`${input}${input.includes('?')?'&':'?'}t=60s`};
    if(slug==='youtube-subscribe-link-generator') return {text:result.url};
    if(slug==='youtube-title-length-checker') { const titleText=result.title||''; return {stats:[['Characters',titleText.length],['Recommended',titleText.length<=70?'Good':'Long'],['Title',titleText||'—']]}; }
    if(slug==='youtube-video-title-capitalizer') return {text:result.title.replace(/\b\w/g, (c: string) => c.toUpperCase())};
    if(slug==='youtube-views-ratio-calculator') return {stats:[['Views',result.viewCount==null?'Unavailable':Number(result.viewCount).toLocaleString()],['Likes',result.likeCount==null?'Unavailable':Number(result.likeCount).toLocaleString()],['Comments',result.commentCount==null?'Unavailable':Number(result.commentCount).toLocaleString()],['Note',result.statsAvailable===false?'Configure YOUTUBE_API_KEY for reliable statistics.':'Statistics loaded from the YouTube Data API.']]};
    if(CHANNEL_SLUGS.has(slug)) { const stats=[['Channel ID',result.channelId],['Name',result.title],['Subscribers',result.subscriberText||'—'],['Videos',result.videosText||'—']]; if(slug==='youtube-channel-age-checker') stats.push(['Joined',result.joinedDate||'Not exposed on the public channel page']); return {stats,image:slug==='youtube-channel-logo-downloader'?result.avatar:slug==='youtube-channel-banner-downloader'?result.banner:undefined}; }
    if(slug==='youtube-tag-generator') { const base=input.toLowerCase().split(/\s+/).filter(Boolean); const tags=[...new Set([...base,`${input} youtube`,`${input} tutorial`,`${input} guide`,`${input} tips`,`${input} how to`,`${input} 2026`,`${input} for beginners`])]; return {chips:tags,text:tags.join(', ')}; }
    if(slug==='youtube-hashtag-generator') { const words=input.toLowerCase().match(/[\p{L}\p{N}]+/gu)||[]; const tags=[...new Set(words.map(w=>`#${w}`))]; return {chips:tags,text:tags.join(' ')}; }
    if(slug==='youtube-title-generator') return {chips:(result||[]).map((x:any)=>x.title),text:(result||[]).map((x:any)=>x.title).join('\n')};
    if(slug==='youtube-description-generator') return {text:`About the video\n${input}\n\nTimestamps\n00:00 Introduction\n\nAbout the channel\nSubscribe for more videos about ${input}.\n\nWebsite\nAdd your website here.\n\nContact & Social\nAdd your social links here.`};
    if(slug==='youtube-money-calculator') { const views=Number(input.replace(/[^0-9.]/g,''))||0; return {stats:[['Estimated views',views.toLocaleString()],['Low RPM ($1)',`$${(views/1000).toFixed(2)}`],['Medium RPM ($4)',`$${(views*4/1000).toFixed(2)}`],['High RPM ($10)',`$${(views*10/1000).toFixed(2)}`],['Note','Estimates only; actual YouTube revenue varies by audience, geography, niche, ads and monetization.']]}; }
    if(slug==='youtube-comment-picker') { const comments=input.split(/\r?\n/).map(x=>x.trim()).filter(Boolean); const pick=comments.length?comments[Math.floor(Math.random()*comments.length)]:''; return {text:pick||'Paste one comment per line to pick a random winner.'}; }
    return {text:''};
  },[result,slug,input]);
  const doCopy=async(text:string)=>{if(await copyToClipboard(text))success('Copied to clipboard');};
  const inputLabel=GENERATOR_SLUGS.has(slug)?'Keyword / topic':'YouTube URL';
  return <div className="space-y-6">
    <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-sm dark:border-ink-800 dark:bg-ink-950">
      <div className="mb-2 flex items-center gap-2"><Search className="h-4 w-4 text-brand-500"/><label className="label mb-0">{inputLabel}</label></div>
      <div className="flex flex-col gap-3 md:flex-row">
        <input className="input flex-1" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&run()} placeholder={GENERATOR_SLUGS.has(slug)?'e.g. youtube SEO':'https://www.youtube.com/watch?v=...'} />
        {GENERATOR_SLUGS.has(slug) && <select className="input md:w-40" value={language} onChange={e=>setLanguage(e.target.value)}><option>English</option><option>Arabic</option><option>French</option><option>Spanish</option></select>}
        {slug==='youtube-title-generator' && <select className="input md:w-32" value={country} onChange={e=>setCountry(e.target.value)}><option>US</option><option>GB</option><option>CA</option><option>AU</option><option>FR</option><option>DZ</option></select>}
        <button className="btn-primary shrink-0" onClick={run} disabled={loading}>{loading?<Loader2 className="h-4 w-4 animate-spin"/>:<Wand2 className="h-4 w-4"/>}{GENERATOR_SLUGS.has(slug)?'Generate':'Extract'}</button>
      </div>
      {GENERATOR_SLUGS.has(slug)&&<p className="mt-2 text-xs text-ink-400">Language: {language}{slug==='youtube-title-generator'?` · Target country: ${country}`:''}</p>}
    </div>
    {output && <div className="rounded-2xl border border-brand-200 bg-brand-50/50 p-5 dark:border-brand-900/60 dark:bg-brand-950/20">
      {output.image && <div className="mb-5"><img src={output.image} alt={title} className="max-h-64 w-full rounded-xl object-contain bg-ink-100 dark:bg-ink-900"/><div className="mt-2 flex gap-2"><a className="btn-secondary btn-sm" href={output.image} target="_blank" rel="noreferrer"><ExternalLink className="h-3 w-3"/>Open</a><a className="btn-primary btn-sm" href={output.image} download><Download className="h-3 w-3"/>Download</a></div></div>}
      {output.chips && <div className="flex flex-wrap gap-2">{output.chips.map((x:string)=><button key={x} onClick={()=>setSelected(s=>s.includes(x)?s.filter(y=>y!==x):[...s,x])} className={`rounded-full border px-3 py-1.5 text-sm ${selected.includes(x)?'border-brand-500 bg-brand-500 text-white':'border-ink-200 bg-white dark:border-ink-700 dark:bg-ink-900'}`}>{x}</button>)}</div>}
      {output.stats && <div className="grid gap-3 sm:grid-cols-2">{output.stats.map((item: any[]) => { const [k, v] = item as [string, unknown]; return <div key={k} className="rounded-xl border border-ink-200 bg-white p-4 dark:border-ink-800 dark:bg-ink-950"><div className="text-xs font-semibold uppercase tracking-wide text-ink-400">{k}</div><div className="mt-1 break-words text-sm font-medium text-ink-900 dark:text-ink-100">{String(v)}</div></div>; })}</div>}{output.note && <p className="mt-4 text-xs leading-5 text-ink-500 dark:text-ink-400">{output.note}</p>}
      {output.text!==undefined && <textarea readOnly value={selected.length?copyList(selected):output.text} className="input mt-4 min-h-[220px] font-mono text-sm"/>}
      <div className="mt-4 flex flex-wrap gap-2">{output.text && <button className="btn-primary btn-sm" onClick={()=>doCopy(selected.length?copyList(selected):output.text)}><Copy className="h-3.5 w-3.5"/>Copy result</button>}{output.text && <button className="btn-secondary btn-sm" onClick={()=>downloadFile(`${slug}.txt`,selected.length?copyList(selected):output.text)}><Download className="h-3.5 w-3.5"/>Download</button>}<button className="btn-secondary btn-sm" onClick={()=>{setInput('');setResult(null);setSelected([])}}><RefreshCw className="h-3.5 w-3.5"/>Reset</button></div>
    </div>}
    {!result && <div className="rounded-2xl border border-dashed border-ink-300 p-12 text-center dark:border-ink-700"><Sparkles className="mx-auto h-10 w-10 text-brand-400"/><p className="mt-3 text-sm text-ink-500">Enter your {GENERATOR_SLUGS.has(slug)?'keyword or topic':'YouTube URL'} to start.</p></div>}
  </div>
}
