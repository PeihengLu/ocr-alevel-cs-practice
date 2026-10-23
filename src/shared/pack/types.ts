/**
 * PortableLeetcode pack format (.plpack = zip).
 *
 * Layout inside the zip:
 *   manifest.json
 *   questions/<id>.json
 *   sql/<schemaRef>.sql
 *
 * Merge rules (import):
 * - Questions keyed by stable `id`
 * - Higher `version` wins; equal version keeps the existing record
 * - `manifest.retiredIds` removes those IDs from the local bank
 */

export const PACK_FORMAT_VERSION = 1 as const
export const PACK_EXTENSION = '.plpack'

export interface PackManifest {
  formatVersion: typeof PACK_FORMAT_VERSION
  packId: string
  /** Pack release version (semver string for humans / ordering). */
  version: string
  title: string
  description?: string
  createdAt: string
  minAppVersion: string
  /** Display / iteration order of questions in this pack. */
  questionIds: string[]
  /** IDs to remove from the local bank when this pack is imported. */
  retiredIds?: string[]
  /** Optional SHA-256 hex of canonical payload (excluding this field). */
  checksum?: string
}

/** How a student submission is checked. */
export type SqlCheck =
  | {
      type: 'result_set'
      /** Rows as objects; column *names* matched case-insensitively. */
      expected: Record<string, unknown>[]
      /**
       * When true, row order must match (use for ORDER BY exercises).
       * Default false — multiset compare, order ignored.
       */
      ordered?: boolean
    }
  | {
      type: 'row_count'
      expected: number
    }
  | {
      type: 'columns'
      /** Expected column names (order matters). */
      expected: string[]
    }

export interface QueryResultGrid {
  columns: string[]
  rows: Record<string, unknown>[]
}

export interface CheckOutcome {
  index: number
  type: SqlCheck['type']
  passed: boolean
  detail: string
}

export type QueryRunResult =
  | {
      ok: true
      passed: boolean
      message: string
      questionId: string
      sql: string
      result: QueryResultGrid
      checks: CheckOutcome[]
    }
  | {
      ok: false
      passed: false
      message: string
      questionId: string
      sql: string
      result?: QueryResultGrid
      checks?: CheckOutcome[]
    }

export interface SqlQuestion {
  id: string
  /** Monotonic per-question version; higher wins on merge. */
  version: number
  title: string
  prompt: string
  starterQuery: string
  solutionQuery?: string
  checks: SqlCheck[]
  tags: string[]
  difficulty: 'easy' | 'medium' | 'hard'
  /** Key into `sqlAssets` (filename stem under sql/). */
  schemaRef: string
}

export interface PackPayload {
  manifest: PackManifest
  questions: SqlQuestion[]
  /** Map of schemaRef → SQL text (CREATE + seed). */
  sqlAssets: Record<string, string>
}

export type PackImportResult =
  | {
      ok: true
      pack: PackPayload
      merged: number
      skipped: number
      retired: number
      storage: StorageBackend
    }
  | { ok: false; error: string }

export type PackExportResult =
  | { ok: true; path: string }
  | { ok: false; error: string; cancelled?: boolean }

export type StorageBackend = 'mysql' | 'json'

export interface StorageStatus {
  backend: StorageBackend
  mysqlConfigured: boolean
  mysqlConnected: boolean
  message: string
  questionCount: number
}

export interface AttemptRecord {
  id: string
  questionId: string
  submittedSql: string
  passed: boolean | null
  createdAt: string
}

/** Per-question practice status (best-effort: once passed, stays passed). */
export type QuestionProgressStatus = 'unseen' | 'attempted' | 'passed'

export interface ProgressRecord {
  questionId: string
  status: QuestionProgressStatus
  bestPassed: boolean
  attemptCount: number
  lastAttemptAt: string | null
}

export interface QuestionSummary {
  question: SqlQuestion
  progress: ProgressRecord
}

export interface BankSnapshot {
  questions: Record<string, SqlQuestion>
  packs: Record<
    string,
    {
      packId: string
      version: string
      title: string
      importedAt: string
    }
  >
  attempts: AttemptRecord[]
  /** Best status per question id. */
  progress: Record<string, ProgressRecord>
  sqlAssets: Record<string, string>
}
