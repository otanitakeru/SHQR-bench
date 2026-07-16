import {
  CartesianGrid,
  LabelList,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'
import type { ComparisonRow } from '../types'
import { DEFAULT_COLOR, PROVIDER_COLORS } from '../lib/colors'
import { useIsMobile } from '../hooks/useIsMobile'

interface Props {
  rows: ComparisonRow[]
}

export function CostVsScoreScatter({ rows }: Props) {
  const providers = [...new Set(rows.map((r) => String(r.provider)))]
  const isMobile = useIsMobile()
  const fontSize = isMobile ? 11 : 13
  const labelFontSize = isMobile ? 12 : 14

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-2 sm:p-4">
      <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 sm:mb-3">
        Cost per Paper vs Entry Score
      </h3>
      <ResponsiveContainer
        width="100%"
        height={isMobile ? 520 : 760}
        className="[&_svg]:outline-none [&_*]:focus:outline-none"
      >
        <ScatterChart
          accessibilityLayer={false}
          margin={{ top: 16, right: isMobile ? 12 : 56, bottom: isMobile ? 40 : 56, left: isMobile ? 12 : 56 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            type="number"
            dataKey="cost_usd_per_paper"
            name="Cost per Paper"
            unit="$"
            tick={{ fontSize }}
            label={{
              value: isMobile ? 'Cost per Paper (USD)' : 'Cost per Paper (USD, lower is better)',
              position: 'bottom',
              offset: isMobile ? 16 : 24,
              fontSize: labelFontSize,
            }}
          />
          <YAxis
            type="number"
            dataKey="entry_score"
            name="Entry Score"
            domain={[0.6, 1]}
            allowDataOverflow
            width={isMobile ? 34 : 70}
            tick={{ fontSize }}
            label={{
              value: isMobile ? 'Entry Score' : 'Entry Score (higher is better)',
              angle: -90,
              position: 'insideLeft',
              offset: isMobile ? -4 : -24,
              fontSize: labelFontSize,
              style: { textAnchor: 'middle' },
            }}
          />
          <ZAxis range={[220, 220]} />
          <Tooltip
            isAnimationActive={false}
            cursor={{ strokeDasharray: '3 3' }}
            formatter={(value, name) => (name === 'Cost per Paper' ? `$${Number(value).toFixed(4)}` : Number(value).toFixed(4))}
            labelFormatter={() => ''}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const point = payload[0].payload as ComparisonRow
              return (
                <div className="rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-1 text-xs shadow">
                  <p className="font-medium">{point.model}</p>
                  <p>Cost/paper: ${Number(point.cost_usd_per_paper).toFixed(4)}</p>
                  <p>Entry score: {Number(point.entry_score).toFixed(4)}</p>
                </div>
              )
            }}
          />
          <Legend
            verticalAlign="top"
            height={isMobile ? 52 : 32}
            wrapperStyle={{ fontSize: labelFontSize }}
          />
          {providers.map((provider) => (
            <Scatter
              key={provider}
              name={provider}
              data={rows.filter((r) => r.provider === provider)}
              fill={PROVIDER_COLORS[provider] ?? DEFAULT_COLOR}
              isAnimationActive={false}
            >
              <LabelList
                dataKey="model"
                position="right"
                offset={isMobile ? 6 : 8}
                fontSize={isMobile ? 10 : 12}
                className="fill-neutral-700 dark:fill-neutral-300"
              />
            </Scatter>
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
