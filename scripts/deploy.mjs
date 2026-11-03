#!/usr/bin/env node
/**
 * Build the Mac app and the Windows app in one go, then zip both into release/deploy.
 *
 *   npm run deploy
 *
 * SQL runs in bundled SQLite, so neither platform needs a database server.
 * The portable Windows .exe needs Wine when this runs on a Mac; the unpacked folder is
 * always produced and zipped.
 */
import { spawnSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync
} from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const version = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version
const isMac = process.platform === 'darwin'
const deployDir = join(root, 'release', 'deploy')
const builder = join(
  root,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'electron-builder.cmd' : 'electron-builder'
)

function run(command, args, cwd = root) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  })
  if ((result.status ?? 1) !== 0) {
    console.error(`\n${command} ${args.join(' ')} exited ${result.status ?? 1}`)
    process.exit(result.status ?? 1)
  }
}

function tryRun(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  })
  return (result.status ?? 1) === 0
}

function findDirs(dir, suffix, depth = 0) {
  if (!existsSync(dir) || depth > 3) return []
  const found = []
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    let info
    try {
      info = statSync(path)
    } catch {
      continue
    }
    if (info.isDirectory() && name.endsWith(suffix)) found.push(path)
    else if (info.isDirectory() && !name.endsWith('.app')) {
      found.push(...findDirs(path, suffix, depth + 1))
    }
  }
  return found
}

function zipKeepingParent(source, destination) {
  if (isMac) {
    run('ditto', ['-c', '-k', '--keepParent', source, destination])
    return
  }
  run('zip', ['-r', '-q', destination, source.split(/[/\\]/).pop()], dirname(source))
}

console.log(`Deploying PortableLeetcode ${version}`)

run('npm', ['run', 'sample:pack'])
run('npm', ['run', 'build'])

if (isMac) {
  console.log('\nPacking macOS…')
  run(builder, ['--mac', 'dir', '--config.directories.output=release/mac'])
} else {
  console.log('\nSkipping the Mac app (build that on a Mac).')
}

console.log('\nPacking Windows…')
const winOutput = ['--config.directories.output=release/win']
const portableOk = tryRun(builder, ['--win', 'dir', 'portable', '--x64', ...winOutput])
if (!portableOk) {
  console.log('\nThe portable .exe was not produced. Packing the Windows folder instead.')
  rmSync(join(root, 'release', 'win'), { recursive: true, force: true })
  run(builder, ['--win', 'dir', '--x64', ...winOutput])
}

rmSync(deployDir, { recursive: true, force: true })
mkdirSync(deployDir, { recursive: true })

const made = []

if (isMac) {
  const apps = findDirs(join(root, 'release', 'mac'), '.app')
  if (apps.length === 0) {
    console.error('Mac build finished without a .app under release/mac.')
    process.exit(1)
  }
  const appPath = apps[0]
  const arch = appPath.includes('arm64') ? 'arm64' : appPath.includes('x64') ? 'x64' : process.arch
  const zipPath = join(deployDir, `PortableLeetcode-${version}-mac-${arch}.zip`)
  zipKeepingParent(appPath, zipPath)
  made.push(zipPath)
}

const winUnpacked = join(root, 'release', 'win', 'win-unpacked')
if (!existsSync(winUnpacked)) {
  console.error('Windows build finished without release/win/win-unpacked.')
  process.exit(1)
}

const winStage = join(deployDir, `PortableLeetcode-${version}-windows-x64`)
mkdirSync(winStage, { recursive: true })
cpSync(winUnpacked, join(winStage, 'PortableLeetcode'), { recursive: true })
const winZip = join(deployDir, `PortableLeetcode-${version}-windows-x64.zip`)
zipKeepingParent(join(winStage, 'PortableLeetcode'), winZip)
rmSync(winStage, { recursive: true, force: true })
made.push(winZip)

const winRoot = join(root, 'release', 'win')
for (const name of readdirSync(winRoot)) {
  if (!name.endsWith('.exe')) continue
  const from = join(winRoot, name)
  const to = join(deployDir, `PortableLeetcode-${version}-windows-x64-portable.exe`)
  cpSync(from, to)
  made.push(to)
}

console.log('\nReady to hand over:')
for (const path of made) console.log(`  ${path}`)
if (!portableOk) {
  console.log('\nNo portable .exe. Send the Windows zip. On a Mac, Wine is what produces the single-file exe.')
}
