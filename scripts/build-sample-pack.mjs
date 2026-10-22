#!/usr/bin/env node
/**
 * Build content/sample-intro.plpack from samples/intro-sql/.
 */
import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import JSZip from 'jszip'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const sampleDir = join(root, 'samples', 'intro-sql')
const outDir = join(root, 'samples')
const outFile = join(outDir, 'intro-sql.plpack')
const contentDir = join(root, 'content')
const contentCopy = join(contentDir, 'sample-intro.plpack')

const manifest = JSON.parse(await readFile(join(sampleDir, 'manifest.json'), 'utf8'))
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

await mkdir(outDir, { recursive: true })
await mkdir(contentDir, { recursive: true })
const buffer = await zip.generateAsync({
  type: 'nodebuffer',
  compression: 'DEFLATE',
  compressionOptions: { level: 9 }
})
await writeFile(outFile, buffer)
await writeFile(contentCopy, buffer)
console.log(`Wrote ${outFile} (${buffer.length} bytes)`)
console.log(`Wrote ${contentCopy}`)
