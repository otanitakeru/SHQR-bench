import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ComparisonRow, RunIndexEntry } from '../types'
import { useRunDetail } from '../hooks/useRunDetail'
import { useIsMobile } from '../hooks/useIsMobile'

interface Props {
  runs: RunIndexEntry[]
  comparisonRows: ComparisonRow[]
  selectedRunId: string | null
  onSelectRun: (id: string) => void
}

export function RunDetail({ runs, comparisonRows, selectedRunId, onSelectRun }: Props) {
  const { summary, perPaper, error } = useRunDetail(selectedRunId)
  const isMobile = useIsMobile()

  const selectedRun = runs.find((r) => r.id === selectedRunId)
  const cost = comparisonRows.find(
    (r) => r.provider === selectedRun?.provider && r.model === selectedRun?.model,
  )

  const chartData = perPaper?.map((p) => ({
    paper: `#${p.paper_id}`,
    entry_score: p.entry_score.score,
    cer_percent: p.work_cer.cer_percent,
  }))
  // Cap the number of visible x-axis ticks so labels don't overlap on
  // narrow screens or when there are many papers.
  const maxTicks = isMobile ? 10 : 20
  const tickInterval = chartData ? Math.max(0, Math.ceil(chartData.length / maxTicks) - 1) : 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 flex-wrap">
        <label className="text-sm text-neutral-500 dark:text-neutral-400" htmlFor="run-select">
          Run:
        </label>
        <select
          id="run-select"
          value={selectedRunId ?? ''}
          onChange={(e) => onSelectRun(e.target.value)}
          className="text-sm rounded border border-neutral-300 dark:border-neutral-700 bg-transparent px-2 py-1"
        >
          <option value="" disabled>
            Select a run
          </option>
          {runs.map((r) => (
            <option key={r.id} value={r.id}>
              {r.model}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-500">Failed to load run: {error}</p>}

      {summary && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Entry Score" value={summary.entry_score.score.toFixed(4)} />
            <StatCard
              label="Papers Evaluated"
              value={`${summary.papers.evaluated} / ${summary.papers.total_gt}`}
            />
            <StatCard label="Missing Files" value={String(summary.papers.missing_files.length)} />
            <StatCard label="Null Results" value={String(summary.papers.null_results.length)} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              label="Detection Precision"
              value={summary.work_impressions.detection.precision.toFixed(4)}
            />
            <StatCard
              label="Detection Recall"
              value={summary.work_impressions.detection.recall.toFixed(4)}
            />
            <StatCard
              label="Detection F1"
              value={summary.work_impressions.detection.f1.toFixed(4)}
            />
            <StatCard
              label="Perfect Entry Rate"
              value={summary.work_impressions.perfect_entry.rate.toFixed(4)}
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              label="CER % (matched)"
              value={summary.work_impressions.cer_matched_only_rescored.cer_percent.toFixed(2)}
            />
            <StatCard label="Numbers Precision" value={summary.numbers.precision.toFixed(4)} />
            <StatCard label="Numbers Recall" value={summary.numbers.recall.toFixed(4)} />
            <StatCard label="Numbers F1" value={summary.numbers.f1.toFixed(4)} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              label="Overall ANLS"
              value={summary.overall_impression.anls_rescored_mean.toFixed(4)}
            />
            {cost && (
              <StatCard label="Cost / Paper (USD)" value={`$${Number(cost.cost_usd_per_paper).toFixed(4)}`} />
            )}
            <StatCard
              label="Tokens (in / out)"
              value={`${summary.generation.input_tokens.toLocaleString()} / ${summary.generation.output_tokens.toLocaleString()}`}
            />
            <StatCard label="Elapsed (s)" value={summary.generation.elapsed_seconds.toFixed(0)} />
          </div>
        </>
      )}

      {chartData && (
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4">
          <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
            Per-paper entry score
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="paper"
                tick={{ fontSize: 10 }}
                interval={tickInterval}
                angle={-45}
                textAnchor="end"
                height={50}
              />
              <YAxis domain={[0, 1]} tick={{ fontSize: 11 }} width={36} />
              <Tooltip formatter={(v) => Number(v).toFixed(3)} contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="entry_score" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {perPaper && (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-sm text-left">
            <thead className="bg-neutral-50 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400">
              <tr>
                <th className="px-3 py-2 font-medium">Paper</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Entry Score</th>
                <th className="px-3 py-2 font-medium">CER % (matched)</th>
                <th className="px-3 py-2 font-medium">Numbers Precision</th>
                <th className="px-3 py-2 font-medium">Numbers Recall</th>
                <th className="px-3 py-2 font-medium">Numbers F1</th>
                <th className="px-3 py-2 font-medium">Entry Exact Rate</th>
              </tr>
            </thead>
            <tbody>
              {perPaper.map((p) => (
                <tr
                  key={p.paper_id}
                  className="border-t border-neutral-100 dark:border-neutral-800"
                >
                  <td className="px-3 py-2">#{p.paper_id}</td>
                  <td className="px-3 py-2">{p.status}</td>
                  <td className="px-3 py-2">{p.entry_score.score.toFixed(4)}</td>
                  <td className="px-3 py-2">{p.work_cer.cer_percent.toFixed(2)}</td>
                  <td className="px-3 py-2">{Number(p.numbers.precision).toFixed(4)}</td>
                  <td className="px-3 py-2">{Number(p.numbers.recall).toFixed(4)}</td>
                  <td className="px-3 py-2">{p.numbers.f1.toFixed(4)}</td>
                  <td className="px-3 py-2">{Number(p.numbers.entry_exact_rate).toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-3">
      <p className="text-xs text-neutral-500 dark:text-neutral-400">{label}</p>
      <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{value}</p>
    </div>
  )
}
