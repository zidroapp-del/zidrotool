import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ToolIO } from "@/components/ToolIO";
import { cn } from "@/lib/utils";

type Mode = "chars" | "words" | "lines";

export default function TextReverser() {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("chars");

  const output = useMemo(() => {
    if (!input) return "";
    if (mode === "chars") return [...input].reverse().join("");
    if (mode === "words") return input.split(/(\s+)/).reverse().join("");
    return input.split("\n").reverse().join("\n");
  }, [input, mode]);

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {(["chars", "words", "lines"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors",
              mode === m
                ? "bg-brand-600 text-white"
                : "bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300 dark:hover:bg-ink-700",
            )}
          >
            {m}
          </button>
        ))}
      </div>
      <ToolIO
        input={input}
        onInputChange={setInput}
        output={output}
        inputPlaceholder="Enter text to reverse…"
      />
    </div>
  );
}
