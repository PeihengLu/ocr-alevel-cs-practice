import { getPortableLeetcode } from '../bridge'
import type { PackImportResult } from './types'

/** Open a file dialog and import a `.plpack` into the local bank. */
export async function importPack(): Promise<PackImportResult> {
  const api = await getPortableLeetcode()
  return api.importPack()
}

/** Import from an explicit filesystem path (tests / content folder). */
export async function importPackPath(filePath: string): Promise<PackImportResult> {
  const api = await getPortableLeetcode()
  return api.importPackPath(filePath)
}
