import type { FieldPacket, RowDataPacket } from 'mysql2'
import mysql from 'mysql2/promise'
import {
  CLASSROOM_DEMO_ID,
  CLASSROOM_SEED_SQL
} from '../../shared/demo/classroom'
import type { QueryRunResult, SqlQuestion } from '../../shared/pack/types'
import { readMysqlConfig } from '../db/config'
import {
  getMysqlConnected,
  getSqlAsset,
  recordAttempt
} from '../store/bank'
import { evaluateChecks, toGrid } from './compare'
import { assertSafeSelect } from './sanitize'

/** Dedicated DB for exercise seed + student SELECT (see sql/000_exercise_db.sql). */
export const EXERCISE_DATABASE = 'pl_exercise'

export async function runStudentQuery(
  question: SqlQuestion,
  rawSql: string
): Promise<QueryRunResult> {
  if (!getMysqlConnected()) {
    return {
      ok: false,
      passed: false,
      questionId: question.id,
      sql: rawSql,
      message:
        'MySQL is not connected. For local dev, start Homebrew MySQL (see README), create the app user/DB, then relaunch. Packaged builds will start a bundled mysqld beside the app. Pack browsing still works offline; Run Query needs MySQL.'
    }
  }

  let safeSql: string
  try {
    safeSql = assertSafeSelect(rawSql)
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

  const cfg = readMysqlConfig()

  try {
    await prepareExerciseSchema(cfg, seed)

    const student = await mysql.createConnection({
      host: cfg.host,
      port: cfg.port,
      user: cfg.user,
      password: cfg.password,
      database: EXERCISE_DATABASE,
      multipleStatements: false,
      dateStrings: true
    })

    try {
      await student.query('SET SESSION TRANSACTION READ ONLY')
      await student.beginTransaction()

      let rows: RowDataPacket[]
      let fields: FieldPacket[]
      try {
        const result = await student.query<RowDataPacket[]>(safeSql)
        rows = result[0]
        fields = result[1]
        await student.rollback()
      } catch (err) {
        try {
          await student.rollback()
        } catch {
          // ignore
        }
        throw err
      }

      if (!Array.isArray(rows)) {
        await recordAttempt(question.id, safeSql, false)
        return {
          ok: false,
          passed: false,
          questionId: question.id,
          sql: safeSql,
          message: 'Query did not return a result set (SELECT required).'
        }
      }

      const columns =
        fields?.map((f) => f.name).filter((name): name is string => Boolean(name)) ??
        (rows[0] ? Object.keys(rows[0]) : [])

      const grid = toGrid(
        columns,
        rows.map((row) => ({ ...(row as Record<string, unknown>) }))
      )

      const outcomes = evaluateChecks(grid, question.checks)
      const passed = outcomes.length === 0 ? true : outcomes.every((c) => c.passed)
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
    } finally {
      await student.end()
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
  }
}

/** Teacher demo helper — same isolation + grid; grading still reported. */
export async function runDemoQuery(
  question: SqlQuestion,
  rawSql: string
): Promise<QueryRunResult> {
  const graded = await runStudentQuery(question, rawSql)
  if (!graded.ok) return graded
  return {
    ...graded,
    message: graded.passed
      ? 'Demo query ran and matches the packaged checks.'
      : 'Demo query ran (result shown). Packaged checks did not all pass.'
  }
}

/**
 * Classroom projection: run a SELECT against the built-in school demo schema.
 * Does not touch student progress / attempts.
 */
export async function runClassroomQuery(rawSql: string): Promise<QueryRunResult> {
  if (!getMysqlConnected()) {
    return {
      ok: false,
      passed: false,
      questionId: CLASSROOM_DEMO_ID,
      sql: rawSql,
      message:
        'MySQL is not connected. Packaged Teacher apps start bundled mysqld automatically; for dev use Homebrew MySQL (see README).'
    }
  }

  let safeSql: string
  try {
    safeSql = assertSafeSelect(rawSql)
  } catch (err) {
    return {
      ok: false,
      passed: false,
      questionId: CLASSROOM_DEMO_ID,
      sql: rawSql,
      message: err instanceof Error ? err.message : String(err)
    }
  }

  const cfg = readMysqlConfig()

  try {
    await prepareExerciseSchema(cfg, CLASSROOM_SEED_SQL)

    const student = await mysql.createConnection({
      host: cfg.host,
      port: cfg.port,
      user: cfg.user,
      password: cfg.password,
      database: EXERCISE_DATABASE,
      multipleStatements: false,
      dateStrings: true
    })

    try {
      await student.query('SET SESSION TRANSACTION READ ONLY')
      await student.beginTransaction()

      let rows: RowDataPacket[]
      let fields: FieldPacket[]
      try {
        const result = await student.query<RowDataPacket[]>(safeSql)
        rows = result[0]
        fields = result[1]
        await student.rollback()
      } catch (err) {
        try {
          await student.rollback()
        } catch {
          // ignore
        }
        throw err
      }

      if (!Array.isArray(rows)) {
        return {
          ok: false,
          passed: false,
          questionId: CLASSROOM_DEMO_ID,
          sql: safeSql,
          message: 'Query did not return a result set (SELECT required).'
        }
      }

      const columns =
        fields?.map((f) => f.name).filter((name): name is string => Boolean(name)) ??
        (rows[0] ? Object.keys(rows[0]) : [])

      const grid = toGrid(
        columns,
        rows.map((row) => ({ ...(row as Record<string, unknown>) }))
      )

      return {
        ok: true,
        passed: true,
        questionId: CLASSROOM_DEMO_ID,
        sql: safeSql,
        result: grid,
        checks: [],
        message: `Result — ${grid.rows.length} row${grid.rows.length === 1 ? '' : 's'}.`
      }
    } finally {
      await student.end()
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return {
      ok: false,
      passed: false,
      questionId: CLASSROOM_DEMO_ID,
      sql: rawSql,
      message: `Query failed: ${message}`
    }
  }
}

async function prepareExerciseSchema(
  cfg: ReturnType<typeof readMysqlConfig>,
  seedSql: string
): Promise<void> {
  const conn = await mysql.createConnection({
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    password: cfg.password,
    multipleStatements: true,
    dateStrings: true
  })

  try {
    await ensureExerciseDatabase(conn)
    await conn.changeUser({ database: EXERCISE_DATABASE })
    await resetExerciseSchema(conn)
    await applySeed(conn, seedSql)
  } finally {
    await conn.end()
  }
}

async function ensureExerciseDatabase(conn: mysql.Connection): Promise<void> {
  try {
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${EXERCISE_DATABASE}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
  } catch {
    // portable user may lack CREATE — DB should exist via docker init.
  }

  try {
    await conn.query(`USE \`${EXERCISE_DATABASE}\``)
  } catch (err) {
    throw new Error(
      `Exercise database "${EXERCISE_DATABASE}" is missing or inaccessible (${err instanceof Error ? err.message : String(err)}). ` +
        'Create it once (see README): mysql -u root -e "CREATE DATABASE pl_exercise; GRANT ALL ON pl_exercise.* TO \'portable\'@\'localhost\'; FLUSH PRIVILEGES;"'
    )
  }
}

async function resetExerciseSchema(conn: mysql.Connection): Promise<void> {
  await conn.query('SET FOREIGN_KEY_CHECKS = 0')
  const [tables] = await conn.query<RowDataPacket[]>(
    `SELECT TABLE_NAME AS name
     FROM information_schema.tables
     WHERE table_schema = ?
       AND table_type = 'BASE TABLE'`,
    [EXERCISE_DATABASE]
  )
  for (const row of tables) {
    const name = String(row.name).replace(/`/g, '')
    await conn.query(`DROP TABLE IF EXISTS \`${name}\``)
  }
  await conn.query('SET FOREIGN_KEY_CHECKS = 1')
}

async function applySeed(conn: mysql.Connection, seedSql: string): Promise<void> {
  const trimmed = seedSql.trim()
  if (!trimmed) {
    throw new Error('Schema/seed SQL is empty.')
  }
  await conn.query(trimmed)
}
