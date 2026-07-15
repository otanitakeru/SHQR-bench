import { useMemo, useState } from 'react'
import type { ComparisonRow } from '../types'

interface Column {
  key: keyof ComparisonRow
  label: string
  format?: (v: number) => string
  /** Whether a higher or lower value is the better result, shown next to the header. */
  better: 'higher' | 'lower'
  /** Extra explanation appended to the header tooltip, e.g. what the metric actually measures. */
  description?: string
}

const COLUMNS: Column[] = [
  { key: 'model', label: 'Model', better: 'higher' },
  {
    key: 'entry_score',
    label: 'Entry Score',
    format: (v) => v.toFixed(4),
    better: 'higher',
    description: '各項目の一致度を集計した総合スコア',
  },
  {
    key: 'entry_exact_rate',
    label: 'Entry Exact Rate',
    format: (v) => v.toFixed(4),
    better: 'higher',
    description: '数値項目が完全一致した割合',
  },
  {
    key: 'detection_precision',
    label: 'Detection Precision',
    format: (v) => v.toFixed(4),
    better: 'higher',
    description: '検出した項目のうち正解と一致した割合',
  },
  {
    key: 'detection_recall',
    label: 'Detection Recall',
    format: (v) => v.toFixed(4),
    better: 'higher',
    description: '正解項目のうち検出できた割合',
  },
  {
    key: 'detection_f1',
    label: 'Detection F1',
    format: (v) => v.toFixed(4),
    better: 'higher',
    description: '項目検出のPrecisionとRecallの調和平均',
  },
  {
    key: 'numbers_precision',
    label: 'Numbers Precision',
    format: (v) => v.toFixed(4),
    better: 'higher',
    description: '抽出した数値のうち正解と一致した割合',
  },
  {
    key: 'numbers_recall',
    label: 'Numbers Recall',
    format: (v) => v.toFixed(4),
    better: 'higher',
    description: '正解の数値のうち抽出できた割合',
  },
  {
    key: 'numbers_f1',
    label: 'Numbers F1',
    format: (v) => v.toFixed(4),
    better: 'higher',
    description: '数値抽出のPrecisionとRecallの調和平均',
  },
  {
    key: 'work_cer_matched_only_rescored',
    label: 'CER % (matched)',
    format: (v) => v.toFixed(2),
    better: 'lower',
    description: '文字誤り率 (Character Error Rate)。正解と対応付けられた回答のみを対象に算出',
  },
  {
    key: 'overall_anls',
    label: 'Overall ANLS',
    format: (v) => v.toFixed(4),
    better: 'higher',
    description: '正規化された編集距離に基づく文字列類似度 (Average Normalized Levenshtein Similarity)',
  },
  {
    key: 'perfect_entry_rate',
    label: 'Perfect Entry Rate',
    format: (v) => v.toFixed(4),
    better: 'higher',
    description: '項目がすべて完全一致した回答の割合',
  },
  {
    key: 'cost_usd_per_paper',
    label: 'Cost / Paper (USD)',
    format: (v) => `$${v.toFixed(4)}`,
    better: 'lower',
  },
  { key: 'cost_usd', label: 'Total Cost (USD)', format: (v) => `$${v.toFixed(3)}`, better: 'lower' },
  { key: 'elapsed_seconds', label: 'Elapsed (s)', format: (v) => v.toFixed(0), better: 'lower' },
]

interface Props {
  rows: ComparisonRow[]
  selectedModel: string | null
  onSelectModel: (model: string) => void
}

export function Leaderboard({ rows, selectedModel, onSelectModel }: Props) {
  const [sortKey, setSortKey] = useState<keyof ComparisonRow>('entry_score')
  const [sortDesc, setSortDesc] = useState(true)

  const sorted = useMemo(() => {
    const copy = [...rows]
    copy.sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDesc ? bv - av : av - bv
      }
      return sortDesc
        ? String(bv).localeCompare(String(av))
        : String(av).localeCompare(String(bv))
    })
    return copy
  }, [rows, sortKey, sortDesc])

  function handleSort(key: keyof ComparisonRow) {
    if (key === sortKey) {
      setSortDesc((d) => !d)
    } else {
      setSortKey(key)
      setSortDesc(true)
    }
  }

  // For each numeric column, find the best and second-best distinct values so
  // the corresponding cells can be bolded / underlined.
  const rankByColumn = useMemo(() => {
    const map = new Map<keyof ComparisonRow, { best: number; second: number }>()
    for (const col of COLUMNS) {
      if (col.key === 'model') continue
      const values = [...new Set(rows.map((r) => Number(r[col.key])))].sort((a, b) =>
        col.better === 'higher' ? b - a : a - b,
      )
      if (values.length > 0) {
        map.set(col.key, { best: values[0], second: values[1] ?? values[0] })
      }
    }
    return map
  }, [rows])

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
      <table className="w-full text-sm text-left">
        <thead className="bg-neutral-50 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400">
          <tr>
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key)}
                title={
                  col.key === 'model'
                    ? undefined
                    : [
                        col.better === 'higher' ? '値が高いほど良い' : '値が低いほど良い',
                        col.description,
                      ]
                        .filter(Boolean)
                        .join(' / ')
                }
                className={`px-3 py-2 font-medium cursor-pointer select-none whitespace-nowrap hover:text-neutral-800 dark:hover:text-neutral-200 ${
                  sortKey === col.key ? 'text-neutral-900 dark:text-neutral-100' : ''
                } ${
                  col.key === 'model'
                    ? 'sticky left-0 z-10 bg-neutral-50 dark:bg-neutral-900'
                    : ''
                }`}
              >
                {col.label}
                {col.key !== 'model' && (
                  <span className="ml-1 text-neutral-400">
                    {col.better === 'higher' ? '↑' : '↓'}
                  </span>
                )}
                {sortKey === col.key ? (sortDesc ? ' ▾' : ' ▴') : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr
              key={`${row.provider}-${row.model}`}
              onClick={() => onSelectModel(row.model)}
              className={`border-t border-neutral-100 dark:border-neutral-800 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900 ${
                selectedModel === row.model ? 'bg-indigo-50 dark:bg-indigo-950' : ''
              }`}
            >
              {COLUMNS.map((col) => {
                const raw = row[col.key]
                const rank = rankByColumn.get(col.key)
                const isBest = rank !== undefined && Number(raw) === rank.best
                const isSecond = rank !== undefined && !isBest && Number(raw) === rank.second
                return (
                  <td
                    key={col.key}
                    className={`px-3 py-2 whitespace-nowrap ${isBest ? 'font-bold' : ''} ${
                      isSecond ? 'underline' : ''
                    } ${
                      col.key === 'model'
                        ? `sticky left-0 z-10 ${
                            selectedModel === row.model
                              ? 'bg-indigo-50 dark:bg-indigo-950'
                              : 'bg-white dark:bg-neutral-950'
                          }`
                        : ''
                    }`}
                  >
                    {col.format && typeof raw === 'number' ? col.format(raw) : String(raw)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
