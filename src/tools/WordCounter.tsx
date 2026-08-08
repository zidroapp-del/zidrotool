import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ToolIO } from "@/components/ToolIO";

export default function WordCounter() {
  const { t } = useTranslation();
  const [input, setInput] = useState("");

  const stats = useMemo(() => {
    const text = input.trim();
    const words = text ? text.split(/\s+/).length : 0;
    const chars = input.length;
    const charsNoSpace = input.replace(/\s/g, "").length;
    const sentences = text ? (text.match(/[.!?]+/g) || []).length || 1 : 0;
    const paragraphs = text ? text.split(/\n+/).filter((p) => p.trim()).length : 0;
    const lines = input ? input.split("\n").length : 0;
    const readTime = Math.max(1, Math.ceil(words / 200));
    return { words, chars, charsNoSpace, sentences, paragraphs, lines, readTime };
  }, [input]);

  const output = useMemo(() => {
    return [
      `Words: ${stats.words}`,
      `Characters: ${stats.chars}`,
      `Characters (no spaces): ${stats.charsNoSpace}`,
      `Sentences: ${stats.sentences}`,
      `Paragraphs: ${stats.paragraphs}`,
      `Lines: ${stats.lines}`,
      `Reading time: ${stats.readTime} min`,
    ].join("\n");
  }, [stats]);

  return (
    <div>
      <ToolIO
        input={input}
        onInputChange={setInput}
        output={output}
        inputPlaceholder="Start typing to see live statistics…"
        inputProps={{ className: "font-sans" }}
      />
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: t("hero.stat.tools").replace("Tools", "Words"), value: stats.words },
          { label: "Characters", value: stats.chars },
          { label: "Sentences", value: stats.sentences },
          { label: "Paragraphs", value: stats.paragraphs },
          { label: "Lines", value: stats.lines },
          { label: "No-space chars", value: stats.charsNoSpace },
          { label: "Reading time", value: `${stats.readTime}m` },
          { label: "Words/min", value: "200" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg bg-ink-50 p-3 text-center dark:bg-ink-950/50">
            <p className="text-xl font-bold text-brand-600 dark:text-brand-400">{s.value}</p>
            <p className="text-xs text-ink-500 dark:text-ink-400">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
