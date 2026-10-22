/// <reference types="vite/client" />

type Edition = 'student' | 'teacher'

interface ImportMetaEnv {
  readonly VITE_EDITION: Edition
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface SqlCheckResultSet {
  type: 'result_set'
  expected: Record<string, unknown>[]
}

interface SqlCheckRowCount {
  type: 'row_count'
  expected: number
}

interface SqlCheckColumns {
  type: 'columns'
  expected: string[]
}

type SqlCheck = SqlCheckResultSet | SqlCheckRowCount | SqlCheckColumns

interface SqlQuestion {
  id: string
  version: number
  title: string
  prompt: string
  starterQuery: string
  solutionQuery?: string
  checks: SqlCheck[]
  tags: string[]
  difficulty: 'easy' | 'medium' | 'hard'
  schemaRef: string
}

interface PackManifest {
  formatVersion: 1
  packId: string
  version: string
  title: string
  description?: string
  createdAt: string
  minAppVersion: string
  questionIds: string[]
  retiredIds?: string[]
  checksum?: string
}

interface PackPayload {
  manifest: PackManifest
  questions: SqlQuestion[]
  sqlAssets: Record<string, string>
}

type PackImportResult =
  | {
      ok: true
      pack: PackPayload
      merged: number
      skipped: number
      retired: number
      storage: 'mysql' | 'json'
    }
  | { ok: false; error: string }

type PackExportResult =
  | { ok: true; path: string }
  | { ok: false; error: string; cancelled?: boolean }

interface StorageStatus {
  backend: 'mysql' | 'json'
  mysqlConfigured: boolean
  mysqlConnected: boolean
  message: string
  questionCount: number
}

interface PortableLeetcodeBridge {
  platform: NodeJS.Platform
  editions: readonly Edition[]
  getStorageStatus(): Promise<StorageStatus>
  listQuestions(): Promise<SqlQuestion[]>
  getQuestion(id: string): Promise<SqlQuestion | null>
  getSqlAsset(schemaRef: string): Promise<string | null>
  upsertQuestion(
    question: SqlQuestion,
    sqlAsset?: string
  ): Promise<{ ok: true } | { ok: false; error: string }>
  importPack(): Promise<PackImportResult>
  importPackPath(filePath: string): Promise<PackImportResult>
  exportPack(args: {
    meta: {
      packId: string
      version: string
      title: string
      description?: string
      retiredIds?: string[]
    }
    questionIds: string[]
  }): Promise<PackExportResult>
  exportPackPayload(payload: PackPayload): Promise<PackExportResult>
  runQuery(
    questionId: string,
    sql: string
  ): Promise<{
    ok: boolean
    stub: true
    message: string
    questionId: string
    sql: string
  }>
}

interface Window {
  portableLeetcode: PortableLeetcodeBridge
}
