import type { ComparisonRow } from '../types'

export type MetricKey =
  | 'entry_score'
  | 'detection_precision'
  | 'detection_recall'
  | 'detection_f1'
  | 'work_cer_matched_only_rescored'
  | 'work_cer_rescored'
  | 'work_cer'
  | 'concat_cer_rescored'
  | 'overall_anls'
  | 'perfect_entry_rate'
  | 'entry_exact_rate'
  | 'numbers_precision'
  | 'numbers_recall'
  | 'numbers_f1'
  | 'numbers_coverage'
  | 'cost_usd_per_paper'
  | 'cost_usd'
  | 'elapsed_seconds'
  | 'input_tokens'
  | 'output_tokens'

export interface MetricOption {
  key: MetricKey
  label: string
  shortLabel: string
  unit?: string
  /** Whether a higher or lower value is the better result. */
  better: 'higher' | 'lower'
  /** Caps the axis domain at this value (used for 0-1 ratio scores). */
  capMax?: number
  format: (v: number) => string
}

export const METRIC_OPTIONS: MetricOption[] = [
  { key: 'entry_score', label: 'Entry Score', shortLabel: 'Entry Score', better: 'higher', capMax: 1, format: (v) => v.toFixed(4) },
  { key: 'detection_f1', label: 'Detection F1', shortLabel: 'Detection F1', better: 'higher', capMax: 1, format: (v) => v.toFixed(4) },
  { key: 'detection_precision', label: 'Detection Precision', shortLabel: 'Det. Precision', better: 'higher', capMax: 1, format: (v) => v.toFixed(4) },
  { key: 'detection_recall', label: 'Detection Recall', shortLabel: 'Det. Recall', better: 'higher', capMax: 1, format: (v) => v.toFixed(4) },
  { key: 'work_cer_matched_only_rescored', label: 'Character Error Rate % (matched)', shortLabel: 'CER % (matched)', unit: '%', better: 'lower', format: (v) => `${v.toFixed(2)}%` },
  { key: 'work_cer_rescored', label: 'Character Error Rate % (rescored)', shortLabel: 'CER % (rescored)', unit: '%', better: 'lower', format: (v) => `${v.toFixed(2)}%` },
  { key: 'work_cer', label: 'Character Error Rate %', shortLabel: 'CER %', unit: '%', better: 'lower', format: (v) => `${v.toFixed(2)}%` },
  { key: 'concat_cer_rescored', label: 'Concat CER % (rescored)', shortLabel: 'Concat CER %', unit: '%', better: 'lower', format: (v) => `${v.toFixed(2)}%` },
  { key: 'overall_anls', label: 'Overall ANLS', shortLabel: 'ANLS', better: 'higher', capMax: 1, format: (v) => v.toFixed(4) },
  { key: 'perfect_entry_rate', label: 'Perfect Entry Rate', shortLabel: 'Perfect Entry Rate', better: 'higher', capMax: 1, format: (v) => v.toFixed(4) },
  { key: 'entry_exact_rate', label: 'Entry Exact Rate', shortLabel: 'Entry Exact Rate', better: 'higher', capMax: 1, format: (v) => v.toFixed(4) },
  { key: 'numbers_precision', label: 'Numbers Precision', shortLabel: 'Numbers Precision', better: 'higher', capMax: 1, format: (v) => v.toFixed(4) },
  { key: 'numbers_recall', label: 'Numbers Recall', shortLabel: 'Numbers Recall', better: 'higher', capMax: 1, format: (v) => v.toFixed(4) },
  { key: 'numbers_f1', label: 'Numbers F1', shortLabel: 'Numbers F1', better: 'higher', capMax: 1, format: (v) => v.toFixed(4) },
  { key: 'numbers_coverage', label: 'Numbers Coverage', shortLabel: 'Numbers Coverage', better: 'higher', capMax: 1, format: (v) => v.toFixed(4) },
  { key: 'cost_usd_per_paper', label: 'Cost per Paper (USD)', shortLabel: 'Cost / Paper', unit: '$', better: 'lower', format: (v) => `$${v.toFixed(4)}` },
  { key: 'cost_usd', label: 'Total Cost (USD)', shortLabel: 'Total Cost', unit: '$', better: 'lower', format: (v) => `$${v.toFixed(4)}` },
  { key: 'elapsed_seconds', label: 'Elapsed Time (s)', shortLabel: 'Elapsed (s)', unit: 's', better: 'lower', format: (v) => v.toFixed(1) },
  { key: 'input_tokens', label: 'Input Tokens', shortLabel: 'Input Tokens', better: 'lower', format: (v) => v.toLocaleString() },
  { key: 'output_tokens', label: 'Output Tokens', shortLabel: 'Output Tokens', better: 'lower', format: (v) => v.toLocaleString() },
]

export function getMetricOption(key: MetricKey): MetricOption {
  const found = METRIC_OPTIONS.find((m) => m.key === key)
  if (!found) throw new Error(`Unknown metric key: ${key}`)
  return found
}

export function metricValue(row: ComparisonRow, key: MetricKey): number {
  return Number(row[key])
}
