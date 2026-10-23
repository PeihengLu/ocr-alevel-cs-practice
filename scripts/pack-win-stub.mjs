#!/usr/bin/env node
/**
 * Legacy entry — Windows Student packaging is implemented.
 * Prefer: npm run dist:student:win
 */
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
console.log('Delegating to npm run pack:win:student …')
const r = spawnSync('npm', ['run', 'pack:win:student'], {
  cwd: root,
  stdio: 'inherit',
  shell: process.platform === 'win32'
})
process.exit(r.status ?? 1)
