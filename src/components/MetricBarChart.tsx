import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ComparisonRow } from '../types'
import { DEFAULT_COLOR, PROVIDER_COLORS } from '../lib/colors'
import { useIsMobile } from '../hooks/useIsMobile'

interface Props {
  rows: ComparisonRow[]
  metricKey: keyof ComparisonRow
  title: string
  /** Whether a higher or lower value is the better result. Determines sort order (best first, on the left) and the arrow shown next to the title. */
  better: 'higher' | 'lower'
  formatValue?: (v: number) => string
}

export function MetricBarChart({ rows, metricKey, title, better, formatValue }: Props) {
  const isMobile = useIsMobile()
  const data = rows
    .map((row) => ({
      name: row.model,
      provider: String(row.provider),
      value: Number(row[metricKey]),
    }))
    .sort((a, b) => (better === 'higher' ? b.value - a.value : a.value - b.value))

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4">
      <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
        {title}
        <span className="ml-1 text-neutral-400">{better === 'higher' ? '↑' : '↓'}</span>
      </h3>
      <ResponsiveContainer width="100%" height={isMobile ? 320 : 360}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: isMobile ? 70 : 56, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="opacity-30" />
          <XAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: isMobile ? 9 : 11 }}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={isMobile ? 84 : 70}
          />
          <YAxis type="number" tick={{ fontSize: isMobile ? 10 : 11 }} width={36} />
          <Tooltip
            formatter={(v) => (formatValue ? formatValue(Number(v)) : Number(v).toFixed(3))}
            contentStyle={{ fontSize: 12 }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={PROVIDER_COLORS[d.provider] ?? DEFAULT_COLOR} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
