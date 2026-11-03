import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import initSqlJs, { type Database, type SqlValue } from 'sql.js'

type SqlEngine = Awaited<ReturnType<typeof initSqlJs>>

let engine: SqlEngine | null = null
let appDb: Database | null = null
let appPath: string | null = null

export async function initSqlEngine(wasmPath: string): Promise<void> {
  if (engine) return
  if (!existsSync(wasmPath)) {
    throw new Error(`SQLite wasm not found at ${wasmPath}`)
  }
  const wasmBinary = readFileSync(wasmPath)
  engine = await initSqlJs({ wasmBinary })
}

export function sqlEngineReady(): boolean {
  return engine != null
}

function requireEngine(): SqlEngine {
  if (!engine) throw new Error('SQLite is not loaded.')
  return engine
}

export function openMemoryDatabase(): Database {
  const db = new (requireEngine().Database)()
  db.run('PRAGMA foreign_keys = ON')
  return db
}

export function openFileDatabase(filePath: string): Database {
  const SQL = requireEngine()
  const db = existsSync(filePath)
    ? new SQL.Database(readFileSync(filePath))
    : new SQL.Database()
  db.run('PRAGMA foreign_keys = ON')
  return db
}

export function attachAppDatabase(db: Database, filePath: string): void {
  if (appDb && appDb !== db) appDb.close()
  appDb = db
  appPath = filePath
}

export function getAppDatabase(): Database | null {
  return appDb
}

export function saveDatabase(db: Database, filePath: string): void {
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, Buffer.from(db.export()))
}

export function saveAppDatabase(): void {
  if (!appDb || !appPath) return
  saveDatabase(appDb, appPath)
}

export function closeAppDatabase(): void {
  if (appDb && appPath) saveDatabase(appDb, appPath)
  appDb?.close()
  appDb = null
  appPath = null
}

export function execScript(db: Database, sql: string): void {
  const trimmed = sql.trim()
  if (!trimmed) throw new Error('Query is empty.')
  db.exec(trimmed)
}

export function queryRows(
  db: Database,
  sql: string,
  params: SqlValue[] = []
): Record<string, SqlValue>[] {
  const stmt = db.prepare(sql)
  try {
    if (params.length > 0) stmt.bind(params)
    const rows: Record<string, SqlValue>[] = []
    while (stmt.step()) rows.push(stmt.getAsObject())
    return rows
  } finally {
    stmt.free()
  }
}

export function run(db: Database, sql: string, params: SqlValue[] = []): void {
  db.run(sql, params)
}

export function transaction(db: Database, work: () => void): void {
  db.run('BEGIN')
  try {
    work()
    db.run('COMMIT')
  } catch (err) {
    try {
      db.run('ROLLBACK')
    } catch {
      // The transaction may already be closed.
    }
    throw err
  }
}

/** Column names match what a student sees: `students.name` becomes `name`. */
export function queryGrid(
  db: Database,
  sql: string
): { columns: string[]; rows: Record<string, unknown>[] } {
  const results = db.exec(sql)
  if (results.length === 0) return { columns: [], rows: [] }
  const last = results[results.length - 1]
  const columns = last.columns.map(bareColumn)
  const rows = last.values.map((values) => {
    const row: Record<string, unknown> = {}
    columns.forEach((column, index) => {
      const value = values[index]
      row[column] = value === undefined ? null : value
    })
    return row
  })
  return { columns, rows }
}

function bareColumn(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot === -1 ? name : name.slice(dot + 1)
}
