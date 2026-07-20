import { useEffect, useState } from "react";

type CurrencyLine = {
  currencyTypeName: string;
  chaosEquivalent: number;
};

type ApiResponse = {
  lines?: CurrencyLine[];
  error?: string;
};

const LEAGUES = ["Standard", "Hardcore"];

export default function CurrencyPrices() {
  const [league, setLeague] = useState(LEAGUES[0]);
  const [lines, setLines] = useState<CurrencyLine[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError("");

    fetch(`/api/poe/currency?league=${encodeURIComponent(league)}`)
      .then(async (res) => {
        const data = (await res.json()) as ApiResponse;
        if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
        return data;
      })
      .then((data) => {
        if (cancelled) return;
        const sorted = (data.lines ?? [])
          .filter((l) => l.chaosEquivalent > 0)
          .sort((a, b) => b.chaosEquivalent - a.chaosEquivalent);
        setLines(sorted);
        setStatus("idle");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load prices.");
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [league]);

  const filtered = lines.filter((l) =>
    l.currencyTypeName.toLowerCase().includes(query.toLowerCase()),
  );

  const selectClass =
    "rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-100 dark:focus:ring-brand-900";

  return (
    <div className="card">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium">
          League{" "}
          <select
            value={league}
            onChange={(e) => setLeague(e.target.value)}
            className={selectClass + " ml-1"}
          >
            {LEAGUES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <input
          type="search"
          placeholder="Filter currency..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={selectClass + " flex-1 sm:max-w-xs"}
        />
      </div>

      {status === "loading" && (
        <p className="py-8 text-center text-ink-500">Loading live prices...</p>
      )}

      {status === "error" && (
        <div className="py-8 text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <p className="mt-1 text-xs text-ink-500">
            Live data comes from poe.ninja via an edge-cached proxy. Try again shortly.
          </p>
        </div>
      )}

      {status === "idle" && (
        <div className="overflow-hidden rounded-lg border border-ink-200 dark:border-ink-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink-100 text-xs uppercase tracking-wide text-ink-500 dark:bg-ink-800/60">
              <tr>
                <th className="px-4 py-2 font-medium">Currency</th>
                <th className="px-4 py-2 text-right font-medium">Chaos value</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 50).map((l) => (
                <tr
                  key={l.currencyTypeName}
                  className="border-t border-ink-100 dark:border-ink-800"
                >
                  <td className="px-4 py-2">{l.currencyTypeName}</td>
                  <td className="px-4 py-2 text-right font-mono">
                    {l.chaosEquivalent.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-4 py-8 text-center text-ink-500">
                    No currency matches your filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-ink-400">
        Data source: poe.ninja. Cached for 10 minutes at the edge.
      </p>
    </div>
  );
}
