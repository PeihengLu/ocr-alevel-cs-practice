import type { QueryRunResult, SqlQuestion } from '../../shared/pack/types'
import { sqliteWasmPath } from '../db/paths'
import {
  execScript,
  initSqlEngine,
  openMemoryDatabase,
  queryGrid,
  sqlEngineReady
} from '../db/sqlite'
import { getSqlAsset, isSqliteReady, recordAttempt } from '../store/bank'
import { evaluateChecks, toGrid } from './compare'
import { assertPracticeStatement, assertSafeSelect } from './sanitize'

export async function runStudentQuery(
  question: SqlQuestion,
  rawSql: string
): Promise<QueryRunResult> {
  if (!isSqliteReady()) {
    try {
      await initSqlEngine(sqliteWasmPath())
    } catch {
      // initBank already reported the load failure.
    }
  }
  if (!sqlEngineReady()) {
    return {
      ok: false,
      passed: false,
      questionId: question.id,
      sql: rawSql,
      message: 'SQLite failed to load, so Run Query is unavailable. You can still read the questions.'
    }
  }

  const kind = question.statement ?? 'select'
  let safeSql: string
  try {
    safeSql = assertPracticeStatement(rawSql, kind)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await recordAttempt(question.id, rawSql, false)
    return {
      ok: false,
      passed: false,
      questionId: question.id,
      sql: rawSql,
      message
    }
  }

  if (kind !== 'select' && !question.effectQuery?.trim()) {
    return {
      ok: false,
      passed: false,
      questionId: question.id,
      sql: safeSql,
      message: 'This question is missing its check query.'
    }
  }

  const seed = getSqlAsset(question.schemaRef)
  if (!seed) {
    return {
      ok: false,
      passed: false,
      questionId: question.id,
      sql: rawSql,
      message: `Missing SQL schema asset "${question.schemaRef}" for this question.`
    }
  }

  const db = openMemoryDatabase()
  try {
    execScript(db, seed)

    if (kind !== 'select') {
      return await runWriteAndGrade(db, question, safeSql, question.effectQuery ?? '')
    }

    const raw = queryGrid(db, safeSql)
    if (raw.columns.length === 0) {
      await recordAttempt(question.id, safeSql, false)
      return {
        ok: false,
        passed: false,
        questionId: question.id,
        sql: safeSql,
        message: 'Query did not return a result set (SELECT required).'
      }
    }

    const grid = toGrid(raw.columns, raw.rows)
    const outcomes = evaluateChecks(grid, question.checks)
    const passed = outcomes.length === 0 ? true : outcomes.every((check) => check.passed)
    await recordAttempt(question.id, safeSql, passed)

    return {
      ok: true,
      passed,
      questionId: question.id,
      sql: safeSql,
      result: grid,
      checks: outcomes,
      message: passed
        ? 'Passed — your result matches the expected checks.'
        : 'Not yet — see check details below and try again.'
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await recordAttempt(question.id, rawSql, false)
    return {
      ok: false,
      passed: false,
      questionId: question.id,
      sql: rawSql,
      message: `Query failed: ${message}`
    }
  } finally {
    db.close()
  }
}

async function runWriteAndGrade(
  db: ReturnType<typeof openMemoryDatabase>,
  question: SqlQuestion,
  safeSql: string,
  effectQuery: string
): Promise<QueryRunResult> {
  let effectSql: string
  try {
    effectSql = assertSafeSelect(effectQuery)
  } catch (err) {
    return {
      ok: false,
      passed: false,
      questionId: question.id,
      sql: safeSql,
      message: `Check query was rejected: ${err instanceof Error ? err.message : String(err)}`
    }
  }

  execScript(db, safeSql)
  const raw = queryGrid(db, effectSql)
  if (raw.columns.length === 0) {
    await recordAttempt(question.id, safeSql, false)
    return {
      ok: false,
      passed: false,
      questionId: question.id,
      sql: safeSql,
      message: 'Check query did not return a result set.'
    }
  }

  const grid = toGrid(raw.columns, raw.rows)
  const outcomes = evaluateChecks(grid, question.checks)
  const passed = outcomes.length === 0 ? true : outcomes.every((check) => check.passed)
  await recordAttempt(question.id, safeSql, passed)
  return {
    ok: true,
    passed,
    questionId: question.id,
    sql: safeSql,
    result: grid,
    checks: outcomes,
    message: passed
      ? 'Passed — the database matches after your statement.'
      : 'Not yet — the database does not match. Look at the table below and try again.'
  }
}
