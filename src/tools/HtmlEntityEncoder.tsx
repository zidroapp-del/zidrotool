import { useMemo, useState } from "react";
import { ToolIO } from "@/components/ToolIO";
import { cn } from "@/lib/utils";

type Mode = "encode" | "decode";

const ENCODE_MAP: Record<string, string> = {
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;", "/": "&#47;",
};

export default function HtmlEntityEncoder() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("encode");

  const output = useMemo(() => {
    if (!input) return "";
    if (mode === "encode") {
      return input.replace(/[&<>"'/]/g, (c) => ENCODE_MAP[c] || c);
    }
    return input
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;|&apos;/g, "'")
      .replace(/&#47;/g, "/");
  }, [input, mode]);

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {(["encode", "decode"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors",
              mode === m ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300 dark:hover:bg-ink-700",
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
        inputPlaceholder={mode === "encode" ? "Enter HTML to escape…" : "Enter escaped HTML to unescape…"}
      />
    </div>
  );
}
