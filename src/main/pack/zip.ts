import { createHash } from 'node:crypto'
import JSZip from 'jszip'
import { validatePackPayload } from '../../shared/pack/validate'
import {
  PACK_FORMAT_VERSION,
  type PackManifest,
  type PackPayload
} from '../../shared/pack/types'

/** Decode a .plpack zip buffer into a validated PackPayload. */
export async function unpackPlpack(buffer: Buffer): Promise<PackPayload> {
  const zip = await JSZip.loadAsync(buffer)
  const manifestFile = zip.file('manifest.json')
  if (!manifestFile) {
    throw new Error('Invalid .plpack: missing manifest.json')
  }

  const manifestJson = JSON.parse(await manifestFile.async('string')) as unknown
  if (
    typeof manifestJson !== 'object' ||
    manifestJson === null ||
    Array.isArray(manifestJson)
  ) {
    throw new Error('Invalid manifest.json')
  }

  const questionIds =
    'questionIds' in manifestJson && Array.isArray(manifestJson.questionIds)
      ? (manifestJson.questionIds as string[])
      : []

  const questions = []
  for (const id of questionIds) {
    const safe = sanitizePathSegment(id)
    const file = zip.file(`questions/${safe}.json`)
    if (!file) {
      throw new Error(`Invalid .plpack: missing questions/${safe}.json`)
    }
    questions.push(JSON.parse(await file.async('string')))
  }

  // Also accept any extra question files not listed (then fail validation on IDs).
  const questionFolder = zip.folder('questions')
  if (questionFolder) {
    const listed = new Set(questionIds.map(sanitizePathSegment))
    for (const [path, entry] of Object.entries(zip.files)) {
      if (entry.dir || !path.startsWith('questions/') || !path.endsWith('.json')) {
        continue
      }
      const stem = path.slice('questions/'.length, -'.json'.length)
      if (!listed.has(stem)) {
        questions.push(JSON.parse(await entry.async('string')))
      }
    }
  }

  const sqlAssets: Record<string, string> = {}
  for (const [path, entry] of Object.entries(zip.files)) {
    if (entry.dir || !path.startsWith('sql/') || !path.endsWith('.sql')) continue
    const ref = path.slice('sql/'.length, -'.sql'.length)
    sqlAssets[ref] = await entry.async('string')
  }

  return validatePackPayload({
    manifest: manifestJson,
    questions,
    sqlAssets
  })
}

/** Encode a PackPayload into a .plpack zip buffer (with checksum). */
export async function packPlpack(payload: PackPayload): Promise<Buffer> {
  const validated = validatePackPayload(payload)
  const manifestWithoutChecksum: PackManifest = {
    ...validated.manifest,
    formatVersion: PACK_FORMAT_VERSION,
    checksum: undefined
  }

  const zip = new JSZip()
  const questionsForHash: unknown[] = []

  for (const id of validated.manifest.questionIds) {
    const q = validated.questions.find((item) => item.id === id)
    if (!q) {
      throw new Error(`questionIds references missing question "${id}"`)
    }
    const safe = sanitizePathSegment(id)
    const body = `${JSON.stringify(q, null, 2)}\n`
    zip.file(`questions/${safe}.json`, body)
    questionsForHash.push(q)
  }

  for (const [ref, sql] of Object.entries(validated.sqlAssets)) {
    const safe = sanitizePathSegment(ref)
    zip.file(`sql/${safe}.sql`, sql.endsWith('\n') ? sql : `${sql}\n`)
  }

  const checksum = createHash('sha256')
    .update(
      JSON.stringify({
        manifest: manifestWithoutChecksum,
        questions: questionsForHash,
        sqlAssets: validated.sqlAssets
      })
    )
    .digest('hex')

  const manifest: PackManifest = {
    ...manifestWithoutChecksum,
    checksum
  }
  zip.file('manifest.json', `${JSON.stringify(manifest, null, 2)}\n`)

  const out = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  })
  return Buffer.from(out)
}

function sanitizePathSegment(id: string): string {
  if (!/^[a-zA-Z0-9._-]+$/.test(id)) {
    throw new Error(
      `Invalid id/schemaRef "${id}" — use letters, numbers, . _ - only`
    )
  }
  return id
}
