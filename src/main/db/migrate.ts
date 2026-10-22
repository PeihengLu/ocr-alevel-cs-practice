import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Connection } from 'mysql2/promise'

/** Apply app schema SQL (idempotent CREATE TABLE IF NOT EXISTS). */
export async function migrateAppSchema(conn: Connection): Promise<void> {
  const schemaPath = resolveSchemaPath()
  const sql = await readFile(schemaPath, 'utf8')
  const statements = splitSqlStatements(sql)
  for (const statement of statements) {
    await conn.query(statement)
  }
}

function resolveSchemaPath(): string {
  const candidates = [
    join(process.cwd(), 'sql', '001_app_schema.sql'),
    join(__dirname, '../../../sql/001_app_schema.sql'),
    join(__dirname, '../../../../sql/001_app_schema.sql')
  ]
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate
  }
  throw new Error(
    `Could not find sql/001_app_schema.sql (tried: ${candidates.join(', ')})`
  )
}

function splitSqlStatements(sql: string): string[] {
  return sql
    .split(/;\s*\n/)
    .map((s) =>
      s
        .split('\n')
        .filter((line) => !line.trim().startsWith('--'))
        .join('\n')
        .trim()
    )
    .filter((s) => s.length > 0)
}
