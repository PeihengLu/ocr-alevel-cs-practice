import type { PackExportResult, PackPayload } from './types'

function api(): Window['portableLeetcode'] {
  return window.portableLeetcode
}

/** Export selected bank questions as a `.plpack` via save dialog. */
export async function exportPack(args: {
  meta: {
    packId: string
    version: string
    title: string
    description?: string
    retiredIds?: string[]
  }
  questionIds: string[]
}): Promise<PackExportResult> {
  return api().exportPack(args)
}

/** Export a fully built payload (advanced / tests). */
export async function exportPackPayload(
  payload: PackPayload
): Promise<PackExportResult> {
  return api().exportPackPayload(payload)
}
