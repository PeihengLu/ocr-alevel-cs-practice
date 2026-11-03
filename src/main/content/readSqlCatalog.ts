import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { validatePackPayload } from '../../shared/pack/validate'
import type { PackPayload } from '../../shared/pack/types'

/** Read samples/sql-basics (or the copy shipped in the app) into a catalog. */
export async function readSqlCatalog(root: string): Promise<PackPayload> {
  const manifest = JSON.parse(await readFile(join(root, 'manifest.json'), 'utf8')) as unknown
  if (!manifest || typeof manifest !== 'object' || !('questionIds' in manifest)) {
    throw new Error(`SQL catalog at ${root} has no manifest.questionIds`)
  }
  const questionIds = (manifest as { questionIds: unknown }).questionIds
  if (!Array.isArray(questionIds)) {
    throw new Error(`SQL catalog at ${root} has no manifest.questionIds`)
  }

  const questions = []
  for (const id of questionIds) {
    if (typeof id !== 'string') throw new Error('manifest.questionIds must be strings')
    const raw = await readFile(join(root, 'questions', `${id}.json`), 'utf8')
    questions.push(JSON.parse(raw) as unknown)
  }

  const sqlAssets: Record<string, string> = {}
  for (const name of await readdir(join(root, 'sql'))) {
    if (!name.endsWith('.sql')) continue
    const ref = name.slice(0, -'.sql'.length)
    sqlAssets[ref] = await readFile(join(root, 'sql', name), 'utf8')
  }

  return validatePackPayload({ manifest, questions, sqlAssets })
}
