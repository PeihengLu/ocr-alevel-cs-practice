const ADMIN_BANNED =
  /\b(UPDATE|ALTER|CREATE|TRUNCATE|REPLACE|MERGE|GRANT|REVOKE|CALL|EXEC|EXECUTE|LOAD|HANDLER|LOCK|UNLOCK|SET|USE|SHOW|DESCRIBE|EXPLAIN|PREPARE|DEALLOCATE|SHUTDOWN|KILL|BENCHMARK|SLEEP)\b/i

/** Databases a practice statement must not qualify with `db.table`. */
const PROTECTED_DATABASES = [
  'portable_leetcode',
  'mysql',
  'performance_schema',
  'sys',
  'pl_exercise'
] as const

export type PracticeStatement = 'select' | 'insert' | 'delete' | 'drop'

/**
 * Allow a single SELECT (or WITH … SELECT) statement for student practice.
 * Rejects multi-statement payloads and common write/admin verbs.
 */
export function assertSafeSelect(sql: string): string {
  return assertPracticeStatement(sql, 'select')
}

/**
 * One statement for a practice question.
 * `select` is read-only. `insert` / `delete` / `drop` match questions that
 * change a freshly seeded copy of the exercise database.
 */
export function assertPracticeStatement(sql: string, kind: PracticeStatement): string {
  const withoutTrailing = singleStatement(sql)
  assertNoForeignDatabase(withoutTrailing, 'pl_exercise')
  assertKind(withoutTrailing, kind)
  return withoutTrailing
}

function singleStatement(sql: string): string {
  const stripped = stripSqlComments(sql).trim()
  if (!stripped) throw new Error('Query is empty.')

  const withoutTrailing = stripped.replace(/;+\s*$/, '').trim()
  if (!withoutTrailing) throw new Error('Query is empty.')
  if (withoutTrailing.includes(';')) {
    throw new Error('Only a single SQL statement is allowed.')
  }
  return withoutTrailing
}

function assertKind(sql: string, kind: PracticeStatement): void {
  const scanned = maskSqlLiterals(sql)
  if (/\bINTO\s+OUTFILE\b/i.test(scanned) || /\bINTO\s+DUMPFILE\b/i.test(scanned)) {
    throw new Error('SELECT … INTO OUTFILE/DUMPFILE is not allowed.')
  }
  if (ADMIN_BANNED.test(scanned) || extraBanned(kind).test(scanned)) {
    throw new Error(rejectedMessage(kind))
  }
  if (!startsWithKind(sql, kind)) {
    throw new Error(rejectedMessage(kind))
  }
}

function startsWithKind(sql: string, kind: PracticeStatement): boolean {
  switch (kind) {
    case 'select':
      return /^\s*(WITH|SELECT)\b/i.test(sql)
    case 'insert':
      return /^\s*INSERT\s+INTO\b/i.test(sql)
    case 'delete':
      return /^\s*DELETE\s+FROM\b/i.test(sql)
    case 'drop':
      return /^\s*DROP\s+TABLE\b/i.test(sql)
  }
}

function extraBanned(kind: PracticeStatement): RegExp {
  switch (kind) {
    case 'select':
      return /\b(INSERT|DELETE|DROP)\b/i
    case 'insert':
      return /\b(DELETE|DROP)\b/i
    case 'delete':
      return /\b(INSERT|DROP)\b/i
    case 'drop':
      return /\b(INSERT|DELETE|SELECT|WITH)\b/i
  }
}

function rejectedMessage(kind: PracticeStatement): string {
  switch (kind) {
    case 'select':
      return 'Only read-only SELECT queries are allowed for this exercise (no DDL/DML/admin statements).'
    case 'insert':
      return 'This question needs a single INSERT INTO statement.'
    case 'delete':
      return 'This question needs a single DELETE FROM statement.'
    case 'drop':
      return 'This question needs a single DROP TABLE statement.'
  }
}

function assertNoForeignDatabase(sql: string, home: string): void {
  const masked = maskSqlLiterals(sql)
  for (const db of PROTECTED_DATABASES) {
    if (db === home) continue
    const plain = new RegExp(`\\b${db}\\b\\s*\\.`, 'i')
    const quoted = new RegExp('`' + db + '`\\s*\\.', 'i')
    if (plain.test(masked) || quoted.test(sql)) {
      throw new Error('That query references a database outside this exercise.')
    }
  }
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
