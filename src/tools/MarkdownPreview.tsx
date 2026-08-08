import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderMarkdown(md: string): string {
  let html = escapeHtml(md);
  // code blocks
  html = html.replace(/```([\s\S]*?)```/g, (_, code) => `<pre class="bg-ink-100 dark:bg-ink-800 rounded-lg p-4 overflow-x-auto my-3"><code>${code.trim()}</code></pre>`);
  // inline code
  html = html.replace(/`([^`]+)`/g, '<code class="bg-ink-100 dark:bg-ink-800 rounded px-1.5 py-0.5 font-mono text-sm">$1</code>');
  // headers
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-xl font-semibold mt-4 mb-2">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold mt-5 mb-3">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold mt-5 mb-3">$1</h1>');
  // bold and italic
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  // links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-brand-600 underline">$1</a>');
  // blockquote
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote class="border-l-4 border-brand-300 pl-4 italic my-3">$1</blockquote>');
  // unordered list
  html = html.replace(/^[-*] (.+)$/gm, '<li class="ml-5 list-disc">$1</li>');
  html = html.replace(/(<li[^>]*>.*?<\/li>\n?)+/g, (m) => `<ul class="my-3 space-y-1">${m}</ul>`);
  // ordered list
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-5 list-decimal">$1</li>');
  // paragraphs
  html = html.replace(/\n\n/g, "</p><p class=\"my-3 leading-7\">");
  html = `<p class="my-3 leading-7">${html}</p>`;
  // line breaks
  html = html.replace(/\n/g, "<br/>");
  return html;
}

export default function MarkdownPreview() {
  const { t } = useTranslation();
  const [input, setInput] = useState("# Hello ZidroTool\n\nThis is **bold** and *italic*.\n\n- Item one\n- Item two\n\n> A quote\n\n`inline code`\n\n```\ncode block\n```");

  const html = useMemo(() => renderMarkdown(input), [input]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <label className="label">{t("tool.input")} (Markdown)</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="input min-h-[400px] resize-y font-mono text-sm"
          spellCheck={false}
        />
      </div>
      <div>
        <label className="label">{t("tool.output")} (Preview)</label>
        <div
          className="prose-zt min-h-[400px] overflow-y-auto rounded-lg border border-ink-200 bg-white p-4 dark:border-ink-700 dark:bg-ink-950/50"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}
