import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Copy, Check, RefreshCw, Plus } from "lucide-react";
import { copyToClipboard } from "@/lib/utils";

function uuidv4(): string {
  if (crypto.randomUUID) return crypto.randomUUID();
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  arr[6] = (arr[6] & 0x0f) | 0x40;
  arr[8] = (arr[8] & 0x3f) | 0x80;
  const hex = [...arr].map((b) => b.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
}

export default function UuidGenerator() {
  const { t } = useTranslation();
  const [count, setCount] = useState(5);
  const [uuids, setUuids] = useState<string[]>(() => Array.from({ length: 5 }, uuidv4));
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const generate = () => {
    setUuids(Array.from({ length: count }, uuidv4));
  };

  const copyOne = async (uuid: string, i: number) => {
    if (await copyToClipboard(uuid)) {
      setCopiedIdx(i);
      setTimeout(() => setCopiedIdx(null), 2000);
    }
  };

  const copyAll = async () => {
    if (await copyToClipboard(uuids.join("\n"))) {
      setCopiedIdx(-1);
      setTimeout(() => setCopiedIdx(null), 2000);
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-3">
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
        <button onClick={generate} className="btn-primary">
          <RefreshCw className="h-4 w-4" />
          Generate
        </button>
        <button onClick={copyAll} className="btn-secondary">
          {copiedIdx === -1 ? <Check className="h-4 w-4 text-success-700" /> : <Copy className="h-4 w-4" />}
          {copiedIdx === -1 ? t("tool.copied") : "Copy All"}
        </button>
      </div>

      <div className="space-y-2">
        {uuids.map((uuid, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg border border-ink-200 p-3 dark:border-ink-700">
            <code className="font-mono text-sm text-ink-900 dark:text-ink-100">{uuid}</code>
            <button
              onClick={() => copyOne(uuid, i)}
              className="rounded-md p-1.5 text-ink-400 hover:bg-ink-100 hover:text-brand-600 dark:hover:bg-ink-800"
              aria-label={t("tool.copy")}
            >
              {copiedIdx === i ? <Check className="h-4 w-4 text-success-700" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
