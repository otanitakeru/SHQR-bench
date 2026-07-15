import { useEffect, useState } from 'react'
import type { PerPaperEntry, RunSummary } from '../types'

export function useRunDetail(runId: string | null) {
  const [summary, setSummary] = useState<RunSummary | null>(null)
  const [perPaper, setPerPaper] = useState<PerPaperEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!runId) {
      setSummary(null)
      setPerPaper(null)
      return
    }
    let cancelled = false
    setSummary(null)
    setPerPaper(null)
    setError(null)

    const base = `${import.meta.env.BASE_URL}data/runs/${runId}`
    Promise.all([
      fetch(`${base}/summary.json`).then((r) => r.json()),
      fetch(`${base}/per_paper.json`).then((r) => r.json()),
    ])
      .then(([s, p]) => {
        if (!cancelled) {
          setSummary(s)
          setPerPaper(p)
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })

    return () => {
      cancelled = true
    }
  }, [runId])

  return { summary, perPaper, error }
}
