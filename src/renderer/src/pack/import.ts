import type { PackImportResult } from './types'

function api(): Window['portableLeetcode'] {
  return window.portableLeetcode
}

/** Open a file dialog and import a `.plpack` into the local bank. */
export async function importPack(): Promise<PackImportResult> {
  return api().importPack()
}

/** Import from an explicit filesystem path (tests / content folder). */
export async function importPackPath(filePath: string): Promise<PackImportResult> {
  return api().importPackPath(filePath)
}
