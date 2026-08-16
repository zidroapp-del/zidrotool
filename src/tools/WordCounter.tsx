import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

export default function WordCounter() {
  const { t, i18n } = useTranslation();
  const [input, setInput] = useState("");

  const isRtl = i18n.language === "ar";

  const stats = useMemo(() => {
    const text = input.trim();
    const words = text ? text.split(/\s+/).length : 0;
    const chars = input.length;
    const charsNoSpace = input.replace(/\s/g, "").length;
    const sentences = text ? (text.match(/[.!?]+/g) || []).length || (text ? 1 : 0) : 0;
    const paragraphs = text ? text.split(/\n+/).filter((p) => p.trim()).length : 0;
    const lines = input ? input.split("\n").length : 0;
    const readTime = Math.max(1, Math.ceil(words / 200));
    return { words, chars, charsNoSpace, sentences, paragraphs, lines, readTime };
  }, [input]);

  const items = [
    { label: t("tools.wordCounter.words", "Words"), value: stats.words, color: "text-blue-600 dark:text-blue-400" },
    { label: t("tools.wordCounter.characters", "Characters"), value: stats.chars, color: "text-emerald-600 dark:text-emerald-400" },
    { label: t("tools.wordCounter.noSpaces", "No spaces"), value: stats.charsNoSpace, color: "text-indigo-600 dark:text-indigo-400" },
    { label: t("tools.wordCounter.sentences", "Sentences"), value: stats.sentences, color: "text-purple-600 dark:text-purple-400" },
    { label: t("tools.wordCounter.paragraphs", "Paragraphs"), value: stats.paragraphs, color: "text-amber-600 dark:text-amber-400" },
    { label: t("tools.wordCounter.lines", "Lines"), value: stats.lines, color: "text-rose-600 dark:text-rose-400" },
    { label: t("tools.wordCounter.readingTime", "Reading time"), value: `${stats.readTime} ${t("tools.wordCounter.min", "min")}`, color: "text-teal-600 dark:text-teal-400" },
    { label: t("tools.wordCounter.readingSpeed", "Reading speed"), value: `200 ${t("tools.wordCounter.wpm", "wpm")}`, color: "text-cyan-600 dark:text-cyan-400" },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto my-6 p-4 sm:p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm transition-all">
      
      {/* منطقة إدخال النص */}
      <div className="relative w-full mb-6">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("tools.wordCounter.placeholder", "Start typing or paste your text here to see real-time statistics...")}
          className="w-full h-64 p-4 text-base text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-y transition-all font-sans"
        />
        {input && (
          <button
            onClick={() => setInput("")}
            className={`absolute top-3 ${isRtl ? "left-3" : "right-3"} px-3 py-1 text-xs text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-400 rounded-md hover:bg-red-100 transition-colors`}
          >
            {t("tools.wordCounter.clear", "Clear text")}
          </button>
        )}
      </div>

      {/* شبكة الإحصائيات */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {items.map((s, i) => (
          <div
            key={i}
            className="flex flex-col justify-center items-center p-3.5 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50 transition-all"
          >
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400 text-center">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}