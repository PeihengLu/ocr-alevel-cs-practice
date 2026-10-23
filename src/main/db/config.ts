import { join } from 'node:path'
import { app } from 'electron'

export interface MysqlConfig {
  host: string
  port: number
  user: string
  password: string
  database: string
  /** Data directory for bundled mysqld (userData/mysql-data by default). */
  dataDir: string
  /** When true, start/stop a bundled mysqld if binary is present. */
  preferBundled: boolean
}

/** Default port for the app-owned bundled server (avoids clashing with system MySQL on 3306). */
export const BUNDLED_MYSQL_PORT = 13306

/**
 * Read MySQL settings.
 *
 * Packaged builds default to bundled mysqld on localhost:13306.
 * Dev builds default to Homebrew/local on 3306 unless MYSQL_PREFER_BUNDLED=1.
 */
export function readMysqlConfig(userDataPath?: string): MysqlConfig {
  const packaged = typeof app !== 'undefined' && app.isPackaged
  const dataRoot = userDataPath ?? (packaged ? app.getPath('userData') : process.cwd())
  const preferBundled =
    process.env.MYSQL_PREFER_BUNDLED === '1' ||
    process.env.MYSQL_PREFER_BUNDLED === 'true' ||
    (packaged && process.env.MYSQL_PREFER_BUNDLED !== '0')

  const defaultPort = preferBundled ? BUNDLED_MYSQL_PORT : 3306

  return {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || defaultPort),
    user: process.env.MYSQL_USER || 'portable',
    password: process.env.MYSQL_PASSWORD || 'portable',
    database: process.env.MYSQL_DATABASE || 'portable_leetcode',
    dataDir: process.env.MYSQL_DATA_DIR || join(dataRoot, 'mysql-data'),
    preferBundled
  }
}

export function isMysqlExplicitlyDisabled(): boolean {
  const flag = (process.env.PORTABLE_LEETCODE_STORAGE || '').toLowerCase()
  return flag === 'json' || process.env.MYSQL_DISABLED === '1'
}
