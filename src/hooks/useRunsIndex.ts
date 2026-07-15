import { useEffect, useState } from 'react'
import type { RunIndexEntry } from '../types'

export function useRunsIndex() {
  const [runs, setRuns] = useState<RunIndexEntry[] | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`${import.meta.env.BASE_URL}data/runs-index.json`)
      .then((res) => res.json())
      .then((data: RunIndexEntry[]) => {
        if (!cancelled) setRuns(data)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return runs
}
