#!/usr/bin/env node
/**
 * Stage a relocatable MySQL server tree into vendor/mysql for macOS packaging.
 * Sources Homebrew mysql + deps, rewrites dylibs to @loader_path, ad-hoc codesigns.
 *
 *   node scripts/stage-mysql-mac.mjs
 */
import { execFileSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync
} from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dest = join(root, 'vendor', 'mysql')

function brewPrefix(formula) {
  try {
    return execFileSync('brew', ['--prefix', formula], { encoding: 'utf8' }).trim()
  } catch {
    return null
  }
}

const mysqlPrefix = brewPrefix('mysql')
if (!mysqlPrefix || !existsSync(join(mysqlPrefix, 'bin', 'mysqld'))) {
  console.error(
    'Homebrew mysql not found. On a Mac with brew: brew install mysql && node scripts/stage-mysql-mac.mjs'
  )
  process.exit(1)
}

const searchRoots = [
  mysqlPrefix,
  brewPrefix('icu4c@78'),
  brewPrefix('icu4c'),
  brewPrefix('openssl@4'),
  brewPrefix('openssl@3'),
  brewPrefix('openssl'),
  brewPrefix('zstd'),
  brewPrefix('protobuf'),
  brewPrefix('abseil'),
  brewPrefix('zlib-ng-compat'),
  brewPrefix('zlib'),
  '/opt/homebrew/lib',
  '/opt/homebrew/opt'
].filter(Boolean)

console.log(`Staging MySQL from ${mysqlPrefix} → ${dest}`)
rmSync(dest, { recursive: true, force: true })
mkdirSync(join(dest, 'bin'), { recursive: true })
mkdirSync(join(dest, 'lib'), { recursive: true })
mkdirSync(join(dest, 'share'), { recursive: true })

const bins = ['mysqld', 'mysql', 'mysqladmin', 'my_print_defaults']
for (const name of bins) {
  const src = join(mysqlPrefix, 'bin', name)
  if (!existsSync(src)) {
    console.error(`Missing ${src}`)
    process.exit(1)
  }
  cpSync(src, join(dest, 'bin', name))
}

cpSync(join(mysqlPrefix, 'share', 'mysql'), join(dest, 'share', 'mysql'), {
  recursive: true
})

const pluginSrc = join(mysqlPrefix, 'lib', 'plugin')
if (existsSync(pluginSrc)) {
  cpSync(pluginSrc, join(dest, 'lib', 'plugin'), { recursive: true })
}

function findOnDisk(libName) {
  const candidates = []
  for (const rootDir of searchRoots) {
    candidates.push(join(rootDir, 'lib', libName))
    candidates.push(join(rootDir, libName))
  }
  // Deep-ish search under /opt/homebrew/opt/*/lib
  try {
    for (const formula of readdirSync('/opt/homebrew/opt')) {
      candidates.push(join('/opt/homebrew/opt', formula, 'lib', libName))
    }
  } catch {
    // ignore
  }
  for (const c of candidates) {
    if (existsSync(c)) return c
  }
  return null
}

function listLoadCommands(binaryPath) {
  const out = execFileSync('otool', ['-L', binaryPath], { encoding: 'utf8' })
  const deps = []
  for (const line of out.split('\n').slice(1)) {
    const m = line.trim().match(/^(.+?)\s+\(compatibility/)
    if (!m) continue
    deps.push(m[1])
  }
  return deps
}

/** @type {Set<string>} */
const copiedLibs = new Set()

function stageLibAbs(absPath) {
  if (!absPath || !existsSync(absPath) || copiedLibs.has(absPath)) return
  // Skip system libs
  if (absPath.startsWith('/usr/lib/') || absPath.startsWith('/System/')) return

  copiedLibs.add(absPath)
  const name = basename(absPath)
  const target = join(dest, 'lib', name)
  if (!existsSync(target)) {
    cpSync(absPath, target)
  }

  for (const dep of listLoadCommands(target)) {
    resolveAndStage(dep)
  }
}

function resolveAndStage(dep) {
  if (dep.startsWith('/usr/lib/') || dep.startsWith('/System/')) return
  if (dep.startsWith('@loader_path/') || dep.startsWith('@executable_path/')) return

  let abs = null
  if (dep.startsWith('@rpath/')) {
    abs = findOnDisk(dep.slice('@rpath/'.length))
  } else if (dep.startsWith('/')) {
    abs = existsSync(dep) ? dep : findOnDisk(basename(dep))
  } else {
    abs = findOnDisk(basename(dep))
  }

  if (!abs) {
    console.warn(`  missing dep: ${dep}`)
    return
  }
  stageLibAbs(abs)
}

for (const name of bins) {
  for (const dep of listLoadCommands(join(dest, 'bin', name))) {
    resolveAndStage(dep)
  }
}

// Extra pass: rewrite + collect until stable
let pass = 0
while (pass < 5) {
  pass += 1
  const before = copiedLibs.size
  for (const name of readdirSync(join(dest, 'lib'))) {
    const p = join(dest, 'lib', name)
    if (!statSync(p).isFile()) continue
    for (const dep of listLoadCommands(p)) {
      resolveAndStage(dep)
    }
  }
  if (copiedLibs.size === before) break
}

function rewriteBinary(filePath, isBin) {
  const deps = listLoadCommands(filePath)
  const idName = basename(filePath)
  try {
    if (!isBin) {
      execFileSync('install_name_tool', ['-id', `@loader_path/${idName}`, filePath], {
        stdio: 'ignore'
      })
    }
  } catch {
    // ignore
  }
  for (const dep of deps) {
    if (dep.startsWith('/usr/lib/') || dep.startsWith('/System/')) continue
    const depName = basename(dep)
    if (!existsSync(join(dest, 'lib', depName))) continue
    const newPath = isBin
      ? `@loader_path/../lib/${depName}`
      : `@loader_path/${depName}`
    try {
      execFileSync('install_name_tool', ['-change', dep, newPath, filePath], {
        stdio: 'ignore'
      })
    } catch {
      // ignore
    }
  }
  // Also add rpath for safety
  try {
    execFileSync(
      'install_name_tool',
      ['-add_rpath', isBin ? '@loader_path/../lib' : '@loader_path', filePath],
      { stdio: 'ignore' }
    )
  } catch {
    // may already exist
  }
}

for (const name of bins) {
  rewriteBinary(join(dest, 'bin', name), true)
}
for (const name of readdirSync(join(dest, 'lib'))) {
  const p = join(dest, 'lib', name)
  if (statSync(p).isFile()) rewriteBinary(p, false)
}

const entitlements = join(root, 'build', 'mysql.entitlements.plist')
mkdirSync(dirname(entitlements), { recursive: true })
writeFileSync(
  entitlements,
  `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.cs.disable-library-validation</key>
  <true/>
  <key>com.apple.security.cs.allow-dyld-environment-variables</key>
  <true/>
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
  <true/>
</dict>
</plist>
`
)

function adHocSign(filePath, withEntitlements) {
  const args = ['--force', '--sign', '-', '--timestamp=none']
  if (withEntitlements) {
    args.push('--entitlements', entitlements)
  }
  args.push(filePath)
  try {
    execFileSync('codesign', args, { stdio: 'ignore' })
  } catch {
    console.warn(`  warn: codesign failed for ${basename(filePath)}`)
  }
}

function walkFiles(dir, out = []) {
  if (!existsSync(dir)) return out
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walkFiles(p, out)
    else out.push(p)
  }
  return out
}

for (const p of walkFiles(join(dest, 'lib'))) {
  adHocSign(p, false)
}
for (const name of bins) {
  adHocSign(join(dest, 'bin', name), true)
}

try {
  const ver = execFileSync(join(dest, 'bin', 'mysqld'), ['--version'], {
    encoding: 'utf8'
  })
  console.log(ver.trim())
} catch (err) {
  console.error('Staged mysqld failed to run — check dylib rewriting / codesign.')
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
}

writeFileSync(
  join(dest, 'PORTABLE.txt'),
  [
    'Portable MySQL staged from Homebrew for PortableLeetcode packaging.',
    `Source: ${mysqlPrefix}`,
    `Staged: ${new Date().toISOString()}`,
    'Not for system-wide install — used only as an Electron sidecar.',
    ''
  ].join('\n')
)

const size = execFileSync('du', ['-sh', dest], { encoding: 'utf8' }).trim()
console.log(`OK — ${size} (${copiedLibs.size} libs)`)
console.log('vendor/mysql is gitignored; regenerate before pack:mac:teacher')
