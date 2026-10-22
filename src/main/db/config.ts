export interface MysqlConfig {
  host: string
  port: number
  user: string
  password: string
  database: string
}

/** Read MySQL settings from env (local MySQL or Docker). */
export function readMysqlConfig(): MysqlConfig {
  return {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'portable',
    password: process.env.MYSQL_PASSWORD || 'portable',
    database: process.env.MYSQL_DATABASE || 'portable_leetcode'
  }
}

export function isMysqlExplicitlyDisabled(): boolean {
  const flag = (process.env.PORTABLE_LEETCODE_STORAGE || '').toLowerCase()
  return flag === 'json' || process.env.MYSQL_DISABLED === '1'
}
