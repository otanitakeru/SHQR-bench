import { useState } from "react";
import {
  CartesianGrid,
  getNiceTickValues,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  usePlotArea,
  useXAxisScale,
  useYAxisScale,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { useIsMobile } from "../hooks/useIsMobile";
import { DEFAULT_COLOR, PROVIDER_COLORS } from "../lib/colors";
import type { ComparisonRow } from "../types";

interface Props {
  rows: ComparisonRow[];
}

const MODEL_ORDER = [
  "gpt-5.6-sol",
  "gpt-5.6-terra",
  "gpt-5.6-luna",
  "gpt-5.5",
  "gpt-5.4-mini",
  "gpt-5.4-nano",
  "claude-fable-5",
  "claude-opus-4-8",
  "claude-opus-4-6",
  "claude-sonnet-5",
  "claude-haiku-4-5",
  "gemini-3.1-pro-preview",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
];

const DEFAULT_HIDDEN_MODELS = [
  "gpt-5.6-terra",
  "gpt-5.6-luna",
  "gpt-5.4-nano",
  "claude-opus-4-6",
  "claude-haiku-4-5",
  "gemini-3.5-flash",
];

const PROVIDER_ORDER = ["chatgpt", "claude", "gemini"];

function orderModels(models: string[]) {
  const known = MODEL_ORDER.filter((m) => models.includes(m));
  const unknown = models.filter((m) => !MODEL_ORDER.includes(m));
  return [...known, ...unknown];
}

/** Nice, snap125-rounded [min, max] for the score axis, capped so the top never exceeds 1. */
function niceScoreDomain([dataMin, dataMax]: readonly [number, number]): [
  number,
  number,
] {
  const ticks = getNiceTickValues([dataMin, dataMax], 5, true, "snap125");
  const niceMin = ticks[0];
  const niceMax = Math.min(1, ticks[ticks.length - 1]);
  return [niceMin, niceMax];
}

/** Fixed-radius circle dot; ZAxis's `range` only takes effect when paired with a `dataKey`, so size is set directly here instead. */
function ScatterDot({ cx, cy, fill }: { cx?: number; cy?: number; fill?: string }) {
  if (cx == null || cy == null) return null
  return <circle cx={cx} cy={cy} r={6.5} fill={fill} />
}

function orderProviders(providers: string[]) {
  const known = PROVIDER_ORDER.filter((p) => providers.includes(p));
  const unknown = providers.filter((p) => !PROVIDER_ORDER.includes(p));
  return [...known, ...unknown];
}

/** Places model name labels next to their point, nudging overlapping labels vertically until they clear already-placed ones. */
function ModelLabels({
  rows,
  isMobile,
}: {
  rows: ComparisonRow[];
  isMobile: boolean;
}) {
  const xScale = useXAxisScale();
  const yScale = useYAxisScale();
  const plotArea = usePlotArea();
  if (!xScale || !yScale) return null;

  const labelFontSize = isMobile ? 15 : 17;
  const offsetX = isMobile ? 6 : 8;
  const estCharWidth = labelFontSize * 0.58;
  const estHeight = labelFontSize + 6;
  const minY = plotArea ? plotArea.y + estHeight / 2 : -Infinity;
  const maxY = plotArea
    ? plotArea.y + plotArea.height - estHeight / 2
    : Infinity;

  const placed: { left: number; right: number; top: number; bottom: number }[] =
    [];
  const labels = rows.map((row) => {
    const cx = xScale(row.cost_usd_per_paper) ?? 0;
    const cy = yScale(row.entry_score) ?? 0;
    const width = row.model.length * estCharWidth + 8;
    const left = cx + offsetX;
    const right = left + width;

    let dy = 0;
    let found = false;
    for (let step = 0; step <= 24 && !found; step++) {
      const candidates = step === 0 ? [0] : [step * 6, -step * 6];
      for (const candidate of candidates) {
        const centerY = Math.min(Math.max(cy + candidate, minY), maxY);
        const top = centerY - estHeight / 2;
        const bottom = top + estHeight;
        const overlaps = placed.some(
          (box) =>
            !(
              right < box.left ||
              left > box.right ||
              bottom < box.top ||
              top > box.bottom
            ),
        );
        if (!overlaps) {
          dy = centerY - cy;
          found = true;
          break;
        }
      }
    }
    const ly = Math.min(Math.max(cy + dy, minY), maxY);
    placed.push({
      left,
      right,
      top: ly - estHeight / 2,
      bottom: ly + estHeight / 2,
    });
    return { model: row.model, cx, cy, lx: left, ly, dy: ly - cy };
  });

  return (
    <g>
      {labels.map((label) => (
        <g key={label.model}>
          {Math.abs(label.dy) > 4 && (
            <line
              x1={label.cx}
              y1={label.cy}
              x2={label.lx - 2}
              y2={label.ly}
              strokeWidth={1}
              strokeOpacity={0.35}
              className="stroke-neutral-400"
            />
          )}
          <text
            x={label.lx}
            y={label.ly}
            dy="0.32em"
            fontSize={labelFontSize}
            className="fill-neutral-700 dark:fill-neutral-300"
          >
            {label.model}
          </text>
        </g>
      ))}
    </g>
  );
}

export function CostVsScoreScatter({ rows }: Props) {
  const models = orderModels([...new Set(rows.map((r) => r.model))]);
  const providers = orderProviders([...new Set(rows.map((r) => r.provider))]);
  const defaultHidden = new Set(
    DEFAULT_HIDDEN_MODELS.filter((m) => models.includes(m)),
  );
  const [hiddenModels, setHiddenModels] = useState<Set<string>>(
    () => new Set(defaultHidden),
  );
  const isMobile = useIsMobile();
  const fontSize = isMobile ? 16 : 18;
  const labelFontSize = isMobile ? 18 : 20;
  const visibleRows = rows.filter((r) => !hiddenModels.has(r.model));

  function toggleModel(model: string) {
    setHiddenModels((prev) => {
      const next = new Set(prev);
      if (next.has(model)) next.delete(model);
      else next.add(model);
      return next;
    });
  }

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-2 sm:p-4">
      <h3 className="text-lg sm:text-xl font-medium text-neutral-700 dark:text-neutral-300 mb-2 sm:mb-3">
        Cost per Paper vs Entry Score
      </h3>
      <ResponsiveContainer
        width="100%"
        height={isMobile ? 620 : 840}
        className="[&_svg]:outline-none **:focus:outline-none"
      >
        <ScatterChart
          accessibilityLayer={false}
          margin={{
            top: 16,
            right: isMobile ? 72 : 140,
            bottom: isMobile ? 48 : 64,
            left: isMobile ? 12 : 56,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            type="number"
            dataKey="cost_usd_per_paper"
            name="Cost per Paper"
            unit="$"
            domain={['auto', 'auto']}
            niceTicks="snap125"
            tickCount={4}
            padding={{ right: isMobile ? 60 : 100 }}
            tick={{ fontSize }}
            label={{
              value: isMobile
                ? "Cost per Paper (USD)"
                : "Cost per Paper (USD, lower is better)",
              position: "bottom",
              offset: isMobile ? 20 : 30,
              fontSize: labelFontSize,
            }}
          />
          <YAxis
            type="number"
            dataKey="entry_score"
            name="Entry Score"
            domain={niceScoreDomain}
            niceTicks="snap125"
            width={isMobile ? 46 : 84}
            tick={{ fontSize }}
            label={{
              value: isMobile
                ? "Entry Score"
                : "Entry Score (higher is better)",
              angle: -90,
              position: "insideLeft",
              offset: isMobile ? -4 : -24,
              fontSize: labelFontSize,
              style: { textAnchor: "middle" },
            }}
          />
          <ZAxis range={[220, 220]} />
          <Tooltip
            isAnimationActive={false}
            cursor={{ strokeDasharray: "3 3" }}
            formatter={(value, name) =>
              name === "Cost per Paper"
                ? `$${Number(value).toFixed(4)}`
                : Number(value).toFixed(4)
            }
            labelFormatter={() => ""}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0].payload as ComparisonRow;
              return (
                <div className="rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-3 text-base shadow">
                  <p className="font-medium">{point.model}</p>
                  <p>
                    Cost/paper: ${Number(point.cost_usd_per_paper).toFixed(4)}
                  </p>
                  <p>Entry score: {Number(point.entry_score).toFixed(4)}</p>
                </div>
              );
            }}
          />
          <Legend
            verticalAlign="top"
            height={isMobile ? 64 : 44}
            wrapperStyle={{ fontSize: labelFontSize }}
          />
          {[...new Set(rows.map((r) => r.provider))].map((provider) => (
            <Scatter
              key={provider}
              name={provider}
              data={rows.filter(
                (r) => r.provider === provider && !hiddenModels.has(r.model),
              )}
              fill={PROVIDER_COLORS[provider] ?? DEFAULT_COLOR}
              isAnimationActive={false}
              shape={ScatterDot}
            />
          ))}
          <ModelLabels rows={visibleRows} isMobile={isMobile} />
        </ScatterChart>
      </ResponsiveContainer>

      <div className="flex items-center justify-between mt-3 mb-2">
        <h4 className="text-sm sm:text-base font-medium text-neutral-700 dark:text-neutral-300">
          表示するモデル
        </h4>
        <div className="flex gap-3 text-xs sm:text-sm shrink-0">
          <button
            onClick={() => setHiddenModels(new Set())}
            className="text-neutral-400 dark:text-neutral-500 hover:underline"
          >
            全選択
          </button>
          <button
            onClick={() => setHiddenModels(new Set(models))}
            className="text-neutral-400 dark:text-neutral-500 hover:underline"
          >
            全解除
          </button>
          <button
            onClick={() => setHiddenModels(new Set(defaultHidden))}
            className="text-neutral-400 dark:text-neutral-500 hover:underline"
          >
            デフォルトに戻す
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {providers.map((provider) => (
          <div key={provider} className="flex flex-wrap items-center gap-1.5">
            <span
              className="text-xs sm:text-sm font-medium w-20 sm:w-24 shrink-0"
              style={{ color: PROVIDER_COLORS[provider] ?? DEFAULT_COLOR }}
            >
              {provider}
            </span>
            {models
              .filter(
                (model) =>
                  rows.find((r) => r.model === model)?.provider === provider,
              )
              .map((model) => {
                const hidden = hiddenModels.has(model);
                return (
                  <button
                    key={model}
                    onClick={() => toggleModel(model)}
                    className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs sm:text-sm transition-opacity ${
                      hidden
                        ? "opacity-40 border-neutral-200 dark:border-neutral-700"
                        : "border-neutral-300 dark:border-neutral-600"
                    }`}
                  >
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{
                        backgroundColor:
                          PROVIDER_COLORS[provider] ?? DEFAULT_COLOR,
                      }}
                    />
                    <span
                      className={
                        hidden
                          ? "line-through text-neutral-400"
                          : "text-neutral-700 dark:text-neutral-300"
                      }
                    >
                      {model}
                    </span>
                  </button>
                );
              })}
          </div>
        ))}
      </div>
    </div>
  );
}
