import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { app } from 'electron'
import type { MysqlConfig } from './config'
import { readMysqlConfig } from './config'

export interface PortableMysqlHandle {
  /** True when a process we started should be stopped on quit. */
  owned: boolean
  config: MysqlConfig
  /** Resolved path to mysqld binary if a bundled one was found. */
  binaryPath: string | null
}

let handle: PortableMysqlHandle | null = null

/**
 * Lifecycle hook for a future bundled mysqld/mariadbd beside the Electron app.
 *
 * This PR does **not** ship OS MySQL binaries. It only:
 * - Resolves config (localhost port + dataDir next to userData / app)
 * - Looks for a bundled binary under resources/mysql (packaged) or vendor/mysql (dev)
 * - Leaves start/stop as no-ops until packaging wires real spawn
 *
 * Dev machines may already run Homebrew MySQL on the same host/port — we connect
 * to whatever answers; we do not require brew at runtime.
 */
export async function ensureMysqlSidecar(): Promise<PortableMysqlHandle> {
  const config = readMysqlConfig(app.getPath('userData'))
  const binaryPath = resolveBundledMysqld()

  handle = {
    owned: false,
    config,
    binaryPath
  }

  if (config.preferBundled && binaryPath) {
    // Packaging slice: spawn mysqld --datadir=config.dataDir --port=config.port …
    console.info(
      '[portable-leetcode] bundled mysqld found at',
      binaryPath,
      '(start/stop not implemented yet — connect to existing server on',
      `${config.host}:${config.port}`
    )
  } else if (config.preferBundled && !binaryPath) {
    console.info(
      '[portable-leetcode] MYSQL_PREFER_BUNDLED set but no binary under resources/mysql or vendor/mysql — connecting to',
      `${config.host}:${config.port}`
    )
  }

  return handle
}

export async function stopMysqlSidecar(): Promise<void> {
  if (!handle?.owned) {
    handle = null
    return
  }
  // Packaging slice: signal the child mysqld we started.
  console.info('[portable-leetcode] stopMysqlSidecar: owned process stop not implemented yet')
  handle = null
}

export function getPortableMysqlHandle(): PortableMysqlHandle | null {
  return handle
}

function resolveBundledMysqld(): string | null {
  const candidates: string[] = []

  if (app.isPackaged) {
    candidates.push(
      join(process.resourcesPath, 'mysql', process.platform === 'win32' ? 'mysqld.exe' : 'mysqld'),
      join(process.resourcesPath, 'mariadb', process.platform === 'win32' ? 'mariadbd.exe' : 'mariadbd')
    )
  }

  candidates.push(
    join(process.cwd(), 'vendor', 'mysql', process.platform === 'win32' ? 'mysqld.exe' : 'mysqld'),
    join(process.cwd(), 'vendor', 'mariadb', process.platform === 'win32' ? 'mariadbd.exe' : 'mariadbd')
  )

  for (const path of candidates) {
    if (existsSync(path)) return path
  }
  return null
}
