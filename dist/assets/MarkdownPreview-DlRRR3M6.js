import{j as l}from"./index-DnSH05fH.js";import{r as n}from"./react-vendor-3R2dh_rm.js";import{u as o}from"./i18n-vendor-PUc3Tyr3.js";import"./icons-BG3kyCz2.js";import"./supabase-vendor-DUyt-Z8u.js";function c(r){return r.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function i(r){let e=c(r);return e=e.replace(/```([\s\S]*?)```/g,(a,t)=>`<pre class="bg-ink-100 dark:bg-ink-800 rounded-lg p-4 overflow-x-auto my-3"><code>${t.trim()}</code></pre>`),e=e.replace(/`([^`]+)`/g,'<code class="bg-ink-100 dark:bg-ink-800 rounded px-1.5 py-0.5 font-mono text-sm">$1</code>'),e=e.replace(/^### (.+)$/gm,'<h3 class="text-xl font-semibold mt-4 mb-2">$1</h3>'),e=e.replace(/^## (.+)$/gm,'<h2 class="text-2xl font-bold mt-5 mb-3">$1</h2>'),e=e.replace(/^# (.+)$/gm,'<h1 class="text-3xl font-bold mt-5 mb-3">$1</h1>'),e=e.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>"),e=e.replace(/\*([^*]+)\*/g,"<em>$1</em>"),e=e.replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" class="text-brand-600 underline">$1</a>'),e=e.replace(/^&gt; (.+)$/gm,'<blockquote class="border-l-4 border-brand-300 pl-4 italic my-3">$1</blockquote>'),e=e.replace(/^[-*] (.+)$/gm,'<li class="ml-5 list-disc">$1</li>'),e=e.replace(/(<li[^>]*>.*?<\/li>\n?)+/g,a=>`<ul class="my-3 space-y-1">${a}</ul>`),e=e.replace(/^\d+\. (.+)$/gm,'<li class="ml-5 list-decimal">$1</li>'),e=e.replace(/\n\n/g,'</p><p class="my-3 leading-7">'),e=`<p class="my-3 leading-7">${e}</p>`,e=e.replace(/\n/g,"<br/>"),e}function b(){const{t:r}=o(),[e,a]=n.useState(`# Hello ZidroTool

This is **bold** and *italic*.

- Item one
- Item two

> A quote

\`inline code\`

\`\`\`
code block
\`\`\``),t=n.useMemo(()=>i(e),[e]);return l.jsxs("div",{className:"grid gap-4 md:grid-cols-2",children:[l.jsxs("div",{children:[l.jsxs("label",{className:"label",children:[r("tool.input")," (Markdown)"]}),l.jsx("textarea",{value:e,onChange:s=>a(s.target.value),className:"input min-h-[400px] resize-y font-mono text-sm",spellCheck:!1})]}),l.jsxs("div",{children:[l.jsxs("label",{className:"label",children:[r("tool.output")," (Preview)"]}),l.jsx("div",{className:"prose-zt min-h-[400px] overflow-y-auto rounded-lg border border-ink-200 bg-white p-4 dark:border-ink-700 dark:bg-ink-950/50",dangerouslySetInnerHTML:{__html:t}})]})]})}export{b as default};
