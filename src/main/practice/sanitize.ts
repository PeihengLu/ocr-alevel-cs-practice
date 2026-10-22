const BANNED =
  /\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|REPLACE|MERGE|GRANT|REVOKE|CALL|EXEC|EXECUTE|LOAD|HANDLER|LOCK|UNLOCK|SET|USE|SHOW|DESCRIBE|EXPLAIN|PREPARE|DEALLOCATE|SHUTDOWN|KILL|BENCHMARK|SLEEP)\b/i

/**
 * Allow a single SELECT (or WITH … SELECT) statement for student practice.
 * Rejects multi-statement payloads and common write/admin verbs.
 */
export function assertSafeSelect(sql: string): string {
  const stripped = stripSqlComments(sql).trim()
  if (!stripped) {
    throw new Error('Query is empty.')
  }

  const withoutTrailing = stripped.replace(/;+\s*$/, '').trim()
  if (!withoutTrailing) {
    throw new Error('Query is empty.')
  }

  if (withoutTrailing.includes(';')) {
    throw new Error('Only a single SQL statement is allowed.')
  }

  const forKeywordScan = maskSqlLiterals(withoutTrailing)
  if (/\bINTO\s+OUTFILE\b/i.test(forKeywordScan) || /\bINTO\s+DUMPFILE\b/i.test(forKeywordScan)) {
    throw new Error('SELECT … INTO OUTFILE/DUMPFILE is not allowed.')
  }

  if (BANNED.test(forKeywordScan)) {
    throw new Error(
      'Only read-only SELECT queries are allowed for this exercise (no DDL/DML/admin statements).'
    )
  }

  if (!/^\s*(WITH|SELECT)\b/i.test(withoutTrailing)) {
    throw new Error('Query must start with SELECT (or WITH … SELECT).')
  }

  return withoutTrailing
}

/** Replace quoted literals so keyword bans ignore string contents. */
function maskSqlLiterals(sql: string): string {
  return sql
    .replace(/'(?:[^']|'')*'/g, "''")
    .replace(/"(?:[^"]|"")*"/g, '""')
    .replace(/`[^`]*`/g, '``')
}

function stripSqlComments(sql: string): string {
  let out = ''
  let i = 0
  let inSingle = false
  let inDouble = false
  let inBacktick = false

  while (i < sql.length) {
    const ch = sql[i]
    const next = sql[i + 1]

    if (inSingle) {
      out += ch
      if (ch === "'" && next === "'") {
        out += next
        i += 2
        continue
      }
      if (ch === "'") inSingle = false
      i += 1
      continue
    }

    if (inDouble) {
      out += ch
      if (ch === '"' && next === '"') {
        out += next
        i += 2
        continue
      }
      if (ch === '"') inDouble = false
      i += 1
      continue
    }

    if (inBacktick) {
      out += ch
      if (ch === '`') inBacktick = false
      i += 1
      continue
    }

    if (ch === "'") {
      inSingle = true
      out += ch
      i += 1
      continue
    }
    if (ch === '"') {
      inDouble = true
      out += ch
      i += 1
      continue
    }
    if (ch === '`') {
      inBacktick = true
      out += ch
      i += 1
      continue
    }

    if (ch === '-' && next === '-') {
      i += 2
      while (i < sql.length && sql[i] !== '\n') i += 1
      continue
    }

    if (ch === '/' && next === '*') {
      i += 2
      while (i < sql.length - 1 && !(sql[i] === '*' && sql[i + 1] === '/')) i += 1
      i += 2
      continue
    }

    if (ch === '#') {
      while (i < sql.length && sql[i] !== '\n') i += 1
      continue
    }

    out += ch
    i += 1
  }

  return out
}
