import type { ReactElement } from 'react'

export interface ResultGridData {
  columns: string[]
  rows: Record<string, unknown>[]
}

export function ResultGrid({
  result
}: {
  result: ResultGridData
}): ReactElement {
  if (result.columns.length === 0) {
    return <p className="muted">Empty result (0 columns).</p>
  }

  return (
    <div className="result-scroll">
      <table className="result-table">
        <thead>
          <tr>
            {result.columns.map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.rows.length === 0 ? (
            <tr>
              <td colSpan={result.columns.length} className="muted">
                0 rows
              </td>
            </tr>
          ) : (
            result.rows.map((row, i) => (
              <tr key={i}>
                {result.columns.map((col) => (
                  <td key={col}>{formatCell(row[col.toLowerCase()] ?? row[col])}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}
