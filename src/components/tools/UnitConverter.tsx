import { useMemo, useState } from "react";

type LinearUnit = { label: string; toBase: number };
type Category = {
  id: string;
  label: string;
  units: Record<string, LinearUnit>;
};

// Linear categories are defined by a factor to a common base unit.
const LINEAR_CATEGORIES: Category[] = [
  {
    id: "length",
    label: "Length",
    units: {
      mm: { label: "Millimeters (mm)", toBase: 0.001 },
      cm: { label: "Centimeters (cm)", toBase: 0.01 },
      m: { label: "Meters (m)", toBase: 1 },
      km: { label: "Kilometers (km)", toBase: 1000 },
      in: { label: "Inches (in)", toBase: 0.0254 },
      ft: { label: "Feet (ft)", toBase: 0.3048 },
      yd: { label: "Yards (yd)", toBase: 0.9144 },
      mi: { label: "Miles (mi)", toBase: 1609.344 },
    },
  },
  {
    id: "mass",
    label: "Mass",
    units: {
      mg: { label: "Milligrams (mg)", toBase: 0.001 },
      g: { label: "Grams (g)", toBase: 1 },
      kg: { label: "Kilograms (kg)", toBase: 1000 },
      t: { label: "Metric tons (t)", toBase: 1_000_000 },
      oz: { label: "Ounces (oz)", toBase: 28.349523125 },
      lb: { label: "Pounds (lb)", toBase: 453.59237 },
    },
  },
  {
    id: "data",
    label: "Data",
    units: {
      B: { label: "Bytes (B)", toBase: 1 },
      KB: { label: "Kilobytes (KB)", toBase: 1000 },
      MB: { label: "Megabytes (MB)", toBase: 1000 ** 2 },
      GB: { label: "Gigabytes (GB)", toBase: 1000 ** 3 },
      TB: { label: "Terabytes (TB)", toBase: 1000 ** 4 },
      KiB: { label: "Kibibytes (KiB)", toBase: 1024 },
      MiB: { label: "Mebibytes (MiB)", toBase: 1024 ** 2 },
      GiB: { label: "Gibibytes (GiB)", toBase: 1024 ** 3 },
    },
  },
];

const TEMP_UNITS: Record<string, string> = {
  C: "Celsius (°C)",
  F: "Fahrenheit (°F)",
  K: "Kelvin (K)",
};

const CATEGORY_OPTIONS = [
  ...LINEAR_CATEGORIES.map((c) => ({ id: c.id, label: c.label })),
  { id: "temperature", label: "Temperature" },
];

function toCelsius(value: number, from: string): number {
  if (from === "C") return value;
  if (from === "F") return (value - 32) * (5 / 9);
  return value - 273.15; // K
}

function fromCelsius(celsius: number, to: string): number {
  if (to === "C") return celsius;
  if (to === "F") return celsius * (9 / 5) + 32;
  return celsius + 273.15; // K
}

function convertTemperature(value: number, from: string, to: string): number {
  return fromCelsius(toCelsius(value, from), to);
}

function format(n: number): string {
  if (!Number.isFinite(n)) return "-";
  if (n === 0) return "0";
  const abs = Math.abs(n);
  if (abs >= 1e15 || abs < 1e-6) return n.toExponential(6);
  // Trim trailing zeros while keeping useful precision.
  return parseFloat(n.toPrecision(10)).toString();
}

export default function UnitConverter() {
  const [categoryId, setCategoryId] = useState("length");
  const [value, setValue] = useState("1");

  const isTemp = categoryId === "temperature";
  const linearCategory = LINEAR_CATEGORIES.find((c) => c.id === categoryId);

  const unitKeys = isTemp
    ? Object.keys(TEMP_UNITS)
    : Object.keys(linearCategory?.units ?? {});

  const [from, setFrom] = useState(unitKeys[0] ?? "");
  const [to, setTo] = useState(unitKeys[1] ?? unitKeys[0] ?? "");

  function onCategoryChange(id: string) {
    setCategoryId(id);
    const keys =
      id === "temperature"
        ? Object.keys(TEMP_UNITS)
        : Object.keys(LINEAR_CATEGORIES.find((c) => c.id === id)?.units ?? {});
    setFrom(keys[0] ?? "");
    setTo(keys[1] ?? keys[0] ?? "");
  }

  const result = useMemo(() => {
    const num = parseFloat(value);
    if (Number.isNaN(num) || !from || !to) return "";
    if (isTemp) return format(convertTemperature(num, from, to));
    const units = linearCategory?.units;
    if (!units) return "";
    const base = num * units[from].toBase;
    return format(base / units[to].toBase);
  }, [value, from, to, isTemp, linearCategory]);

  const unitLabel = (k: string) =>
    isTemp ? TEMP_UNITS[k] : (linearCategory?.units[k]?.label ?? k);

  function swap() {
    setFrom(to);
    setTo(from);
  }

  const selectClass =
    "w-full rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-100 dark:focus:ring-brand-900";

  return (
    <div className="card">
      <div className="mb-6 flex flex-wrap gap-2">
        {CATEGORY_OPTIONS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onCategoryChange(c.id)}
            aria-pressed={categoryId === c.id}
            className={
              "rounded-full px-3 py-1.5 text-sm font-medium transition " +
              (categoryId === c.id
                ? "bg-brand-600 text-white"
                : "bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300 dark:hover:bg-ink-700")
            }
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="grid items-end gap-4 sm:grid-cols-[1fr_auto_1fr]">
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Value</label>
            <input
              type="number"
              inputMode="decimal"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className={selectClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">From</label>
            <select
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className={selectClass}
            >
              {unitKeys.map((k) => (
                <option key={k} value={k}>
                  {unitLabel(k)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={swap}
          aria-label="Swap units"
          title="Swap units"
          className="mx-auto mb-1 grid h-10 w-10 place-items-center rounded-full border border-ink-300 text-ink-500 transition hover:bg-ink-100 hover:text-ink-900 dark:border-ink-700 dark:hover:bg-ink-800 dark:hover:text-white"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M7 16V4M7 4L3 8M7 4l4 4M17 8v12M17 20l4-4M17 20l-4-4" />
          </svg>
        </button>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Result</label>
            <output className={selectClass + " block truncate font-mono"}>
              {result || "-"}
            </output>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">To</label>
            <select
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className={selectClass}
            >
              {unitKeys.map((k) => (
                <option key={k} value={k}>
                  {unitLabel(k)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {result && (
        <p className="mt-6 text-center text-lg">
          <span className="font-semibold">{value || "0"}</span>{" "}
          <span className="text-ink-500">{from}</span> ={" "}
          <span className="font-semibold text-brand-600 dark:text-brand-400">
            {result}
          </span>{" "}
          <span className="text-ink-500">{to}</span>
        </p>
      )}
    </div>
  );
}
