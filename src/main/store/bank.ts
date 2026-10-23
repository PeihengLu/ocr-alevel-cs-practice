import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import { app } from 'electron'
import mysql from 'mysql2/promise'
import {
  defaultProgress,
  emptyBank,
  mergePackIntoBank,
  questionsFromBank
} from '../../shared/pack/merge'
import type {
  AttemptRecord,
  BankSnapshot,
  PackPayload,
  ProgressRecord,
  QuestionProgressStatus,
  QuestionSummary,
  SqlQuestion,
  StorageBackend,
  StorageStatus
} from '../../shared/pack/types'
import { isMysqlExplicitlyDisabled, readMysqlConfig } from '../db/config'
import { migrateAppSchema } from '../db/migrate'
import { loadJsonBank, saveJsonBank } from './jsonBank'

let backend: StorageBackend = 'json'
let bank: BankSnapshot = emptyBank()
let mysqlPool: mysql.Pool | null = null
let statusMessage = 'Using local JSON bank (MySQL not connected).'
let mysqlConfigured = false
let mysqlConnected = false

function jsonBankPath(): string {
  return join(app.getPath('userData'), 'question-bank.json')
}

export async function initBank(): Promise<StorageStatus> {
  bank = await loadJsonBank(jsonBankPath())

  if (isMysqlExplicitlyDisabled()) {
    backend = 'json'
    mysqlConfigured = false
    mysqlConnected = false
    statusMessage =
      'JSON bank forced via PORTABLE_LEETCODE_STORAGE=json or MYSQL_DISABLED=1.'
    return getStorageStatus()
  }

  const cfg = readMysqlConfig(app.getPath('userData'))
  mysqlConfigured = true

  try {
    // Ensure database exists, then pool against it.
    const bootstrap = await mysql.createConnection({
      host: cfg.host,
      port: cfg.port,
      user: cfg.user,
      password: cfg.password,
      multipleStatements: true
    })
    await bootstrap.query(
      `CREATE DATABASE IF NOT EXISTS \`${cfg.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    await bootstrap.end()

    mysqlPool = mysql.createPool({
      host: cfg.host,
      port: cfg.port,
      user: cfg.user,
      password: cfg.password,
      database: cfg.database,
      waitForConnections: true,
      connectionLimit: 4
    })

    const conn = await mysqlPool.getConnection()
    try {
      await migrateAppSchema(conn)
      await hydrateFromMysql(conn)
      backend = 'mysql'
      mysqlConnected = true
      statusMessage = `Connected to MySQL at ${cfg.host}:${cfg.port}/${cfg.database}.`
      // Mirror to JSON so offline fallback stays warm.
      await saveJsonBank(jsonBankPath(), bank)
    } finally {
      conn.release()
    }
  } catch (err) {
    mysqlConnected = false
    backend = 'json'
    statusMessage = `MySQL unavailable (${err instanceof Error ? err.message : String(err)}). Using JSON bank at ${jsonBankPath()}.`
    mysqlPool = null
  }

  return getStorageStatus()
}

export function getStorageStatus(): StorageStatus {
  return {
    backend,
    mysqlConfigured,
    mysqlConnected,
    message: statusMessage,
    questionCount: Object.keys(bank.questions).length
  }
}

export function getMysqlConnected(): boolean {
  return mysqlConnected
}

export function listQuestions(): SqlQuestion[] {
  return questionsFromBank(bank)
}

export function listQuestionSummaries(): QuestionSummary[] {
  return questionsFromBank(bank).map((question) => ({
    question,
    progress: bank.progress[question.id] ?? defaultProgress(question.id)
  }))
}

export function getQuestion(id: string): SqlQuestion | null {
  return bank.questions[id] ?? null
}

export function getProgress(questionId: string): ProgressRecord {
  return bank.progress[questionId] ?? defaultProgress(questionId)
}

export function getSqlAsset(schemaRef: string): string | null {
  return bank.sqlAssets[schemaRef] ?? null
}

export async function upsertAuthoredQuestion(
  question: SqlQuestion,
  sqlAsset?: string
): Promise<void> {
  bank = {
    ...bank,
    questions: {
      ...bank.questions,
      [question.id]: question
    },
    sqlAssets:
      sqlAsset !== undefined
        ? { ...bank.sqlAssets, [question.schemaRef]: sqlAsset }
        : bank.sqlAssets
  }
  await persist()
}

export async function importPackPayload(
  pack: PackPayload
): Promise<{ merged: number; skipped: number; retired: number }> {
  const { bank: next, stats } = mergePackIntoBank(bank, pack)
  bank = next
  await persist(pack)
  return stats
}

export async function recordAttempt(
  questionId: string,
  submittedSql: string,
  passed: boolean | null
): Promise<AttemptRecord> {
  const attempt: AttemptRecord = {
    id: randomUUID(),
    questionId,
    submittedSql,
    passed,
    createdAt: new Date().toISOString()
  }
  const prev = bank.progress[questionId] ?? defaultProgress(questionId)
  const bestPassed = prev.bestPassed || passed === true
  const status: QuestionProgressStatus = bestPassed
    ? 'passed'
    : 'attempted'
  const progress: ProgressRecord = {
    questionId,
    status,
    bestPassed,
    attemptCount: prev.attemptCount + 1,
    lastAttemptAt: attempt.createdAt
  }
  bank = {
    ...bank,
    attempts: [...bank.attempts, attempt],
    progress: {
      ...bank.progress,
      [questionId]: progress
    }
  }
  await persistAttemptAndProgress(attempt, progress)
  return attempt
}

export async function buildPackFromQuestionIds(
  meta: {
    packId: string
    version: string
    title: string
    description?: string
    minAppVersion?: string
    retiredIds?: string[]
  },
  questionIds: string[]
): Promise<PackPayload> {
  const questions: SqlQuestion[] = []
  const sqlAssets: Record<string, string> = {}

  for (const id of questionIds) {
    const q = bank.questions[id]
    if (!q) throw new Error(`Unknown question id "${id}"`)
    questions.push(q)
    const sql = bank.sqlAssets[q.schemaRef]
    if (sql === undefined) {
      throw new Error(`Missing sql asset for schemaRef "${q.schemaRef}"`)
    }
    sqlAssets[q.schemaRef] = sql
  }

  return {
    manifest: {
      formatVersion: 1,
      packId: meta.packId,
      version: meta.version,
      title: meta.title,
      description: meta.description,
      createdAt: new Date().toISOString(),
      minAppVersion: meta.minAppVersion ?? '0.1.0',
      questionIds,
      retiredIds: meta.retiredIds
    },
    questions,
    sqlAssets
  }
}

async function persist(importedPack?: PackPayload): Promise<void> {
  await saveJsonBank(jsonBankPath(), bank)

  if (backend !== 'mysql' || !mysqlPool) return

  const conn = await mysqlPool.getConnection()
  try {
    await conn.beginTransaction()

    if (importedPack) {
      await conn.query(
        `INSERT INTO packs (pack_id, version, title, description, manifest_json)
         VALUES (?, ?, ?, ?, CAST(? AS JSON))
         ON DUPLICATE KEY UPDATE
           version = VALUES(version),
           title = VALUES(title),
           description = VALUES(description),
           imported_at = CURRENT_TIMESTAMP(3),
           manifest_json = VALUES(manifest_json)`,
        [
          importedPack.manifest.packId,
          importedPack.manifest.version,
          importedPack.manifest.title,
          importedPack.manifest.description ?? null,
          JSON.stringify(importedPack.manifest)
        ]
      )
    }

    for (const [ref, sql] of Object.entries(bank.sqlAssets)) {
      await conn.query(
        `INSERT INTO sql_assets (schema_ref, sql_text)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE sql_text = VALUES(sql_text)`,
        [ref, sql]
      )
    }

    for (const q of Object.values(bank.questions)) {
      const packId = importedPack?.manifest.packId ?? null
      if (packId) {
        await conn.query(
          `INSERT INTO questions (
             id, version, title, prompt, starter_query, solution_query,
             checks_json, tags_json, difficulty, schema_ref, pack_id
           ) VALUES (?, ?, ?, ?, ?, ?, CAST(? AS JSON), CAST(? AS JSON), ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             version = VALUES(version),
             title = VALUES(title),
             prompt = VALUES(prompt),
             starter_query = VALUES(starter_query),
             solution_query = VALUES(solution_query),
             checks_json = VALUES(checks_json),
             tags_json = VALUES(tags_json),
             difficulty = VALUES(difficulty),
             schema_ref = VALUES(schema_ref),
             pack_id = VALUES(pack_id)`,
          [
            q.id,
            q.version,
            q.title,
            q.prompt,
            q.starterQuery,
            q.solutionQuery ?? null,
            JSON.stringify(q.checks),
            JSON.stringify(q.tags),
            q.difficulty,
            q.schemaRef,
            packId
          ]
        )
      } else {
        await conn.query(
          `INSERT INTO questions (
             id, version, title, prompt, starter_query, solution_query,
             checks_json, tags_json, difficulty, schema_ref, pack_id
           ) VALUES (?, ?, ?, ?, ?, ?, CAST(? AS JSON), CAST(? AS JSON), ?, ?, NULL)
           ON DUPLICATE KEY UPDATE
             version = VALUES(version),
             title = VALUES(title),
             prompt = VALUES(prompt),
             starter_query = VALUES(starter_query),
             solution_query = VALUES(solution_query),
             checks_json = VALUES(checks_json),
             tags_json = VALUES(tags_json),
             difficulty = VALUES(difficulty),
             schema_ref = VALUES(schema_ref)`,
          [
            q.id,
            q.version,
            q.title,
            q.prompt,
            q.starterQuery,
            q.solutionQuery ?? null,
            JSON.stringify(q.checks),
            JSON.stringify(q.tags),
            q.difficulty,
            q.schemaRef
          ]
        )
      }
    }

    if (importedPack?.manifest.retiredIds?.length) {
      for (const id of importedPack.manifest.retiredIds) {
        await conn.query('DELETE FROM questions WHERE id = ?', [id])
        await conn.query('DELETE FROM progress WHERE question_id = ?', [id])
      }
    }

    await conn.commit()
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

/** Persist a single attempt + best progress (JSON always; MySQL when connected). */
async function persistAttemptAndProgress(
  attempt: AttemptRecord,
  progress: ProgressRecord
): Promise<void> {
  await saveJsonBank(jsonBankPath(), bank)

  if (backend !== 'mysql' || !mysqlPool) return

  const conn = await mysqlPool.getConnection()
  try {
    await conn.beginTransaction()
    // Ensure question row exists so FKs succeed (authored / imported already do).
    if (bank.questions[attempt.questionId]) {
      const q = bank.questions[attempt.questionId]
      await conn.query(
        `INSERT INTO questions (
           id, version, title, prompt, starter_query, solution_query,
           checks_json, tags_json, difficulty, schema_ref, pack_id
         ) VALUES (?, ?, ?, ?, ?, ?, CAST(? AS JSON), CAST(? AS JSON), ?, ?, NULL)
         ON DUPLICATE KEY UPDATE id = id`,
        [
          q.id,
          q.version,
          q.title,
          q.prompt,
          q.starterQuery,
          q.solutionQuery ?? null,
          JSON.stringify(q.checks),
          JSON.stringify(q.tags),
          q.difficulty,
          q.schemaRef
        ]
      )
    }

    await conn.query(
      `INSERT INTO attempts (id, question_id, submitted_sql, passed, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [
        attempt.id,
        attempt.questionId,
        attempt.submittedSql,
        attempt.passed === null ? null : attempt.passed ? 1 : 0,
        mysqlDateTime(attempt.createdAt)
      ]
    )

    const mysqlStatus =
      progress.status === 'passed'
        ? 'passed'
        : progress.status === 'attempted'
          ? 'attempted'
          : 'unseen'

    await conn.query(
      `INSERT INTO progress (
         question_id, status, best_passed, attempt_count, last_attempt_at
       ) VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         status = VALUES(status),
         best_passed = VALUES(best_passed),
         attempt_count = VALUES(attempt_count),
         last_attempt_at = VALUES(last_attempt_at)`,
      [
        progress.questionId,
        mysqlStatus,
        progress.bestPassed ? 1 : 0,
        progress.attemptCount,
        progress.lastAttemptAt ? mysqlDateTime(progress.lastAttemptAt) : null
      ]
    )

    await conn.commit()
  } catch (err) {
    await conn.rollback()
    console.error('[portable-leetcode] failed to persist attempt/progress:', err)
  } finally {
    conn.release()
  }
}

function mysqlDateTime(iso: string): string {
  // MySQL DATETIME(3) accepts 'YYYY-MM-DD HH:MM:SS.mmm'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso.replace('T', ' ').replace('Z', '')
  return d.toISOString().slice(0, 23).replace('T', ' ')
}

async function hydrateFromMysql(conn: mysql.PoolConnection): Promise<void> {
  const [questionRows] = await conn.query<mysql.RowDataPacket[]>(
    `SELECT id, version, title, prompt, starter_query, solution_query,
            checks_json, tags_json, difficulty, schema_ref
     FROM questions`
  )
  const [assetRows] = await conn.query<mysql.RowDataPacket[]>(
    `SELECT schema_ref, sql_text FROM sql_assets`
  )
  const [packRows] = await conn.query<mysql.RowDataPacket[]>(
    `SELECT pack_id, version, title, imported_at FROM packs`
  )
  const [attemptRows] = await conn.query<mysql.RowDataPacket[]>(
    `SELECT id, question_id, submitted_sql, passed, created_at FROM attempts`
  )
  const [progressRows] = await conn.query<mysql.RowDataPacket[]>(
    `SELECT question_id, status, best_passed, attempt_count, last_attempt_at
     FROM progress`
  )

  const next = emptyBank()

  for (const row of questionRows) {
    next.questions[String(row.id)] = {
      id: String(row.id),
      version: Number(row.version),
      title: String(row.title),
      prompt: String(row.prompt),
      starterQuery: String(row.starter_query),
      solutionQuery: row.solution_query == null ? undefined : String(row.solution_query),
      checks: parseJson(row.checks_json, []),
      tags: parseJson(row.tags_json, []),
      difficulty: row.difficulty as SqlQuestion['difficulty'],
      schemaRef: String(row.schema_ref)
    }
  }

  for (const row of assetRows) {
    next.sqlAssets[String(row.schema_ref)] = String(row.sql_text)
  }

  for (const row of packRows) {
    const packId = String(row.pack_id)
    next.packs[packId] = {
      packId,
      version: String(row.version),
      title: String(row.title),
      importedAt: new Date(row.imported_at as string | Date).toISOString()
    }
  }

  for (const row of attemptRows) {
    next.attempts.push({
      id: String(row.id),
      questionId: String(row.question_id),
      submittedSql: String(row.submitted_sql),
      passed: row.passed == null ? null : Boolean(row.passed),
      createdAt: new Date(row.created_at as string | Date).toISOString()
    })
  }

  for (const row of progressRows) {
    const questionId = String(row.question_id)
    const bestPassed = Boolean(row.best_passed)
    const statusRaw = String(row.status)
    const status: QuestionProgressStatus = bestPassed
      ? 'passed'
      : statusRaw === 'attempted' || statusRaw === 'passed' || statusRaw === 'unseen'
        ? (statusRaw as QuestionProgressStatus)
        : 'unseen'
    next.progress[questionId] = {
      questionId,
      status: bestPassed ? 'passed' : status === 'passed' ? 'passed' : status,
      bestPassed,
      attemptCount: Number(row.attempt_count) || 0,
      lastAttemptAt:
        row.last_attempt_at == null
          ? null
          : new Date(row.last_attempt_at as string | Date).toISOString()
    }
  }

  // Prefer MySQL when it has data; otherwise keep JSON snapshot.
  // Merge progress/attempts from MySQL when questions come from JSON.
  if (Object.keys(next.questions).length > 0 || Object.keys(bank.questions).length === 0) {
    // Keep JSON progress if MySQL progress is empty but JSON had some.
    if (
      Object.keys(next.progress).length === 0 &&
      Object.keys(bank.progress).length > 0
    ) {
      next.progress = bank.progress
    }
    if (next.attempts.length === 0 && bank.attempts.length > 0) {
      next.attempts = bank.attempts
    }
    bank = next
  } else if (Object.keys(next.progress).length > 0) {
    bank = {
      ...bank,
      progress: { ...bank.progress, ...next.progress },
      attempts: next.attempts.length > 0 ? next.attempts : bank.attempts
    }
  }
}

function parseJson<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback
  if (typeof value === 'object') return value as T
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T
    } catch {
      return fallback
    }
  }
  return fallback
}
