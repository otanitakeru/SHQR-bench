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

interface Props {
  rows: ComparisonRow[]
}

export function CostVsScoreScatter({ rows }: Props) {
  const providers = [...new Set(rows.map((r) => String(r.provider)))]

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4">
      <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
        Cost per Paper vs Entry Score
      </h3>
      <ResponsiveContainer width="100%" height={760} className="[&_svg]:outline-none [&_*]:focus:outline-none">
        <ScatterChart accessibilityLayer={false} margin={{ top: 16, right: 56, bottom: 56, left: 56 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            type="number"
            dataKey="cost_usd_per_paper"
            name="Cost per Paper"
            unit="$"
            tick={{ fontSize: 13 }}
            label={{
              value: 'Cost per Paper (USD, lower is better)',
              position: 'bottom',
              offset: 24,
              fontSize: 14,
            }}
          />
          <YAxis
            type="number"
            dataKey="entry_score"
            name="Entry Score"
            domain={[0.6, 1]}
            allowDataOverflow
            width={70}
            tick={{ fontSize: 13 }}
            label={{
              value: 'Entry Score (higher is better)',
              angle: -90,
              position: 'insideLeft',
              offset: -24,
              fontSize: 14,
            }}
          />
          <ZAxis range={[220, 220]} />
          <Tooltip
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
          <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: 14 }} />
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
                offset={8}
                fontSize={12}
                className="fill-neutral-700 dark:fill-neutral-300"
              />
            </Scatter>
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
