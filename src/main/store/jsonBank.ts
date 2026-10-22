import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { emptyBank } from '../../shared/pack/merge'
import type { BankSnapshot } from '../../shared/pack/types'

export async function loadJsonBank(path: string): Promise<BankSnapshot> {
  try {
    const raw = await readFile(path, 'utf8')
    const parsed = JSON.parse(raw) as BankSnapshot
    return {
      questions: parsed.questions ?? {},
      packs: parsed.packs ?? {},
      attempts: parsed.attempts ?? [],
      sqlAssets: parsed.sqlAssets ?? {}
    }
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code
    if (code === 'ENOENT') return emptyBank()
    throw err
  }
}

export async function saveJsonBank(
  path: string,
  bank: BankSnapshot
): Promise<void> {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, `${JSON.stringify(bank, null, 2)}\n`, 'utf8')
}
