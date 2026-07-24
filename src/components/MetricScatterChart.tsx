import { useState } from "react";
import { ScoreScatterChart } from "./ScoreScatterChart";
import { METRIC_OPTIONS, type MetricKey } from "../lib/metricOptions";
import type { ComparisonRow } from "../types";

interface Props {
  rows: ComparisonRow[];
}

const DEFAULT_X: MetricKey = "cost_usd_per_paper";
const DEFAULT_Y: MetricKey = "entry_score";

export function MetricScatterChart({ rows }: Props) {
  const [xKey, setXKey] = useState<MetricKey>(DEFAULT_X);
  const [yKey, setYKey] = useState<MetricKey>(DEFAULT_Y);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-neutral-200 dark:border-neutral-800 p-3 text-sm">
        <label className="flex items-center gap-2">
          <span className="text-neutral-500 dark:text-neutral-400">Y軸</span>
          <select
            value={yKey}
            onChange={(e) => setYKey(e.target.value as MetricKey)}
            className="rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 px-2 py-1 text-sm"
          >
            {METRIC_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-neutral-500 dark:text-neutral-400">X軸</span>
          <select
            value={xKey}
            onChange={(e) => setXKey(e.target.value as MetricKey)}
            className="rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 px-2 py-1 text-sm"
          >
            {METRIC_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <ScoreScatterChart rows={rows} xKey={xKey} yKey={yKey} />
    </div>
  );
}
