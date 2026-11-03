import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import { app } from 'electron'
import type { Database, SqlValue } from 'sql.js'
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
  SqlWriteStatement,
  StorageBackend,
  StorageStatus
} from '../../shared/pack/types'
import { readSqlCatalog } from '../content/readSqlCatalog'
import { migrateAppSchema } from '../db/migrate'
import { isJsonStorageForced, sqliteFilePath, sqliteWasmPath } from '../db/paths'
import {
  attachAppDatabase,
  closeAppDatabase,
  getAppDatabase,
  initSqlEngine,
  openFileDatabase,
  queryRows,
  run,
  saveAppDatabase,
  sqlEngineReady,
  transaction
} from '../db/sqlite'
import { loadJsonBank, saveJsonBank } from './jsonBank'

let backend: StorageBackend = 'json'
let bank: BankSnapshot = emptyBank()
let statusMessage = 'Using local JSON bank.'
let sqliteReady = false

function jsonBankPath(): string {
  return join(app.getPath('userData'), 'question-bank.json')
}

export async function initBank(): Promise<StorageStatus> {
  bank = await loadJsonBank(jsonBankPath())

  try {
    await initSqlEngine(sqliteWasmPath())
    sqliteReady = true
  } catch (err) {
    sqliteReady = false
    backend = 'json'
    statusMessage = `SQLite failed to load (${err instanceof Error ? err.message : String(err)}). Using JSON bank at ${jsonBankPath()}.`
  }

  if (sqliteReady && isJsonStorageForced()) {
    backend = 'json'
    statusMessage = 'JSON bank forced via PORTABLE_LEETCODE_STORAGE=json.'
  } else if (sqliteReady) {
    const filePath = sqliteFilePath()
    try {
      const db = openFileDatabase(filePath)
      attachAppDatabase(db, filePath)
      migrateAppSchema(db)
      hydrateFromSqlite(db)
      backend = 'sqlite'
      statusMessage = `SQLite database at ${filePath}.`
      await saveJsonBank(jsonBankPath(), bank)
      saveAppDatabase()
    } catch (err) {
      closeAppDatabase()
      backend = 'json'
      statusMessage = `SQLite unavailable (${err instanceof Error ? err.message : String(err)}). Using JSON bank at ${jsonBankPath()}.`
    }
  }

  await installBuiltinSql()
  return getStorageStatus()
}

/** Merge the SQL questions that ship with this build. Progress stays on each question id. */
async function installBuiltinSql(): Promise<void> {
  const root = app.isPackaged
    ? join(process.resourcesPath, 'samples', 'sql-basics')
    : join(process.cwd(), 'samples', 'sql-basics')
  try {
    const pack = await readSqlCatalog(root)
    const { bank: next, stats } = mergePackIntoBank(bank, pack)
    bank = next
    await persist(pack)
    console.info(
      `[portable-leetcode] SQL catalog: ${stats.merged} updated, ${stats.skipped} unchanged, ${stats.retired} retired`
    )
  } catch (err) {
    console.error(
      `[portable-leetcode] SQL catalog failed (${root}):`,
      err instanceof Error ? err.message : err
    )
  }
}

export function getStorageStatus(): StorageStatus {
  return {
    backend,
    sqliteReady,
    message: statusMessage,
    questionCount: Object.keys(bank.questions).length
  }
}

export function isSqliteReady(): boolean {
  return sqliteReady && sqlEngineReady()
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
  const status: QuestionProgressStatus = bestPassed ? 'passed' : 'attempted'
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

async function persist(importedPack?: PackPayload): Promise<void> {
  await saveJsonBank(jsonBankPath(), bank)
  const db = backend === 'sqlite' ? getAppDatabase() : null
  if (!db) return

  const now = new Date().toISOString()
  transaction(db, () => {
    if (importedPack) {
      run(
        db,
        `INSERT INTO packs (pack_id, version, title, description, imported_at, manifest_json)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(pack_id) DO UPDATE SET
           version = excluded.version,
           title = excluded.title,
           description = excluded.description,
           imported_at = excluded.imported_at,
           manifest_json = excluded.manifest_json`,
        [
          importedPack.manifest.packId,
          importedPack.manifest.version,
          importedPack.manifest.title,
          importedPack.manifest.description ?? null,
          now,
          JSON.stringify(importedPack.manifest)
        ]
      )
    }

    for (const [ref, sql] of Object.entries(bank.sqlAssets)) {
      run(
        db,
        `INSERT INTO sql_assets (schema_ref, sql_text, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(schema_ref) DO UPDATE SET
           sql_text = excluded.sql_text,
           updated_at = excluded.updated_at`,
        [ref, sql, now]
      )
    }

    const packId = importedPack?.manifest.packId ?? null
    for (const question of Object.values(bank.questions)) {
      upsertQuestion(db, question, packId, now)
    }

    if (importedPack?.manifest.retiredIds?.length) {
      for (const id of importedPack.manifest.retiredIds) {
        run(db, 'DELETE FROM questions WHERE id = ?', [id])
        run(db, 'DELETE FROM progress WHERE question_id = ?', [id])
      }
    }
  })
  saveAppDatabase()
}

/** Persist a single attempt + best progress (JSON always; SQLite when it is the bank). */
async function persistAttemptAndProgress(
  attempt: AttemptRecord,
  progress: ProgressRecord
): Promise<void> {
  await saveJsonBank(jsonBankPath(), bank)
  const db = backend === 'sqlite' ? getAppDatabase() : null
  if (!db) return

  try {
    transaction(db, () => {
      const question = bank.questions[attempt.questionId]
      if (question) ensureQuestionRow(db, question)
      run(
        db,
        `INSERT INTO attempts (id, question_id, submitted_sql, passed, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [
          attempt.id,
          attempt.questionId,
          attempt.submittedSql,
          attempt.passed === null ? null : attempt.passed ? 1 : 0,
          attempt.createdAt
        ]
      )
      run(
        db,
        `INSERT INTO progress (question_id, status, best_passed, attempt_count, last_attempt_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(question_id) DO UPDATE SET
           status = excluded.status,
           best_passed = excluded.best_passed,
           attempt_count = excluded.attempt_count,
           last_attempt_at = excluded.last_attempt_at`,
        [
          progress.questionId,
          progress.status,
          progress.bestPassed ? 1 : 0,
          progress.attemptCount,
          progress.lastAttemptAt
        ]
      )
    })
    saveAppDatabase()
  } catch (err) {
    console.error('[portable-leetcode] failed to persist attempt/progress:', err)
  }
}

function upsertQuestion(
  db: Database,
  question: SqlQuestion,
  packId: string | null,
  now: string
): void {
  if (packId) {
    run(
      db,
      `INSERT INTO questions (
         id, version, title, prompt, starter_query, solution_query,
         effect_query, statement, checks_json, tags_json, difficulty, schema_ref, pack_id, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         version = excluded.version,
         title = excluded.title,
         prompt = excluded.prompt,
         starter_query = excluded.starter_query,
         solution_query = excluded.solution_query,
         effect_query = excluded.effect_query,
         statement = excluded.statement,
         checks_json = excluded.checks_json,
         tags_json = excluded.tags_json,
         difficulty = excluded.difficulty,
         schema_ref = excluded.schema_ref,
         pack_id = excluded.pack_id,
         updated_at = excluded.updated_at`,
      questionParams(question, packId, now)
    )
    return
  }

  run(
    db,
    `INSERT INTO questions (
       id, version, title, prompt, starter_query, solution_query,
       effect_query, statement, checks_json, tags_json, difficulty, schema_ref, pack_id, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)
     ON CONFLICT(id) DO UPDATE SET
       version = excluded.version,
       title = excluded.title,
       prompt = excluded.prompt,
       starter_query = excluded.starter_query,
       solution_query = excluded.solution_query,
       effect_query = excluded.effect_query,
       statement = excluded.statement,
       checks_json = excluded.checks_json,
       tags_json = excluded.tags_json,
       difficulty = excluded.difficulty,
       schema_ref = excluded.schema_ref,
       updated_at = excluded.updated_at`,
    questionParams(question, null, now).filter((_, index) => index !== 12)
  )
}

function ensureQuestionRow(db: Database, question: SqlQuestion): void {
  run(
    db,
    `INSERT INTO questions (
       id, version, title, prompt, starter_query, solution_query,
       effect_query, statement, checks_json, tags_json, difficulty, schema_ref, pack_id, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)
     ON CONFLICT(id) DO NOTHING`,
    questionParams(question, null, new Date().toISOString()).filter((_, index) => index !== 12)
  )
}

function questionParams(
  question: SqlQuestion,
  packId: string | null,
  now: string
): SqlValue[] {
  return [
    question.id,
    question.version,
    question.title,
    question.prompt,
    question.starterQuery,
    question.solutionQuery ?? null,
    question.effectQuery ?? null,
    question.statement ?? null,
    JSON.stringify(question.checks),
    JSON.stringify(question.tags),
    question.difficulty,
    question.schemaRef,
    packId,
    now
  ]
}

function hydrateFromSqlite(db: Database): void {
  const questionRows = queryRows(
    db,
    `SELECT id, version, title, prompt, starter_query, solution_query,
            effect_query, statement, checks_json, tags_json, difficulty, schema_ref
     FROM questions`
  )
  const assetRows = queryRows(db, `SELECT schema_ref, sql_text FROM sql_assets`)
  const packRows = queryRows(db, `SELECT pack_id, version, title, imported_at FROM packs`)
  const attemptRows = queryRows(
    db,
    `SELECT id, question_id, submitted_sql, passed, created_at FROM attempts`
  )
  const progressRows = queryRows(
    db,
    `SELECT question_id, status, best_passed, attempt_count, last_attempt_at FROM progress`
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
      effectQuery:
        row.effect_query == null || String(row.effect_query).trim() === ''
          ? undefined
          : String(row.effect_query),
      statement: parseWriteStatement(row.statement),
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
      importedAt: String(row.imported_at)
    }
  }

  for (const row of attemptRows) {
    next.attempts.push({
      id: String(row.id),
      questionId: String(row.question_id),
      submittedSql: String(row.submitted_sql),
      passed: row.passed == null ? null : Number(row.passed) === 1,
      createdAt: String(row.created_at)
    })
  }

  for (const row of progressRows) {
    const questionId = String(row.question_id)
    const bestPassed = Number(row.best_passed) === 1
    const statusRaw = String(row.status)
    const status: QuestionProgressStatus =
      statusRaw === 'attempted' || statusRaw === 'passed' || statusRaw === 'unseen'
        ? statusRaw
        : 'unseen'
    next.progress[questionId] = {
      questionId,
      status: bestPassed ? 'passed' : status,
      bestPassed,
      attemptCount: Number(row.attempt_count) || 0,
      lastAttemptAt: row.last_attempt_at == null ? null : String(row.last_attempt_at)
    }
  }

  if (Object.keys(next.questions).length > 0 || Object.keys(bank.questions).length === 0) {
    if (Object.keys(next.progress).length === 0 && Object.keys(bank.progress).length > 0) {
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

function parseWriteStatement(value: unknown): SqlWriteStatement | undefined {
  if (value === 'insert' || value === 'delete' || value === 'drop') return value
  return undefined
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
