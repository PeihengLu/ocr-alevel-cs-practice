import type { BankSnapshot, PackPayload, SqlQuestion } from './types'

export interface MergeStats {
  merged: number
  skipped: number
  retired: number
}

/**
 * Apply a pack into a bank snapshot (immutable; returns a new snapshot).
 * Newer question.version wins; equal or older versions are skipped.
 */
export function mergePackIntoBank(
  bank: BankSnapshot,
  pack: PackPayload
): { bank: BankSnapshot; stats: MergeStats } {
  const questions = { ...bank.questions }
  const sqlAssets = { ...bank.sqlAssets }
  let merged = 0
  let skipped = 0

  for (const q of pack.questions) {
    const existing = questions[q.id]
    if (!existing || q.version > existing.version) {
      questions[q.id] = cloneQuestion(q)
      merged += 1
    } else {
      skipped += 1
    }
  }

  for (const [ref, sql] of Object.entries(pack.sqlAssets)) {
    // Always refresh assets referenced by an accepted (or same) pack import.
    sqlAssets[ref] = sql
  }

  let retired = 0
  for (const id of pack.manifest.retiredIds ?? []) {
    if (id in questions) {
      delete questions[id]
      retired += 1
    }
  }

  const packs = {
    ...bank.packs,
    [pack.manifest.packId]: {
      packId: pack.manifest.packId,
      version: pack.manifest.version,
      title: pack.manifest.title,
      importedAt: new Date().toISOString()
    }
  }

  return {
    bank: {
      ...bank,
      questions,
      sqlAssets,
      packs
    },
    stats: { merged, skipped, retired }
  }
}

export function emptyBank(): BankSnapshot {
  return {
    questions: {},
    packs: {},
    attempts: [],
    sqlAssets: {}
  }
}

export function questionsFromBank(bank: BankSnapshot): SqlQuestion[] {
  return Object.values(bank.questions).sort((a, b) =>
    a.title.localeCompare(b.title)
  )
}

function cloneQuestion(q: SqlQuestion): SqlQuestion {
  return {
    ...q,
    checks: q.checks.map((c) => ({ ...c })),
    tags: [...q.tags]
  }
}
