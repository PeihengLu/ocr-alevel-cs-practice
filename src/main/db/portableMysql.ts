import { spawn, type ChildProcess, execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { app } from 'electron'
import mysql from 'mysql2/promise'
import type { MysqlConfig } from './config'
import { readMysqlConfig } from './config'

const execFileAsync = promisify(execFile)

export interface PortableMysqlHandle {
  owned: boolean
  config: MysqlConfig
  binaryPath: string | null
  baseDir: string | null
}

let handle: PortableMysqlHandle | null = null
let child: ChildProcess | null = null
let stopping = false

/**
 * Ensure a MySQL server is available.
 * Packaged builds: start bundled mysqld (resources/mysql) if present.
 * Dev: connect to existing local MySQL unless a vendor/mysql tree + preferBundled.
 */
export async function ensureMysqlSidecar(): Promise<PortableMysqlHandle> {
  const config = readMysqlConfig(app.getPath('userData'))
  const resolved = resolveBundledMysql()

  handle = {
    owned: false,
    config,
    binaryPath: resolved?.mysqld ?? null,
    baseDir: resolved?.baseDir ?? null
  }

  if (!config.preferBundled || !resolved) {
    if (app.isPackaged) {
      console.warn(
        '[portable-leetcode] packaged build has no bundled mysqld under resources/mysql — ' +
          `will try ${config.host}:${config.port} (may fail offline)`
      )
    }
    return handle
  }

  await mkdir(config.dataDir, { recursive: true })
  const socketPath = socketFor(config)
  const pidPath = join(config.dataDir, 'mysqld.pid')
  const errorLog = join(config.dataDir, 'mysqld.err')

  const needsInit = !existsSync(join(config.dataDir, 'mysql'))
  if (needsInit) {
    console.info('[portable-leetcode] initializing bundled MySQL datadir at', config.dataDir)
    await execFileAsync(
      resolved.mysqld,
      [
        '--initialize-insecure',
        `--basedir=${resolved.baseDir}`,
        `--datadir=${config.dataDir}`,
        `--lc-messages-dir=${join(resolved.baseDir, 'share', 'mysql')}`
      ],
      { env: process.env }
    )
  }

  console.info(
    `[portable-leetcode] starting bundled mysqld on ${config.host}:${config.port}`
  )

  const proc = spawn(
    resolved.mysqld,
    [
      `--basedir=${resolved.baseDir}`,
      `--datadir=${config.dataDir}`,
      `--port=${config.port}`,
      `--socket=${socketPath}`,
      `--pid-file=${pidPath}`,
      `--lc-messages-dir=${join(resolved.baseDir, 'share', 'mysql')}`,
      '--bind-address=127.0.0.1',
      '--mysqlx=0',
      '--skip-grant-tables=0',
      `--log-error=${errorLog}`
    ],
    {
      env: process.env,
      detached: false,
      stdio: ['ignore', 'pipe', 'pipe']
    }
  )
  child = proc

  proc.stdout?.on('data', (buf: Buffer) => {
    console.info('[mysqld]', String(buf).trimEnd())
  })
  proc.stderr?.on('data', (buf: Buffer) => {
    console.info('[mysqld]', String(buf).trimEnd())
  })
  proc.on('exit', (code, signal) => {
    console.info(`[mysqld] exited code=${code} signal=${signal}`)
    if (handle) handle.owned = false
    child = null
  })

  handle.owned = true
  await waitForMysql(config, socketPath, 40000)
  await bootstrapAppDatabases(config)
  await writeFile(
    join(config.dataDir, 'portable-leetcode-mysql.json'),
    JSON.stringify(
      {
        port: config.port,
        socket: socketPath,
        startedAt: new Date().toISOString()
      },
      null,
      2
    )
  )

  return handle
}

export async function stopMysqlSidecar(): Promise<void> {
  if (stopping) return
  stopping = true
  try {
    if (!handle?.owned || !handle.binaryPath || !handle.baseDir) {
      handle = null
      child = null
      return
    }

    const mysqladmin = join(handle.baseDir, 'bin', 'mysqladmin')
    const socketPath = socketFor(handle.config)
    console.info('[portable-leetcode] stopping bundled mysqld…')
    try {
      if (existsSync(mysqladmin)) {
        await execFileAsync(
          mysqladmin,
          [
            '-u',
            'root',
            `--socket=${socketPath}`,
            `--port=${handle.config.port}`,
            'shutdown'
          ],
          { timeout: 15000 }
        )
      }
    } catch (err) {
      console.warn(
        '[portable-leetcode] mysqladmin shutdown failed, killing process',
        err instanceof Error ? err.message : err
      )
      child?.kill('SIGTERM')
    }

    const deadline = Date.now() + 10000
    while (child && Date.now() < deadline) {
      await sleep(200)
    }
    if (child) {
      child.kill('SIGKILL')
    }
  } finally {
    child = null
    handle = null
    stopping = false
  }
}

export function getPortableMysqlHandle(): PortableMysqlHandle | null {
  return handle
}

function resolveBundledMysql(): { mysqld: string; baseDir: string } | null {
  const candidates: string[] = []

  if (app.isPackaged) {
    candidates.push(join(process.resourcesPath, 'mysql'))
  }
  candidates.push(join(process.cwd(), 'vendor', 'mysql'))

  for (const baseDir of candidates) {
    const mysqld = join(
      baseDir,
      'bin',
      process.platform === 'win32' ? 'mysqld.exe' : 'mysqld'
    )
    if (existsSync(mysqld)) {
      return { mysqld, baseDir }
    }
  }
  return null
}

function socketFor(config: MysqlConfig): string {
  return join(config.dataDir, 'mysql.sock')
}

async function waitForMysql(
  config: MysqlConfig,
  socketPath: string,
  timeoutMs: number
): Promise<void> {
  const start = Date.now()
  let lastErr: unknown
  while (Date.now() - start < timeoutMs) {
    try {
      const conn = await mysql.createConnection({
        host: config.host,
        port: config.port,
        user: 'root',
        password: '',
        socketPath: existsSync(socketPath) ? socketPath : undefined,
        connectTimeout: 2000
      })
      await conn.query('SELECT 1')
      await conn.end()
      return
    } catch (err) {
      lastErr = err
      await sleep(400)
    }
  }
  throw new Error(
    `Bundled mysqld did not become ready within ${timeoutMs}ms (${lastErr instanceof Error ? lastErr.message : String(lastErr)})`
  )
}

async function bootstrapAppDatabases(config: MysqlConfig): Promise<void> {
  const socketPath = socketFor(config)
  const user = sqlIdent(config.user)
  const pass = sqlString(config.password)
  const db = sqlIdent(config.database)

  const conn = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: 'root',
    password: '',
    socketPath: existsSync(socketPath) ? socketPath : undefined,
    multipleStatements: true
  })
  try {
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${db}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS pl_exercise CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    await conn.query(
      `CREATE USER IF NOT EXISTS '${user}'@'localhost' IDENTIFIED BY '${pass}'`
    )
    await conn.query(
      `CREATE USER IF NOT EXISTS '${user}'@'127.0.0.1' IDENTIFIED BY '${pass}'`
    )
    await conn.query(
      `GRANT ALL PRIVILEGES ON \`${db}\`.* TO '${user}'@'localhost'`
    )
    await conn.query(
      `GRANT ALL PRIVILEGES ON \`${db}\`.* TO '${user}'@'127.0.0.1'`
    )
    await conn.query(
      `GRANT ALL PRIVILEGES ON pl_exercise.* TO '${user}'@'localhost'`
    )
    await conn.query(
      `GRANT ALL PRIVILEGES ON pl_exercise.* TO '${user}'@'127.0.0.1'`
    )
    await conn.query('FLUSH PRIVILEGES')
  } finally {
    await conn.end()
  }
}

function sqlIdent(value: string): string {
  if (!/^[A-Za-z0-9_]+$/.test(value)) {
    throw new Error(`Unsafe SQL identifier: ${value}`)
  }
  return value
}

function sqlString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
