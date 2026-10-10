import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Copy, Ruler } from "lucide-react";

const UNITS = [
  { id: "ft", symbol: "ft", nameKey: "lengthDistance.unit.feet", metersNumerator: 381, metersDenominator: 1250 },
  { id: "m", symbol: "m", nameKey: "lengthDistance.unit.meters", metersNumerator: 1, metersDenominator: 1 },
  { id: "in", symbol: "in", nameKey: "lengthDistance.unit.inches", metersNumerator: 127, metersDenominator: 5000 },
  { id: "cm", symbol: "cm", nameKey: "lengthDistance.unit.centimeters", metersNumerator: 1, metersDenominator: 100 },
  { id: "mm", symbol: "mm", nameKey: "lengthDistance.unit.millimeters", metersNumerator: 1, metersDenominator: 1000 },
  { id: "mi", symbol: "mi", nameKey: "lengthDistance.unit.miles", metersNumerator: 201168, metersDenominator: 125 },
  { id: "km", symbol: "km", nameKey: "lengthDistance.unit.kilometers", metersNumerator: 1000, metersDenominator: 1 },
  { id: "nm", symbol: "nm", nameKey: "lengthDistance.unit.nanometers", metersNumerator: 1, metersDenominator: 1_000_000_000 },
] as const;

type UnitId = (typeof UNITS)[number]["id"];
type Preset = { id: string; from: UnitId; to: UnitId; labelKey: string };

const PRESETS: Preset[] = [
  { id: "feet-meters", from: "ft", to: "m", labelKey: "lengthDistance.preset.feetMeters" },
  { id: "inches-centimeters", from: "in", to: "cm", labelKey: "lengthDistance.preset.inchesCentimeters" },
  { id: "pulgadas-centimeters", from: "in", to: "cm", labelKey: "lengthDistance.preset.pulgadasCentimeters" },
  { id: "millimeters-centimeters", from: "mm", to: "cm", labelKey: "lengthDistance.preset.millimetersCentimeters" },
  { id: "miles-kilometers", from: "mi", to: "km", labelKey: "lengthDistance.preset.milesKilometers" },
  { id: "meters-nanometers", from: "m", to: "nm", labelKey: "lengthDistance.preset.metersNanometers" },
];

const REFERENCE_INPUTS = [1, 10, 100, 1000];

function getUnit(id: UnitId) {
  return UNITS.find((unit) => unit.id === id)!;
}

function convert(value: number, from: UnitId, to: UnitId): number | null {
  const source = getUnit(from);
  const target = getUnit(to);
  const ratio = (source.metersNumerator * target.metersDenominator)
    / (source.metersDenominator * target.metersNumerator);
  const converted = value * ratio;
  return Number.isFinite(converted) && !(value !== 0 && converted === 0) ? converted : null;
}

function formatValue(value: number): string {
  if (value === 0) return "0";
  return Number(value.toPrecision(12)).toLocaleString(undefined, {
    maximumSignificantDigits: 12,
    useGrouping: true,
  });
}

async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the browser-compatible copy fallback.
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  return copied;
}

export default function LengthDistanceConverter() {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const [from, setFrom] = useState<UnitId>("ft");
  const [to, setTo] = useState<UnitId>("m");
  const [selectedPreset, setSelectedPreset] = useState("feet-meters");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  const parsedValue = input.trim() === "" ? null : Number(input);
  const hasInvalidInput = input.trim() !== "" && (parsedValue === null || !Number.isFinite(parsedValue));
  const result = useMemo(
    () => parsedValue === null || !Number.isFinite(parsedValue) ? null : convert(parsedValue, from, to),
    [parsedValue, from, to],
  );
  const fromUnit = getUnit(from);
  const toUnit = getUnit(to);
  const referenceRows = useMemo(
    () => REFERENCE_INPUTS.map((amount) => ({ amount, result: convert(amount, from, to) })),
    [from, to],
  );

  const choosePreset = (preset: Preset) => {
    setFrom(preset.from);
    setTo(preset.to);
    setSelectedPreset(preset.id);
    setCopyState("idle");
  };

  const copyResult = async () => {
    if (parsedValue === null || result === null) return;
    const copied = await writeClipboard(`${input} ${fromUnit.symbol} = ${String(result)} ${toUnit.symbol}`);
    setCopyState(copied ? "copied" : "failed");
    window.setTimeout(() => setCopyState("idle"), 1800);
  };

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-ink-200 bg-white p-5 shadow-sm dark:border-ink-700 dark:bg-ink-950 sm:p-6" aria-labelledby="length-distance-controls">
        <div className="mb-5 flex items-center gap-2">
          <Ruler className="h-5 w-5 text-brand-500" aria-hidden="true" />
          <h2 id="length-distance-controls" className="text-lg font-semibold text-ink-900 dark:text-ink-100">
            {t("lengthDistance.converterHeading")}
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-end">
          <div>
            <label htmlFor="length-distance-input" className="label mb-2 block">{t("lengthDistance.amountLabel")}</label>
            <input
              id="length-distance-input"
              type="number"
              step="any"
              inputMode="decimal"
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                setCopyState("idle");
              }}
              placeholder={t("lengthDistance.amountPlaceholder")}
              className="input w-full font-mono"
              aria-describedby="length-distance-help length-distance-error"
              aria-invalid={hasInvalidInput || result === null && parsedValue !== null}
            />
            <p id="length-distance-help" className="mt-2 text-xs text-ink-500 dark:text-ink-400">
              {t("lengthDistance.liveHelp")}
            </p>
          </div>

          <span className="hidden pb-3 text-ink-400 md:block" aria-hidden="true">→</span>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="length-distance-from" className="label mb-2 block">{t("lengthDistance.fromLabel")}</label>
              <select id="length-distance-from" value={from} onChange={(event) => { setFrom(event.target.value as UnitId); setSelectedPreset(""); setCopyState("idle"); }} className="input w-full">
                {UNITS.map((unit) => <option key={unit.id} value={unit.id}>{t(unit.nameKey)} ({unit.symbol})</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="length-distance-to" className="label mb-2 block">{t("lengthDistance.toLabel")}</label>
              <select id="length-distance-to" value={to} onChange={(event) => { setTo(event.target.value as UnitId); setSelectedPreset(""); setCopyState("idle"); }} className="input w-full">
                {UNITS.map((unit) => <option key={unit.id} value={unit.id}>{t(unit.nameKey)} ({unit.symbol})</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-brand-200 bg-brand-50/70 p-4 dark:border-brand-800 dark:bg-brand-950/30" aria-live="polite" aria-atomic="true">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">{t("lengthDistance.resultLabel")}</p>
              <p className="mt-1 break-all font-mono text-2xl font-bold text-brand-800 dark:text-brand-200">
                {result === null ? "—" : `${formatValue(result)} ${toUnit.symbol}`}
              </p>
              {parsedValue !== null && result !== null && (
                <p className="mt-1 text-sm text-ink-600 dark:text-ink-300">
                  {formatValue(parsedValue)} {fromUnit.symbol} = {formatValue(result)} {toUnit.symbol}
                </p>
              )}
            </div>
            <button type="button" onClick={copyResult} disabled={parsedValue === null || result === null} className="btn btn-secondary shrink-0">
              {copyState === "copied" ? <Check className="h-4 w-4 text-success-700" /> : <Copy className="h-4 w-4" />}
              {copyState === "copied" ? t("lengthDistance.copied") : t("lengthDistance.copy")}
            </button>
          </div>
        </div>

        <div id="length-distance-error" className="mt-2 min-h-5" aria-live="polite">
          {hasInvalidInput && <p role="alert" className="text-sm text-danger-700 dark:text-danger-300">{t("lengthDistance.invalidValue")}</p>}
          {!hasInvalidInput && parsedValue !== null && result === null && <p role="alert" className="text-sm text-danger-700 dark:text-danger-300">{t("lengthDistance.outOfRange")}</p>}
          {copyState === "failed" && <p role="alert" className="text-sm text-danger-700 dark:text-danger-300">{t("lengthDistance.copyFailed")}</p>}
        </div>

        <div className="mt-6">
          <h3 className="label mb-2">{t("lengthDistance.quickConversions")}</h3>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => choosePreset(preset)}
                aria-pressed={selectedPreset === preset.id}
                className={`rounded-lg border px-3 py-2 text-sm transition-colors ${selectedPreset === preset.id
                  ? "border-brand-500 bg-brand-50 text-brand-800 dark:border-brand-400 dark:bg-brand-950 dark:text-brand-200"
                  : "border-ink-200 bg-white text-ink-600 hover:border-ink-400 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300"}`}
              >
                {t(preset.labelKey)}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="length-distance-reference" className="space-y-3">
        <h2 id="length-distance-reference" className="text-xl font-bold text-ink-900 dark:text-ink-100">{t("lengthDistance.referenceHeading")}</h2>
        <p className="text-sm text-ink-600 dark:text-ink-400">{t("lengthDistance.referenceDescription", { from: t(fromUnit.nameKey), to: t(toUnit.nameKey) })}</p>
        <div className="overflow-x-auto rounded-xl border border-ink-200 dark:border-ink-700">
          <table className="w-full min-w-[360px] border-collapse text-left text-sm">
            <caption className="sr-only">{t("lengthDistance.referenceCaption", { from: t(fromUnit.nameKey), to: t(toUnit.nameKey) })}</caption>
            <thead className="bg-ink-50 text-ink-700 dark:bg-ink-800 dark:text-ink-200">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">{t("lengthDistance.tableInput", { unit: fromUnit.symbol })}</th>
                <th scope="col" className="px-4 py-3 font-semibold">{t("lengthDistance.tableOutput", { unit: toUnit.symbol })}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-200 dark:divide-ink-700">
              {referenceRows.map(({ amount, result: rowResult }) => (
                <tr key={amount} className="bg-white dark:bg-ink-950">
                  <th scope="row" className="px-4 py-3 font-medium text-ink-900 dark:text-ink-100">{formatValue(amount)} {fromUnit.symbol}</th>
                  <td className="px-4 py-3 font-mono text-ink-600 dark:text-ink-300">{rowResult === null ? t("lengthDistance.outOfRange") : `${formatValue(rowResult)} ${toUnit.symbol}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="length-distance-how" className="space-y-3">
        <h2 id="length-distance-how" className="text-xl font-bold text-ink-900 dark:text-ink-100">{t("lengthDistance.howHeading")}</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-ink-600 dark:text-ink-300">
          <li>{t("lengthDistance.howStep1")}</li>
          <li>{t("lengthDistance.howStep2")}</li>
          <li>{t("lengthDistance.howStep3")}</li>
        </ol>
      </section>

      <section aria-labelledby="length-distance-formula" className="rounded-xl border border-ink-200 bg-ink-50 p-5 dark:border-ink-700 dark:bg-ink-900/60">
        <h2 id="length-distance-formula" className="text-lg font-bold text-ink-900 dark:text-ink-100">{t("lengthDistance.formulaHeading")}</h2>
        <p className="mt-2 text-sm leading-6 text-ink-600 dark:text-ink-300">{t("lengthDistance.formulaDescription")}</p>
        <p className="mt-3 rounded-lg bg-white px-3 py-2 font-mono text-sm text-ink-800 dark:bg-ink-950 dark:text-ink-200">{t("lengthDistance.formulaExpression")}</p>
      </section>
    </div>
  );
}
