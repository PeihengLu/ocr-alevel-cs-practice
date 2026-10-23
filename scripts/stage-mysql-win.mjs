#!/usr/bin/env node
/**
 * Download official MariaDB Windows x64 zip and stage a portable server tree into
 * vendor/mysql-win for Student Windows packaging.
 *
 *   node scripts/stage-mysql-win.mjs
 *
 * Does NOT use macOS Homebrew MySQL — Windows needs winx64 binaries (mysqld.exe + server.dll).
 */
import { execFileSync } from 'node:child_process'
import {
  chmodSync,
  cpSync,
  createWriteStream,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync
} from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pipeline } from 'node:stream/promises'
import https from 'node:https'
import http from 'node:http'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dest = join(root, 'vendor', 'mysql-win')
const cacheDir = join(root, 'vendor', '.cache')

const MARIA_VERSION = '11.4.5'
const ZIP_NAME = `mariadb-${MARIA_VERSION}-winx64.zip`
const ZIP_URL = `https://archive.mariadb.org/mariadb-${MARIA_VERSION}/winx64-packages/${ZIP_NAME}`
const INNER_DIR = `mariadb-${MARIA_VERSION}-winx64`

/** Keep only what the sidecar needs at runtime (skip pdb / backup / optional tools). */
const KEEP_BIN = new Set([
  'mysqld.exe',
  'mariadbd.exe',
  'server.dll',
  'mysql.exe',
  'mariadb.exe',
  'mysqladmin.exe',
  'mariadb-admin.exe',
  'my_print_defaults.exe',
  'mysql_install_db.exe',
  'mariadb-install-db.exe'
])

function download(url, outPath) {
  return new Promise((resolve, reject) => {
    const get = url.startsWith('https') ? https.get : http.get
    const req = get(url, (res) => {
      if (
        res.statusCode &&
        res.statusCode >= 300 &&
        res.statusCode < 400 &&
        res.headers.location
      ) {
        res.resume()
        download(res.headers.location, outPath).then(resolve, reject)
        return
      }
      if (res.statusCode !== 200) {
        res.resume()
        reject(new Error(`HTTP ${res.statusCode} for ${url}`))
        return
      }
      const file = createWriteStream(outPath)
      pipeline(res, file).then(resolve, reject)
    })
    req.on('error', reject)
  })
}

function unzip(zipPath, outDir) {
  mkdirSync(outDir, { recursive: true })
  // Prefer system unzip (macOS / Linux CI). Avoid adding a zip dependency.
  execFileSync('unzip', ['-q', '-o', zipPath, '-d', outDir], { stdio: 'inherit' })
}

async function main() {
  mkdirSync(cacheDir, { recursive: true })
  const zipPath = join(cacheDir, ZIP_NAME)

  if (!existsSync(zipPath) || statSync(zipPath).size < 1_000_000) {
    console.log(`Downloading ${ZIP_URL}`)
    const tmp = `${zipPath}.partial`
    rmSync(tmp, { force: true })
    await download(ZIP_URL, tmp)
    rmSync(zipPath, { force: true })
    execFileSync('mv', [tmp, zipPath])
  } else {
    console.log(`Using cached ${zipPath}`)
  }

  const extractRoot = join(cacheDir, 'extract-win')
  rmSync(extractRoot, { recursive: true, force: true })
  console.log(`Extracting ${ZIP_NAME}…`)
  unzip(zipPath, extractRoot)

  const src = join(extractRoot, INNER_DIR)
  if (!existsSync(join(src, 'bin', 'mysqld.exe'))) {
    console.error(`Expected ${src}/bin/mysqld.exe after extract`)
    process.exit(1)
  }
  if (!existsSync(join(src, 'bin', 'server.dll'))) {
    console.error('MariaDB Windows needs bin/server.dll next to mysqld.exe')
    process.exit(1)
  }

  console.log(`Staging → ${dest}`)
  rmSync(dest, { recursive: true, force: true })
  mkdirSync(join(dest, 'bin'), { recursive: true })

  for (const name of readdirSync(join(src, 'bin'))) {
    if (!KEEP_BIN.has(name)) continue
    cpSync(join(src, 'bin', name), join(dest, 'bin', name))
  }

  cpSync(join(src, 'share'), join(dest, 'share'), { recursive: true })

  const pluginSrc = join(src, 'lib', 'plugin')
  if (existsSync(pluginSrc)) {
    mkdirSync(join(dest, 'lib'), { recursive: true })
    cpSync(pluginSrc, join(dest, 'lib', 'plugin'), { recursive: true })
  }

  // Drop huge optional storage engines from the student bundle.
  const skipPlugins = [
    'ha_rocksdb.dll',
    'ha_connect.dll',
    'ha_spider.dll',
    'ha_sphinx.dll'
  ]
  for (const p of skipPlugins) {
    rmSync(join(dest, 'lib', 'plugin', p), { force: true })
  }

  writeFileSync(
    join(dest, 'PORTABLE.txt'),
    [
      'Portable MariaDB (Windows x64) for PortableLeetcode Student.',
      `Source: ${ZIP_URL}`,
      `Staged: ${new Date().toISOString()}`,
      '',
      'Layout expected by the app sidecar:',
      '  bin/mysqld.exe',
      '  bin/server.dll',
      '  bin/mysqladmin.exe',
      '  share/english/errmsg.sys',
      '',
      'Regenerate: npm run vendor:mysql:win',
      ''
    ].join('\n')
  )

  const mysqld = join(dest, 'bin', 'mysqld.exe')
  const serverDll = join(dest, 'bin', 'server.dll')
  if (!existsSync(mysqld) || !existsSync(serverDll)) {
    console.error('Staging incomplete — mysqld.exe or server.dll missing')
    process.exit(1)
  }

  try {
    chmodSync(mysqld, 0o755)
  } catch {
    /* windows perms N/A on mac staging */
  }

  const sizeMb = Math.round(
    execFileSync('du', ['-sm', dest], { encoding: 'utf8' }).split(/\s+/)[0]
  )
  console.log(`Done. vendor/mysql-win ≈ ${sizeMb} MB`)
  console.log('  bin:', readdirSync(join(dest, 'bin')).join(', '))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
