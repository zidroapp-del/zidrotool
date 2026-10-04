import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { copyToClipboard } from "@/lib/utils";

const UNITS = [
  { label: "KB", name: "Kilobytes", divisor: 1024 },
  { label: "MB", name: "Megabytes", divisor: 1024 ** 2 },
  { label: "GB", name: "Gigabytes", divisor: 1024 ** 3 },
  { label: "TB", name: "Terabytes", divisor: 1024 ** 4 },
];

function formatValue(value: number): string {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 12,
    maximumSignificantDigits: 12,
  }).format(value);
}

export default function BytesConverter() {
  const [bytes, setBytes] = useState("");
  const [copiedUnit, setCopiedUnit] = useState<string | null>(null);

  const parsedBytes = bytes.trim() === "" ? null : Number(bytes);
  const isValid = parsedBytes !== null && Number.isFinite(parsedBytes) && parsedBytes >= 0;
  const conversions = useMemo(
    () => isValid && parsedBytes !== null
      ? UNITS.map((unit) => ({ ...unit, value: parsedBytes / unit.divisor }))
      : [],
    [isValid, parsedBytes],
  );

  const copyValue = async (unit: string, value: number) => {
    if (await copyToClipboard(String(value))) {
      setCopiedUnit(unit);
      window.setTimeout(() => setCopiedUnit((current) => current === unit ? null : current), 1600);
    }
  };

  return (
    <div className="space-y-8">
      <section aria-labelledby="bytes-input-heading">
        <label id="bytes-input-heading" htmlFor="bytes-input" className="label mb-2 block">
          Bytes
        </label>
        <input
          id="bytes-input"
          type="number"
          min="0"
          step="any"
          inputMode="decimal"
          value={bytes}
          onChange={(event) => setBytes(event.target.value)}
          placeholder="Enter a number of bytes, e.g. 1048576"
          className="input w-full font-mono"
        />
        <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
          Results update as you type. Binary units use 1 KB = 1,024 Bytes.
        </p>
      </section>

      <section aria-label="Converted byte values" className="grid gap-3 sm:grid-cols-2">
        {UNITS.map((unit) => {
          const conversion = conversions.find((item) => item.label === unit.label);
          const value = conversion ? formatValue(conversion.value) : "—";
          const copied = copiedUnit === unit.label;

          return (
            <article
              key={unit.label}
              className="rounded-xl border border-ink-200 bg-white p-4 dark:border-ink-700 dark:bg-ink-900"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-ink-500 dark:text-ink-400">
                    {unit.label} <span className="font-normal">({unit.name})</span>
                  </h2>
                  <p aria-live="polite" className="mt-2 break-all font-mono text-xl font-semibold text-ink-900 dark:text-ink-100">
                    {value}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => conversion && copyValue(unit.label, conversion.value)}
                  disabled={!conversion || !isValid}
                  className="btn btn-secondary shrink-0"
                  aria-label={`Copy ${unit.label} value`}
                >
                  {copied ? <Check className="h-4 w-4 text-success-700" /> : <Copy className="h-4 w-4" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </article>
          );
        })}
      </section>

      {bytes !== "" && !isValid && (
        <p role="alert" className="text-sm text-danger-700 dark:text-danger-300">
          Enter a valid non-negative number of bytes.
        </p>
      )}

      <section aria-labelledby="byte-reference-heading" className="space-y-4">
        <div>
          <h2 id="byte-reference-heading" className="text-xl font-bold text-ink-900 dark:text-ink-100">
            Byte Conversion Reference
          </h2>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            Common binary byte values used by this converter.
          </p>
        </div>
        <div className="overflow-x-auto rounded-xl border border-ink-200 dark:border-ink-700">
          <table className="w-full min-w-[360px] border-collapse text-left text-sm">
            <thead className="bg-ink-50 text-ink-700 dark:bg-ink-800 dark:text-ink-200">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Unit</th>
                <th scope="col" className="px-4 py-3 font-semibold">Equivalent in Bytes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-200 dark:divide-ink-700">
              {[
                ["1 KB", "1,024 Bytes"],
                ["1 MB", "1,048,576 Bytes"],
                ["1 GB", "1,073,741,824 Bytes"],
                ["1 TB", "1,099,511,627,776 Bytes"],
              ].map(([unit, value]) => (
                <tr key={unit} className="bg-white dark:bg-ink-900">
                  <th scope="row" className="px-4 py-3 font-medium text-ink-900 dark:text-ink-100">{unit}</th>
                  <td className="px-4 py-3 font-mono text-ink-600 dark:text-ink-300">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="byte-formulas-heading" className="rounded-xl border border-ink-200 bg-ink-50 p-5 dark:border-ink-700 dark:bg-ink-900/60">
        <h2 id="byte-formulas-heading" className="text-lg font-bold text-ink-900 dark:text-ink-100">
          Conversion Formulas
        </h2>
        <div className="mt-3 space-y-3 text-sm leading-6 text-ink-600 dark:text-ink-300">
          <p><strong className="text-ink-900 dark:text-ink-100">Binary (base 1024):</strong> This converter divides bytes by 1,024 for KB, then by each additional factor of 1,024 for MB, GB, and TB. These values are also commonly written as KiB, MiB, GiB, and TiB.</p>
          <p><strong className="text-ink-900 dark:text-ink-100">Decimal (base 1000):</strong> SI storage labels use 1 KB = 1,000 Bytes, 1 MB = 1,000,000 Bytes, and continue by multiplying by 1,000 per unit. The binary and decimal standards differ, so check which one a device or service uses.</p>
        </div>
      </section>
    </div>
  );
}