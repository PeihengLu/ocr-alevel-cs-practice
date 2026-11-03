import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { app } from 'electron'

export function sqliteWasmPath(): string {
  const candidates = [
    app.isPackaged ? join(process.resourcesPath, 'sqlite', 'sql-wasm.wasm') : '',
    join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm'),
    join(__dirname, '../../node_modules/sql.js/dist/sql-wasm.wasm')
  ].filter(Boolean)

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate
  }
  return candidates[0] ?? join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm')
}

export function sqliteFilePath(): string {
  return join(app.getPath('userData'), 'portable-leetcode.sqlite')
}

export function isJsonStorageForced(): boolean {
  const flag = (process.env.PORTABLE_LEETCODE_STORAGE || '').toLowerCase()
  return flag === 'json' || process.env.MYSQL_DISABLED === '1'
}
