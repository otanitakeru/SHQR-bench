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
import {
  getMetricOption,
  metricValue,
  type MetricKey,
} from "../lib/metricOptions";
import type { ComparisonRow } from "../types";

interface Props {
  rows: ComparisonRow[];
  xKey: MetricKey;
  yKey: MetricKey;
  title?: string;
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
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
];

const DEFAULT_HIDDEN_MODELS = [
  "gpt-5.6-terra",
  "gpt-5.6-luna",
  "gpt-5.4-nano",
  "claude-opus-4-6",
  "claude-haiku-4-5",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
];

const PROVIDER_ORDER = ["chatgpt", "claude", "gemini"];

function orderModels(models: string[]) {
  const known = MODEL_ORDER.filter((m) => models.includes(m));
  const unknown = models.filter((m) => !MODEL_ORDER.includes(m));
  return [...known, ...unknown];
}

/** Nice, snap125-rounded [min, max] for an axis, optionally capped so the top never exceeds `capMax`. */
function niceAxisDomain(capMax: number | undefined) {
  return ([dataMin, dataMax]: readonly [number, number]): [number, number] => {
    const ticks = getNiceTickValues([dataMin, dataMax], 5, true, "snap125");
    const niceMin = ticks[0];
    const niceMax =
      capMax != null
        ? Math.min(capMax, ticks[ticks.length - 1])
        : ticks[ticks.length - 1];
    return [niceMin, niceMax];
  };
}

/** Fixed-radius circle dot; ZAxis's `range` only takes effect when paired with a `dataKey`, so size is set directly here instead. */
function ScatterDot({
  cx,
  cy,
  fill,
}: {
  cx?: number;
  cy?: number;
  fill?: string;
}) {
  if (cx == null || cy == null) return null;
  return <circle cx={cx} cy={cy} r={6.5} fill={fill} />;
}

function orderProviders(providers: string[]) {
  const known = PROVIDER_ORDER.filter((p) => providers.includes(p));
  const unknown = providers.filter((p) => !PROVIDER_ORDER.includes(p));
  return [...known, ...unknown];
}

/** Places model name labels next to their point, nudging overlapping labels vertically until they clear already-placed ones. */
function ModelLabels({
  rows,
  xKey,
  yKey,
  isMobile,
}: {
  rows: ComparisonRow[];
  xKey: MetricKey;
  yKey: MetricKey;
  isMobile: boolean;
}) {
  const xScale = useXAxisScale();
  const yScale = useYAxisScale();
  const plotArea = usePlotArea();
  if (!xScale || !yScale) return null;

  const labelFontSize = isMobile ? 15 : 17;
  const offsetX = isMobile ? 8 : 8;
  const estCharWidth = labelFontSize * 0.45;
  const estHeight = labelFontSize + 6;
  const minY = plotArea ? plotArea.y + estHeight / 2 : -Infinity;
  const maxY = plotArea
    ? plotArea.y + plotArea.height - estHeight / 2
    : Infinity;

  const minX = plotArea ? plotArea.x : -Infinity;
  const maxX = plotArea ? plotArea.x + plotArea.width : Infinity;

  type Box = { left: number; right: number; top: number; bottom: number };
  const intersects = (a: Box, b: Box) =>
    !(
      a.right < b.left ||
      a.left > b.right ||
      a.bottom < b.top ||
      a.top > b.bottom
    );

  // Every point's dot is an obstacle too, not just other labels, so a label
  // nudged vertically to dodge one label doesn't land on top of a different dot.
  const dotRadius = 6.5;
  const dotBoxes: Box[] = rows.map((row) => {
    const dcx = xScale(metricValue(row, xKey)) ?? 0;
    const dcy = yScale(metricValue(row, yKey)) ?? 0;
    return {
      left: dcx - dotRadius,
      right: dcx + dotRadius,
      top: dcy - dotRadius,
      bottom: dcy + dotRadius,
    };
  });

  const placed: Box[] = [];
  const labels = rows.map((row, i) => {
    const cx = xScale(metricValue(row, xKey)) ?? 0;
    const cy = yScale(metricValue(row, yKey)) ?? 0;
    const width = row.model.length * estCharWidth + 8;
    const needed = width + offsetX;
    const spaceRight = maxX - cx;
    const spaceLeft = cx - minX;
    // Prefer the right side; fall back to the left only when it actually
    // has more room, so a clamp never forces the label into the dot.
    const placeLeft = spaceRight < needed && spaceLeft > spaceRight;
    const left = placeLeft ? cx - offsetX - width : cx + offsetX;
    const right = left + width;
    // Every dot except this label's own (which always sits right beside it).
    const otherDots = dotBoxes.filter((_, j) => j !== i);

    let dy = 0;
    let found = false;
    for (let step = 0; step <= 24 && !found; step++) {
      const candidates = step === 0 ? [0] : [step * 6, -step * 6];
      for (const candidate of candidates) {
        const centerY = Math.min(Math.max(cy + candidate, minY), maxY);
        const top = centerY - estHeight / 2;
        const bottom = top + estHeight;
        const box = { left, right, top, bottom };
        const overlaps =
          placed.some((b) => intersects(box, b)) ||
          otherDots.some((b) => intersects(box, b));
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

export function ScoreScatterChart({ rows, xKey, yKey, title }: Props) {
  const xOption = getMetricOption(xKey);
  const yOption = getMetricOption(yKey);
  const models = orderModels([...new Set(rows.map((r) => r.model))]);
  const providers = orderProviders([...new Set(rows.map((r) => r.provider))]);
  const defaultHidden = new Set(
    DEFAULT_HIDDEN_MODELS.filter((m) => models.includes(m)),
  );
  const [hiddenModels, setHiddenModels] = useState<Set<string>>(
    () => new Set(defaultHidden),
  );
  const isMobile = useIsMobile();
  const fontSize = isMobile ? 10 : 18;
  const labelFontSize = isMobile ? 12 : 20;
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
        {title ?? `${yOption.shortLabel} vs ${xOption.shortLabel}`}
      </h3>
      <ResponsiveContainer
        width="100%"
        height={isMobile ? 620 : 840}
        className="[&_svg]:outline-none **:focus:outline-none"
      >
        <ScatterChart
          accessibilityLayer={false}
          margin={{
            top: 5,
            right: isMobile ? 0 : 140,
            bottom: isMobile ? 0 : 64,
            left: isMobile ? 0 : 56,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            type="number"
            dataKey={xKey}
            name={xOption.label}
            unit={xOption.unit}
            domain={niceAxisDomain(xOption.capMax)}
            niceTicks="snap125"
            tickCount={4}
            padding={{ right: isMobile ? 30 : 100 }}
            tick={{ fontSize }}
            label={
              isMobile
                ? undefined
                : {
                    value: `${xOption.label} (${xOption.better === "lower" ? "lower is better" : "higher is better"})`,
                    position: "bottom",
                    offset: 30,
                    fontSize: labelFontSize,
                  }
            }
          />
          <YAxis
            type="number"
            dataKey={yKey}
            name={yOption.label}
            unit={yOption.unit}
            domain={niceAxisDomain(yOption.capMax)}
            niceTicks="snap125"
            width={isMobile ? 30 : 84}
            tick={{ fontSize }}
            label={
              isMobile
                ? undefined
                : {
                    value: `${yOption.label} (${yOption.better === "lower" ? "lower is better" : "higher is better"})`,
                    angle: -90,
                    position: "insideLeft",
                    offset: -24,
                    fontSize: labelFontSize,
                    style: { textAnchor: "middle" },
                  }
            }
          />
          <ZAxis range={[220, 220]} />
          <Tooltip
            isAnimationActive={false}
            cursor={{ strokeDasharray: "3 3" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0].payload as ComparisonRow;
              return (
                <div className="rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-3 text-base shadow">
                  <p className="font-medium">{point.model}</p>
                  <p>
                    {xOption.label}: {xOption.format(metricValue(point, xKey))}
                  </p>
                  <p>
                    {yOption.label}: {yOption.format(metricValue(point, yKey))}
                  </p>
                </div>
              );
            }}
          />
          <Legend
            verticalAlign="top"
            height={isMobile ? 44 : 44}
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
          <ModelLabels
            rows={visibleRows}
            xKey={xKey}
            yKey={yKey}
            isMobile={isMobile}
          />
        </ScatterChart>
      </ResponsiveContainer>

      <div className="sm:hidden flex flex-col gap-0.5 text-xs text-neutral-500 dark:text-neutral-400 mt-0 mb-6">
        <span>
          Y軸: {yOption.label} {yOption.better === "lower" ? "↓" : "↑"}
        </span>
        <span>
          X軸: {xOption.label} {xOption.better === "lower" ? "↓" : "↑"}
        </span>
      </div>

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
