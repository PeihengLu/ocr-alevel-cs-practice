import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { app } from 'electron'
import type { Database } from 'sql.js'
import { queryRows, run } from './sqlite'

const ADDED_COLUMNS: Record<string, Record<string, string>> = {
  questions: {
    effect_query: 'TEXT',
    statement: 'TEXT'
  }
}

/** Apply app schema SQL (idempotent CREATE TABLE IF NOT EXISTS). */
export function migrateAppSchema(db: Database): void {
  db.run('PRAGMA foreign_keys = ON')
  db.exec(readFileSync(resolveSchemaPath(), 'utf8'))
  for (const [table, columns] of Object.entries(ADDED_COLUMNS)) {
    for (const [column, definition] of Object.entries(columns)) {
      ensureColumn(db, table, column, definition)
    }
  }
}

function ensureColumn(
  db: Database,
  table: string,
  column: string,
  definition: string
): void {
  const rows = queryRows(db, `PRAGMA table_info(${table})`)
  if (rows.some((row) => String(row.name) === column)) return
  run(db, `ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
}

function resolveSchemaPath(): string {
  const candidates = [
    app.isPackaged ? join(process.resourcesPath, 'sql', '001_app_schema.sql') : '',
    join(process.cwd(), 'sql', '001_app_schema.sql'),
    join(__dirname, '../../../sql/001_app_schema.sql'),
    join(__dirname, '../../../../sql/001_app_schema.sql')
  ].filter(Boolean)

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate
  }
  throw new Error(`Could not find sql/001_app_schema.sql (tried: ${candidates.join(', ')})`)
}
