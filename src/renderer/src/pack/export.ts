import type { PackExportResult, PackPayload } from './types'

/**
 * Stub: teacher export of a `.plpack` (zip + manifest).
 * Gated in UI to teacher edition only.
 */
export async function exportPack(
  _pack: PackPayload,
  _destPath: string
): Promise<PackExportResult> {
  return {
    ok: false,
    error: 'Pack export not implemented yet (M1 scaffold stub).'
  }
}
