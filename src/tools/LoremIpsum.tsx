import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ToolIO } from "@/components/ToolIO";

const WORDS = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum".split(" ");

function rand(n: number) { return Math.floor(Math.random() * n); }

function makeSentence() {
  const len = 6 + rand(10);
  const words = Array.from({ length: len }, () => WORDS[rand(WORDS.length)]);
  const s = words.join(" ");
  return s[0].toUpperCase() + s.slice(1) + ".";
}

function makeParagraph() {
  const len = 3 + rand(5);
  return Array.from({ length: len }, makeSentence).join(" ");
}

export default function LoremIpsum() {
  const [count, setCount] = useState(3);
  const [type, setType] = useState<"paragraphs" | "sentences" | "words">("paragraphs");
  const [output, setOutput] = useState("");

  const generate = () => {
    let result = "";
    if (type === "paragraphs") {
      result = Array.from({ length: count }, makeParagraph).join("\n\n");
    } else if (type === "sentences") {
      result = Array.from({ length: count }, makeSentence).join(" ");
    } else {
      result = Array.from({ length: count }, () => WORDS[rand(WORDS.length)]).join(" ");
    }
    setOutput(result);
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-4">
        <div>
          <label className="label">Count</label>
          <input
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={(e) => setCount(Math.min(100, Math.max(1, Number(e.target.value) || 1)))}
            className="input w-24"
          />
        </div>
        <div>
          <label className="label">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
            className="input"
          >
            <option value="paragraphs">Paragraphs</option>
            <option value="sentences">Sentences</option>
            <option value="words">Words</option>
          </select>
        </div>
        <button onClick={generate} className="btn-primary">Generate</button>
      </div>
      <ToolIO
        input={""}
        onInputChange={() => {}}
        output={output}
        inputPlaceholder="No input needed — configure and click Generate."
        outputPlaceholder="Generated text will appear here."
        downloadName="lorem-ipsum.txt"
      >
        <p className="mt-2 text-xs text-ink-400">{output ? `${output.split(/\s+/).length} words generated` : ""}</p>
      </ToolIO>
    </div>
  );
}
