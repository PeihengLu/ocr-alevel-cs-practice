#!/usr/bin/env node
/**
 * Build .plpack files from samples/<packId>/ folders that contain manifest.json.
 *
 *   node scripts/build-sample-pack.mjs              # all packs
 *   node scripts/build-sample-pack.mjs sql-basics   # one pack
 */
import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, writeFile, stat } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import JSZip from 'jszip'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const samplesRoot = join(root, 'samples')
const contentDir = join(root, 'content')

const only = process.argv[2]

async function buildPack(packDirName) {
  const sampleDir = join(samplesRoot, packDirName)
  const manifestPath = join(sampleDir, 'manifest.json')
  try {
    await stat(manifestPath)
  } catch {
    return null
  }

  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  const questions = []
  for (const id of manifest.questionIds) {
    const raw = await readFile(join(sampleDir, 'questions', `${id}.json`), 'utf8')
    questions.push(JSON.parse(raw))
  }

  const sqlAssets = {}
  const sqlDir = join(sampleDir, 'sql')
  for (const name of await readdir(sqlDir)) {
    if (!name.endsWith('.sql')) continue
    const ref = name.slice(0, -'.sql'.length)
    sqlAssets[ref] = await readFile(join(sqlDir, name), 'utf8')
  }

  const manifestWithoutChecksum = { ...manifest, checksum: undefined }
  const checksum = createHash('sha256')
    .update(JSON.stringify({ manifest: manifestWithoutChecksum, questions, sqlAssets }))
    .digest('hex')

  const zip = new JSZip()
  zip.file(
    'manifest.json',
    `${JSON.stringify({ ...manifestWithoutChecksum, checksum }, null, 2)}\n`
  )
  for (const q of questions) {
    zip.file(`questions/${q.id}.json`, `${JSON.stringify(q, null, 2)}\n`)
  }
  for (const [ref, sql] of Object.entries(sqlAssets)) {
    zip.file(`sql/${ref}.sql`, sql.endsWith('\n') ? sql : `${sql}\n`)
  }

  const buffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  })

  const outFile = join(samplesRoot, `${packDirName}.plpack`)
  await writeFile(outFile, buffer)

  await mkdir(contentDir, { recursive: true })
  const contentCopy = join(contentDir, `${packDirName}.plpack`)
  await writeFile(contentCopy, buffer)

  console.log(`Wrote ${outFile} (${buffer.length} bytes)`)
  console.log(`Wrote ${contentCopy}`)
  return outFile
}

const entries = only
  ? [only]
  : (await readdir(samplesRoot, { withFileTypes: true }))
      .filter((d) => d.isDirectory())
      .map((d) => d.name)

for (const name of entries) {
  await buildPack(name)
}
