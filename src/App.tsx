import { useState } from 'react'
import { useComparison } from './hooks/useComparison'
import { useRunsIndex } from './hooks/useRunsIndex'
import { Leaderboard } from './components/Leaderboard'
import { MetricBarChart } from './components/MetricBarChart'
import { CostVsScoreScatter } from './components/CostVsScoreScatter'
import { RunDetail } from './components/RunDetail'

type Tab = 'overview' | 'metrics' | 'detail'

function App() {
  const { rows, error } = useComparison()
  const runs = useRunsIndex()
  const [tab, setTab] = useState<Tab>('overview')
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)

  function selectModel(model: string) {
    setSelectedModel(model)
    const match = runs?.find((r) => r.model === model)
    if (match) setSelectedRunId(match.id)
    setTab('detail')
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <header className="border-b border-neutral-200 dark:border-neutral-800 px-6 py-4">
        <h1 className="text-xl font-semibold">
          SHQR Bench <span className="font-normal text-neutral-400">(Structured Handwritten Questionnaire Recognition)</span>
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Questionnaire OCR/extraction benchmark results across models
        </p>
        <nav className="flex gap-4 mt-3">
          <TabButton active={tab === 'overview'} onClick={() => setTab('overview')}>
            Overview
          </TabButton>
          <TabButton active={tab === 'metrics'} onClick={() => setTab('metrics')}>
            Metrics
          </TabButton>
          <TabButton active={tab === 'detail'} onClick={() => setTab('detail')}>
            Run Detail
          </TabButton>
        </nav>
      </header>

      <main className="px-6 py-6 max-w-6xl mx-auto flex flex-col gap-6">
        {error && <p className="text-sm text-red-500">Failed to load comparison.csv: {error}</p>}
        {!rows && !error && <p className="text-sm text-neutral-500">Loading...</p>}

        {rows && tab === 'overview' && <CostVsScoreScatter rows={rows} />}

        {rows && tab === 'metrics' && (
          <>
            <Leaderboard rows={rows} selectedModel={selectedModel} onSelectModel={selectModel} />
            <div className="flex flex-col gap-4">
              <MetricBarChart rows={rows} metricKey="entry_score" title="Entry Score" better="higher" />
              <MetricBarChart
                rows={rows}
                metricKey="work_cer_matched_only_rescored"
                title="Character Error Rate % (matched)"
                better="lower"
                formatValue={(v) => `${v.toFixed(2)}%`}
              />
              <MetricBarChart
                rows={rows}
                metricKey="detection_f1"
                title="Detection F1"
                better="higher"
              />
              <MetricBarChart
                rows={rows}
                metricKey="cost_usd_per_paper"
                title="Cost per Paper (USD)"
                better="lower"
                formatValue={(v) => `$${v.toFixed(4)}`}
              />
            </div>
          </>
        )}

        {tab === 'detail' && (
          <RunDetail
            runs={runs ?? []}
            comparisonRows={rows ?? []}
            selectedRunId={selectedRunId}
            onSelectRun={setSelectedRunId}
          />
        )}
      </main>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`text-sm pb-2 border-b-2 ${
        active
          ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
          : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
      }`}
    >
      {children}
    </button>
  )
}

export default App
