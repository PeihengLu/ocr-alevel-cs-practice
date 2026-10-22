import type {
  CheckOutcome,
  QueryResultGrid,
  SqlCheck
} from '../../shared/pack/types'

export function evaluateChecks(
  result: QueryResultGrid,
  checks: SqlCheck[]
): CheckOutcome[] {
  return checks.map((check, index) => {
    if (check.type === 'row_count') {
      const passed = result.rows.length === check.expected
      return {
        index,
        type: check.type,
        passed,
        detail: passed
          ? `Row count is ${check.expected}.`
          : `Expected ${check.expected} row(s), got ${result.rows.length}.`
      }
    }

    if (check.type === 'columns') {
      const actual = result.columns.map((c) => c.toLowerCase())
      const expected = check.expected.map((c) => c.toLowerCase())
      const passed =
        actual.length === expected.length &&
        actual.every((c, i) => c === expected[i])
      return {
        index,
        type: check.type,
        passed,
        detail: passed
          ? `Columns match (${check.expected.join(', ')}).`
          : `Expected columns [${check.expected.join(', ')}], got [${result.columns.join(', ')}].`
      }
    }

    const ordered = Boolean(check.ordered)
    const passed = compareResultSets(result.rows, check.expected, ordered)
    return {
      index,
      type: check.type,
      passed,
      detail: passed
        ? ordered
          ? 'Result set matches (order required).'
          : 'Result set matches (order ignored).'
        : ordered
          ? 'Result set does not match expected rows/order.'
          : 'Result set does not match expected rows (order ignored).'
    }
  })
}

export function toGrid(
  columns: string[],
  rows: Record<string, unknown>[]
): QueryResultGrid {
  return {
    columns,
    rows: rows.map((row) => normalizeRow(row))
  }
}

function compareResultSets(
  actualRows: Record<string, unknown>[],
  expectedRows: Record<string, unknown>[],
  ordered: boolean
): boolean {
  const actual = actualRows.map((r) => normalizeRow(r))
  const expected = expectedRows.map((r) => normalizeRow(r))

  if (actual.length !== expected.length) return false

  // Friendly COUNT(*) / single-cell: ignore column alias when both sides are 1×1.
  if (
    actual.length === 1 &&
    expected.length === 1 &&
    Object.keys(actual[0]).length === 1 &&
    Object.keys(expected[0]).length === 1
  ) {
    const aVal = Object.values(actual[0])[0]
    const eVal = Object.values(expected[0])[0]
    if (valuesEqual(aVal, eVal)) return true
  }

  if (ordered) {
    return actual.every((row, i) => rowsEqual(row, expected[i]))
  }

  const left = actual.map(canonicalRow).sort()
  const right = expected.map(canonicalRow).sort()
  return left.every((v, i) => v === right[i])
}

function rowsEqual(
  a: Record<string, unknown>,
  b: Record<string, unknown>
): boolean {
  const keysA = Object.keys(a).sort()
  const keysB = Object.keys(b).sort()
  if (keysA.length !== keysB.length) return false
  if (keysA.some((k, i) => k !== keysB[i])) return false
  return keysA.every((k) => valuesEqual(a[k], b[k]))
}

function canonicalRow(row: Record<string, unknown>): string {
  const keys = Object.keys(row).sort()
  const obj: Record<string, unknown> = {}
  for (const k of keys) obj[k] = row[k]
  return JSON.stringify(obj)
}

function normalizeRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row)) {
    out[key.toLowerCase()] = normalizeValue(value)
  }
  return out
}

function normalizeValue(value: unknown): unknown {
  if (value === undefined) return null
  if (value === null) return null
  if (typeof value === 'bigint') return value.toString()
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(value)) {
    return value.toString('utf8')
  }
  if (value instanceof Date) {
    // Prefer date-only when time is midnight UTC (common DATE columns).
    const iso = value.toISOString()
    return iso.endsWith('T00:00:00.000Z') ? iso.slice(0, 10) : iso
  }
  if (typeof value === 'object' && value !== null) {
    // mysql2 DECIMAL sometimes comes as string already; leave objects as JSON.
    return JSON.parse(JSON.stringify(value)) as unknown
  }
  return value
}

function valuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a == null || b == null) return a === b
  if (typeof a === 'number' && typeof b === 'string' && b.trim() !== '') {
    return a === Number(b)
  }
  if (typeof b === 'number' && typeof a === 'string' && a.trim() !== '') {
    return b === Number(a)
  }
  return String(a) === String(b)
}
