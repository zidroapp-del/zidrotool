import { useMemo, useState } from "react";
import { Copy, Download, Check, RotateCcw } from "lucide-react";

type Props = { slug?: string };

const TOOL_INFO: Record<string, { placeholder: string; label: string }> = {
  "text-sorter": { label: "Lines", placeholder: "Paste one item per line..." },
  "duplicate-line-remover": { label: "Lines", placeholder: "Paste lines with duplicates..." },
  "duplicate-word-remover": { label: "Text", placeholder: "Paste text with repeated words..." },
  "alphabetizer": { label: "Items", placeholder: "One item per line..." },
  "json-validator": { label: "JSON", placeholder: '{"name":"ZidroTool"}' },
  "json-to-yaml": { label: "JSON", placeholder: '{"name":"ZidroTool","tools":57}' },
  "yaml-to-json": { label: "YAML", placeholder: "name: ZidroTool\ntools: 57" },
  "meta-title-checker": { label: "Meta title", placeholder: "Enter your SEO title..." },
  "meta-description-checker": { label: "Meta description", placeholder: "Enter your meta description..." },
  "keyword-counter": { label: "Text", placeholder: "Paste your content..." },
  "schema-markup-generator": { label: "Page details", placeholder: "Enter a page title and URL..." },
  "unix-timestamp-converter": { label: "Timestamp", placeholder: "1710000000" },
  "bytes-converter": { label: "Bytes", placeholder: "1048576" },
  "aspect-ratio-calculator": { label: "Dimensions", placeholder: "1920 x 1080" },
  "vat-calculator": { label: "Amount", placeholder: "100" },
  "profit-margin-calculator": { label: "Values", placeholder: "Cost 60, Price 100" },
  "roi-calculator": { label: "Values", placeholder: "Investment 1000, Return 1250" },
  "age-calculator": { label: "Birth date", placeholder: "1995-01-15" },
  "date-difference": { label: "Dates", placeholder: "2026-01-01 to 2026-08-22" },
};

function download(name: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

function yamlScalar(v: unknown): string {
  if (v === null) return "null";
  if (typeof v === "string") return /^[A-Za-z0-9_.-]+$/.test(v) ? v : JSON.stringify(v);
  if (typeof v === "boolean" || typeof v === "number") return String(v);
  return JSON.stringify(v);
}

function jsonToYaml(value: unknown, indent = 0): string {
  const pad = " ".repeat(indent);
  if (Array.isArray(value)) return value.map((v) => `${pad}- ${typeof v === "object" && v !== null ? `\n${jsonToYaml(v, indent + 2)}` : yamlScalar(v)}`).join("\n");
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).map(([k, v]) => {
      if (v && typeof v === "object") return `${pad}${k}:\n${jsonToYaml(v, indent + 2)}`;
      return `${pad}${k}: ${yamlScalar(v)}`;
    }).join("\n");
  }
  return `${pad}${yamlScalar(value)}`;
}

function simpleYamlToJson(text: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  text.split(/\r?\n/).forEach((line) => {
    const m = line.match(/^\s*([^:#]+):\s*(.*)$/);
    if (!m) return;
    const key = m[1].trim();
    const raw = m[2].trim();
    if (raw === "true" || raw === "false") out[key] = raw === "true";
    else if (raw === "null") out[key] = null;
    else if (/^-?\d+(?:\.\d+)?$/.test(raw)) out[key] = Number(raw);
    else out[key] = raw.replace(/^["']|["']$/g, "");
  });
  return out;
}

function resultFor(slug: string, input: string): string {
  if (!input.trim()) return "";
  switch (slug) {
    case "text-sorter":
    case "alphabetizer":
      return input.split(/\r?\n/).filter(Boolean).sort((a,b) => a.localeCompare(b, undefined, { sensitivity: "base" })).join("\n");
    case "duplicate-line-remover":
      return [...new Set(input.split(/\r?\n/).filter(Boolean))].join("\n");
    case "duplicate-word-remover": {
      const seen = new Set<string>();
      return input.split(/(\s+)/).map((part) => {
        if (/^\s+$/.test(part)) return part;
        const key = part.toLowerCase();
        if (seen.has(key)) return "";
        seen.add(key);
        return part;
      }).join("").replace(/\s{2,}/g, " ").trim();
    }
    case "json-validator":
      try { JSON.parse(input); return "✓ Valid JSON\n\n" + JSON.stringify(JSON.parse(input), null, 2); }
      catch (e) { return `✗ Invalid JSON\n\n${e instanceof Error ? e.message : "Syntax error"}`; }
    case "json-to-yaml":
      try { return jsonToYaml(JSON.parse(input)); }
      catch (e) { return `Invalid JSON: ${e instanceof Error ? e.message : "Syntax error"}`; }
    case "yaml-to-json":
      return JSON.stringify(simpleYamlToJson(input), null, 2);
    case "keyword-counter": {
      const words = input.toLowerCase().match(/[a-z0-9\u00C0-\u024F\u0600-\u06FF]+/gi) || [];
      const counts = new Map<string, number>();
      words.forEach(w => counts.set(w, (counts.get(w) || 0) + 1));
      return [...counts.entries()].sort((a,b) => b[1]-a[1]).slice(0,30).map(([w,n]) => `${w}: ${n} (${((n/words.length)*100).toFixed(2)}%)`).join("\n");
    }
    case "meta-title-checker": {
      const n = input.trim().length;
      return `Characters: ${n}\nRecommended: 50–60 characters\nStatus: ${n >= 30 && n <= 60 ? "Good" : n < 30 ? "Too short" : "Likely too long"}`;
    }
    case "meta-description-checker": {
      const n = input.trim().length;
      return `Characters: ${n}\nRecommended: 140–160 characters\nStatus: ${n >= 120 && n <= 160 ? "Good" : n < 120 ? "Could be longer" : "Likely too long"}`;
    }
    case "schema-markup-generator": {
      const [title, url] = input.split(/\r?\n/).map(s => s.trim());
      return JSON.stringify({"@context":"https://schema.org","@type":"WebPage","name":title || "Page","url":url || "https://example.com"}, null, 2);
    }
    case "unix-timestamp-converter": {
      const n = Number(input.trim());
      if (!Number.isFinite(n)) return "Enter a valid Unix timestamp.";
      return new Date(n < 1e12 ? n * 1000 : n).toISOString();
    }
    case "bytes-converter": {
      const n = Number(input.trim());
      if (!Number.isFinite(n) || n < 0) return "Enter a non-negative number.";
      const units = ["B","KB","MB","GB","TB"];
      const i = Math.min(Math.floor(Math.log(Math.max(n,1))/Math.log(1024)), units.length-1);
      return `${n} B = ${(n/1024**i).toFixed(2)} ${units[i]}`;
    }
    case "aspect-ratio-calculator": {
      const m = input.match(/([\d.]+)\s*[x×]\s*([\d.]+)/i);
      if (!m) return "Use a format such as 1920 x 1080.";
      const a = Number(m[1]), b = Number(m[2]);
      const g = (x:number,y:number):number => y ? g(y, x%y) : Math.abs(x);
      const d = g(a,b);
      return `Ratio: ${a/d}:${b/d}\nDecimal: ${(a/b).toFixed(4)}`;
    }
    case "vat-calculator": {
      const n = Number(input.trim());
      if (!Number.isFinite(n)) return "Enter an amount.";
      return `At 19% VAT:\nVAT: ${(n*.19).toFixed(2)}\nTotal: ${(n*1.19).toFixed(2)}`;
    }
    case "profit-margin-calculator": {
      const m = input.match(/([\d.]+)[^\d]+([\d.]+)/);
      if (!m) return "Use: Cost 60, Price 100";
      const cost=Number(m[1]), price=Number(m[2]);
      return `Profit: ${(price-cost).toFixed(2)}\nMargin: ${((price-cost)/price*100).toFixed(2)}%\nMarkup: ${((price-cost)/cost*100).toFixed(2)}%`;
    }
    case "roi-calculator": {
      const m = input.match(/([\d.]+)[^\d]+([\d.]+)/);
      if (!m) return "Use: Investment 1000, Return 1250";
      const investment=Number(m[1]), ret=Number(m[2]);
      return `Gain: ${(ret-investment).toFixed(2)}\nROI: ${((ret-investment)/investment*100).toFixed(2)}%`;
    }
    case "age-calculator": {
      const birth = new Date(input.trim());
      if (Number.isNaN(birth.getTime())) return "Use YYYY-MM-DD.";
      const now = new Date(); let age=now.getFullYear()-birth.getFullYear();
      if (new Date(now.getFullYear(), birth.getMonth(), birth.getDate()) > now) age--;
      return `Age: ${age} years`;
    }
    case "date-difference": {
      const dates=input.match(/\d{4}-\d{2}-\d{2}/g);
      if (!dates || dates.length<2) return "Use: 2026-01-01 to 2026-08-22";
      const days=Math.abs((new Date(dates[1]).getTime()-new Date(dates[0]).getTime())/86400000);
      return `Difference: ${days.toLocaleString()} days`;
    }
    case "line-counter": return `Lines: ${input.split(/\r?\n/).length}`;
    case "sentence-counter": return `Sentences: ${(input.match(/[.!?]+(?:\s|$)/g) || []).length}`;
    case "paragraph-counter": return `Paragraphs: ${input.split(/\n\s*\n/).filter(Boolean).length}`;
    case "text-cleaner": return input.replace(/[\t\r]+/g, " ").replace(/ {2,}/g, " ").split(/\n/).map(x=>x.trim()).filter(Boolean).join("\n");
    case "text-deduplicator": return [...new Set(input.split(/\r?\n/).map(x=>x.trim()).filter(Boolean))].join("\n");
    case "text-to-slug": return input.toLowerCase().trim().normalize("NFKD").replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g,"-").replace(/^-+|-+$/g,"");
    case "url-parser": { try { const u=new URL(input.trim()); return JSON.stringify({protocol:u.protocol,host:u.host,hostname:u.hostname,port:u.port,path:u.pathname,query:u.search,hash:u.hash},null,2); } catch { return "Enter a valid URL."; } }
    case "url-query-parser": { try { const u=new URL(input.trim()); return [...u.searchParams.entries()].map(([k,v])=>`${k} = ${v}`).join("\n") || "No query parameters."; } catch { return "Enter a valid URL."; } }
    case "html-formatter": return input.replace(/>\s*</g, ">\n<").replace(/(<[^/][^>]*>)((?!(<\/)).)*?(<\/[^>]+>)/g, "$1$2$4\n");
    case "css-minifier": return input.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g," ").replace(/\s*([{}:;,>])\s*/g,"$1").trim();
    case "js-minifier": return input.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|\s)\/\/.*$/gm,"").replace(/\s+/g," ").trim();
    case "json-minifier": try { return JSON.stringify(JSON.parse(input)); } catch { return "Invalid JSON."; }
    case "json-stringify": try { return JSON.stringify(input); } catch { return input; }
    case "base64-to-text": try { return decodeURIComponent(escape(atob(input.trim()))); } catch { return "Invalid Base64."; }
    case "text-to-base64": try { return btoa(unescape(encodeURIComponent(input))); } catch { return "Could not encode text."; }
    case "hex-to-decimal": { const n=parseInt(input.trim().replace(/^0x/i,""),16); return Number.isFinite(n)?String(n):"Invalid hexadecimal."; }
    case "decimal-to-hex": { const n=Number(input.trim()); return Number.isFinite(n)?`0x${Math.trunc(n).toString(16).toUpperCase()}`:"Invalid number."; }
    case "binary-to-decimal": { const n=parseInt(input.trim(),2); return Number.isFinite(n)?String(n):"Invalid binary."; }
    case "decimal-to-binary": { const n=Number(input.trim()); return Number.isFinite(n)?Math.trunc(n).toString(2):"Invalid number."; }
    case "hex-to-rgb": { const h=input.trim().replace(/^#/,''); if(!/^[0-9a-f]{6}$/i.test(h)) return "Use a 6-digit HEX color."; const n=parseInt(h,16); return `rgb(${n>>16}, ${(n>>8)&255}, ${n&255})`; }
    case "rgb-to-hex": { const m=input.match(/(\d+)\D+(\d+)\D+(\d+)/); if(!m) return "Use RGB values such as 255, 128, 64."; return "#"+[m[1],m[2],m[3]].map(x=>Math.max(0,Math.min(255,Number(x))).toString(16).padStart(2,"0")).join("").toUpperCase(); }
    case "email-validator": return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.trim()) ? "Valid email format." : "Invalid email format.";
    case "phone-number-cleaner": return input.replace(/[^+\d]/g,"");
    case "unix-timestamp-now": { const now=Math.floor(Date.now()/1000); return `Unix seconds: ${now}\nUnix milliseconds: ${Date.now()}`; }
    case "percentage-change-calculator": { const m=input.match(/(-?[\d.]+)[^\d-]+(-?[\d.]+)/); if(!m) return "Use: 100 to 125"; const a=Number(m[1]),b=Number(m[2]); return `Change: ${((b-a)/a*100).toFixed(2)}%`; }
    case "discount-price-calculator": { const m=input.match(/([\d.]+)[^\d]+([\d.]+)/); if(!m) return "Use: 100, 20"; const p=Number(m[1]),d=Number(m[2]); return `Discount: ${(p*d/100).toFixed(2)}\nFinal price: ${(p*(1-d/100)).toFixed(2)}`; }
    case "tip-calculator": { const m=input.match(/([\d.]+)[^\d]+([\d.]+)/); if(!m) return "Use: 100, 15"; const bill=Number(m[1]),tip=Number(m[2]); return `Tip: ${(bill*tip/100).toFixed(2)}\nTotal: ${(bill*(1+tip/100)).toFixed(2)}`; }
    case "reading-time-calculator": { const words=(input.match(/\S+/g)||[]).length; return `Words: ${words}\nEstimated reading time: ${Math.max(1,Math.ceil(words/200))} minute(s)`; }
    case "typing-speed-test": { const words=(input.trim().match(/\S+/g)||[]).length; return `Words typed: ${words}\nEstimated WPM for a 60-second test: ${words}`; }
    case "random-number-generator": { const m=input.match(/(-?\d+)\D+(-?\d+)/); const a=m?Number(m[1]):1,b=m?Number(m[2]):100; return String(Math.floor(Math.random()*(b-a+1))+a); }
    case "random-choice-picker": { const items=input.split(/\r?\n|,/).map(x=>x.trim()).filter(Boolean); return items.length ? items[Math.floor(Math.random()*items.length)] : "Enter choices separated by commas or lines."; }
    case "password-generator-strong": { const chars="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*_-"; const len=Math.min(128,Math.max(8,Number(input)||20)); const a=new Uint32Array(len); crypto.getRandomValues(a); return Array.from(a,x=>chars[x%chars.length]).join(""); }
    case "password-length-checker": return `Length: ${input.length}\n${input.length>=12 ? "Good length" : "Use at least 12 characters"}`;
    case "whitespace-normalizer": return input.replace(/[\t ]+/g," ").replace(/ *\n */g,"\n").trim();
    case "csv-column-extractor": { const m=input.split(/\r?\n/); const col=prompt("Column number (1-based)"); const i=Math.max(0,(Number(col)||1)-1); return m.map(r=>r.split(",")[i]||"").join("\n"); }
    case "regex-escape": return input.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
    default: return input;
  }
}

export default function SeoUtilityTool({ slug = "" }: Props) {
  const info = TOOL_INFO[slug] || { label: "Input", placeholder: "Enter your data..." };
  const [input, setInput] = useState("");
  const output = useMemo(() => resultFor(slug, input), [slug, input]);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (!output) return;
    await navigator.clipboard?.writeText(output);
    setCopied(true); setTimeout(() => setCopied(false), 1200);
  };
  return (
    <div className="space-y-5">
      <div>
        <label className="label mb-2 block">{info.label}</label>
        <textarea value={input} onChange={e => setInput(e.target.value)} placeholder={info.placeholder} className="input min-h-[180px] w-full resize-y font-mono" />
      </div>
      <div className="flex flex-wrap gap-2">
        <button className="btn btn-primary" onClick={() => setInput("")}><RotateCcw className="h-4 w-4" />Reset</button>
        <button className="btn btn-secondary" onClick={copy} disabled={!output}><Copy className="h-4 w-4" />{copied ? "Copied" : "Copy result"}</button>
        <button className="btn btn-secondary" onClick={() => download(`${slug}.txt`, output)} disabled={!output}><Download className="h-4 w-4" />Download</button>
      </div>
      {output && <pre className="max-h-[420px] overflow-auto rounded-2xl border border-ink-200 bg-ink-50 p-5 text-sm whitespace-pre-wrap dark:border-ink-700 dark:bg-ink-900">{output}</pre>}
    </div>
  );
}
