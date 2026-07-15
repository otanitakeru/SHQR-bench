import { useEffect, useState } from 'react'
import { parseCsv } from '../lib/csv'
import type { ComparisonRow } from '../types'

export function useComparison() {
  const [rows, setRows] = useState<ComparisonRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`${import.meta.env.BASE_URL}data/comparison.csv`)
      .then((res) => {
        if (!res.ok) throw new Error(`failed to load comparison.csv (${res.status})`)
        return res.text()
      })
      .then((text) => {
        if (!cancelled) setRows(parseCsv<ComparisonRow>(text))
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { rows, error }
}
