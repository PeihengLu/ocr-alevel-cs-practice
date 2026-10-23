import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { defaultProgress, emptyBank } from '../../shared/pack/merge'
import type {
  AttemptRecord,
  BankSnapshot,
  ProgressRecord,
  QuestionProgressStatus
} from '../../shared/pack/types'

export async function loadJsonBank(path: string): Promise<BankSnapshot> {
  try {
    const raw = await readFile(path, 'utf8')
    const parsed = JSON.parse(raw) as BankSnapshot
    const attempts = parsed.attempts ?? []
    return {
      questions: parsed.questions ?? {},
      packs: parsed.packs ?? {},
      attempts,
      progress: normalizeProgress(parsed.progress, attempts),
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

function normalizeProgress(
  raw: Record<string, ProgressRecord> | undefined,
  attempts: AttemptRecord[]
): Record<string, ProgressRecord> {
  const out: Record<string, ProgressRecord> = {}

  if (raw) {
    for (const [id, p] of Object.entries(raw)) {
      const bestPassed = Boolean(p.bestPassed) || p.status === 'passed'
      out[id] = {
        questionId: p.questionId ?? id,
        status: coerceStatus(p.status, bestPassed),
        bestPassed,
        attemptCount: Number(p.attemptCount) || 0,
        lastAttemptAt: p.lastAttemptAt ?? null
      }
    }
  }

  const counts: Record<string, number> = {}
  const lastAt: Record<string, string> = {}
  const everPassed: Record<string, boolean> = {}
  for (const a of attempts) {
    counts[a.questionId] = (counts[a.questionId] ?? 0) + 1
    lastAt[a.questionId] = laterIso(lastAt[a.questionId] ?? null, a.createdAt)
    if (a.passed === true) everPassed[a.questionId] = true
  }

  for (const id of Object.keys(counts)) {
    const existing = out[id] ?? defaultProgress(id)
    const bestPassed = existing.bestPassed || Boolean(everPassed[id])
    const status: QuestionProgressStatus = bestPassed
      ? 'passed'
      : counts[id] > 0
        ? 'attempted'
        : 'unseen'
    out[id] = {
      questionId: id,
      status,
      bestPassed,
      attemptCount: Math.max(existing.attemptCount, counts[id]),
      lastAttemptAt: laterIso(existing.lastAttemptAt, lastAt[id])
    }
  }

  return out
}

function coerceStatus(
  status: unknown,
  bestPassed: boolean
): QuestionProgressStatus {
  if (bestPassed) return 'passed'
  if (status === 'passed' || status === 'attempted' || status === 'unseen') {
    return status
  }
  return 'unseen'
}

function laterIso(a: string | null, b: string): string {
  if (!a) return b
  return Date.parse(a) >= Date.parse(b) ? a : b
}
