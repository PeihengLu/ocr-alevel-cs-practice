import type { PackImportResult } from './types'

/**
 * Stub: student/teacher import of a `.plpack` file.
 * Merges by stable question IDs; newer version wins (per project context).
 */
export async function importPack(_filePath: string): Promise<PackImportResult> {
  return {
    ok: false,
    error: 'Pack import not implemented yet (M1 scaffold stub).'
  }
}
