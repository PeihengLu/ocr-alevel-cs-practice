/**
 * Run each shipped SQL solution against an in-memory SQLite database.
 *   node --experimental-strip-types scripts/smoke-sql.mts
 */
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { execScript, initSqlEngine, openMemoryDatabase, queryGrid } from '../src/main/db/sqlite.ts'
import { evaluateChecks, toGrid } from '../src/main/practice/compare.ts'
import { assertSafeSelect } from '../src/main/practice/sanitize.ts'

const root = process.cwd()
await initSqlEngine(join(root, 'node_modules/sql.js/dist/sql-wasm.wasm'))

const seed = readFileSync(join(root, 'samples/sql-basics/sql/school_basics.sql'), 'utf8')
const questionDir = join(root, 'samples/sql-basics/questions')
const files = readdirSync(questionDir).filter((name) => name.endsWith('.json'))
assert.ok(files.length > 0, 'no SQL questions found')

for (const file of files) {
  const question = JSON.parse(readFileSync(join(questionDir, file), 'utf8')) as {
    id: string
    solutionQuery: string
    effectQuery?: string
    statement?: string
    checks: Parameters<typeof evaluateChecks>[1]
  }
  const db = openMemoryDatabase()
  try {
    execScript(db, seed)
    const kind = question.statement ?? 'select'
    if (kind !== 'select') {
      assert.ok(question.effectQuery, `${question.id} missing effect query`)
      assertSafeSelect(question.effectQuery)
      execScript(db, question.solutionQuery)
      const raw = queryGrid(db, question.effectQuery)
      const outcomes = evaluateChecks(toGrid(raw.columns, raw.rows), question.checks)
      assert.ok(
        outcomes.every((check) => check.passed),
        `${question.id} failed: ${outcomes.map((check) => check.detail).join(' ')}`
      )
    } else {
      const raw = queryGrid(db, question.solutionQuery)
      const outcomes = evaluateChecks(toGrid(raw.columns, raw.rows), question.checks)
      assert.ok(
        outcomes.every((check) => check.passed),
        `${question.id} failed: ${outcomes.map((check) => check.detail).join(' ')} columns=${raw.columns.join(',')}`
      )
    }
  } finally {
    db.close()
  }
}

console.log(`sql smoke ok (${files.length} questions)`)
