// Minimal CSV parser for comparison.csv, which has no quoted or embedded commas.
export function parseCsv<T extends Record<string, unknown>>(text: string): T[] {
  const lines = text.trim().split(/\r\n|\n/)
  const headers = lines[0].split(',')

  return lines.slice(1).map((line) => {
    const cells = line.split(',')
    const row = {} as Record<string, unknown>
    headers.forEach((header, i) => {
      const raw = cells[i] ?? ''
      const num = Number(raw)
      row[header] = raw !== '' && !Number.isNaN(num) ? num : raw
    })
    return row as T
  })
}
