import { join } from 'node:path'

export interface MysqlConfig {
  host: string
  port: number
  user: string
  password: string
  database: string
  /**
   * Data directory for a future bundled mysqld sidecar (next to the app when packaged).
   * Unused until portable binary bundling lands — kept so connection lifecycle is ready.
   */
  dataDir: string
  /** When true, prefer starting/stopping a bundled mysqld (packaged builds). */
  preferBundled: boolean
}

/**
 * Read MySQL settings from env.
 *
 * Dev: point at Homebrew / local mysqld (or optional Docker).
 * Packaged: same knobs will target the app-owned localhost port + dataDir for a
 * bundled portable MySQL/MariaDB sidecar (see README “Packaging / portable ship”).
 */
export function readMysqlConfig(userDataPath?: string): MysqlConfig {
  const defaultDataDir = userDataPath
    ? join(userDataPath, 'mysql-data')
    : join(process.cwd(), '.mysql-data')

  return {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'portable',
    password: process.env.MYSQL_PASSWORD || 'portable',
    database: process.env.MYSQL_DATABASE || 'portable_leetcode',
    dataDir: process.env.MYSQL_DATA_DIR || defaultDataDir,
    preferBundled:
      process.env.MYSQL_PREFER_BUNDLED === '1' ||
      process.env.MYSQL_PREFER_BUNDLED === 'true'
  }
}

export function isMysqlExplicitlyDisabled(): boolean {
  const flag = (process.env.PORTABLE_LEETCODE_STORAGE || '').toLowerCase()
  return flag === 'json' || process.env.MYSQL_DISABLED === '1'
}
