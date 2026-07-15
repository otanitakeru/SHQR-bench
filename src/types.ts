export interface ComparisonRow {
  [key: string]: string | number
  provider: string
  model: string
  papers_evaluated: number
  papers_missing: number
  null_results: number
  entry_score: number
  detection_precision: number
  detection_recall: number
  detection_f1: number
  work_cer_matched_only_rescored: number
  perfect_entry_rate: number
  numbers_precision: number
  numbers_recall: number
  numbers_f1: number
  numbers_coverage: number
  entry_exact_rate: number
  abstain_total: number
  abstain_correct: number
  abstain_missed: number
  work_cer_rescored: number
  work_cer: number
  work_cer_matched_only: number
  concat_cer_rescored: number
  concat_cer: number
  work_sub: number
  work_del: number
  work_ins: number
  overall_anls: number
  overall_cer: number
  overall_cer_rescored: number
  pairs: number
  potential_merges: number
  missed_gt: number
  extra_pred: number
  attempts: number
  input_tokens: number
  output_tokens: number
  elapsed_seconds: number
  cost_usd: number
  cost_usd_per_paper: number
}

export interface RunIndexEntry {
  id: string
  provider: string
  model: string
}

interface CerStats {
  ref_len: number
  errors: number
  sub: number
  del: number
  ins: number
  cer_percent: number
}

export interface RunSummary {
  run: {
    provider: string
    model: string
  }
  papers: {
    total_gt: number
    evaluated: number
    missing_files: string[]
    null_results: string[]
  }
  entry_score: {
    score: number
    numerator: number
    denominator: number
  }
  work_impressions: {
    detection: {
      precision: number
      recall: number
      f1: number
    }
    perfect_entry: {
      count: number
      total_gt_entries: number
      rate: number
    }
    cer_matched_only_rescored: CerStats
    matching: {
      pairs: number
      potential_merges: number
      missed_gt: number
      extra_pred: number
    }
  }
  overall_impression: {
    anls_rescored_mean: number
  }
  numbers: {
    precision: number
    recall: number
    f1: number
    entry_exact_rate: number
    coverage: number
    abstain: {
      total: number
      correct: number
      missed_number: number
    }
  }
  generation: {
    attempts: number
    input_tokens: number
    output_tokens: number
    elapsed_seconds: number
  }
  [key: string]: unknown
}

export interface PerPaperEntry {
  paper_id: number
  status: string
  entry_score: {
    score: number
    numerator: number
    denominator: number
  }
  work_cer: {
    ref_len: number
    errors: number
    sub: number
    del: number
    ins: number
    cer_percent: number
  }
  numbers: {
    precision: number
    recall: number
    f1: number
    entry_exact_rate: number
    [key: string]: unknown
  }
  [key: string]: unknown
}
