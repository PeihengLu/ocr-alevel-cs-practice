import { dialog, ipcMain } from 'electron'
import { readFile, writeFile } from 'node:fs/promises'
import type {
  PackExportResult,
  PackImportResult,
  PackPayload,
  SqlQuestion,
  StorageStatus
} from '../shared/pack/types'
import { packPlpack, unpackPlpack } from './pack/zip'
import {
  buildPackFromQuestionIds,
  getQuestion,
  getSqlAsset,
  getStorageStatus,
  importPackPayload,
  listQuestions,
  upsertAuthoredQuestion
} from './store/bank'

export function registerIpcHandlers(): void {
  ipcMain.handle('storage:status', (): StorageStatus => getStorageStatus())

  ipcMain.handle('bank:listQuestions', (): SqlQuestion[] => listQuestions())

  ipcMain.handle(
    'bank:getQuestion',
    (_e, id: string): SqlQuestion | null => getQuestion(id)
  )

  ipcMain.handle(
    'bank:getSqlAsset',
    (_e, schemaRef: string): string | null => getSqlAsset(schemaRef)
  )

  ipcMain.handle(
    'bank:upsertQuestion',
    async (
      _e,
      payload: { question: SqlQuestion; sqlAsset?: string }
    ): Promise<{ ok: true } | { ok: false; error: string }> => {
      try {
        await upsertAuthoredQuestion(payload.question, payload.sqlAsset)
        return { ok: true }
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : String(err)
        }
      }
    }
  )

  ipcMain.handle('pack:import', async (): Promise<PackImportResult> => {
    const picked = await dialog.showOpenDialog({
      title: 'Import question pack',
      filters: [
        { name: 'PortableLeetcode pack', extensions: ['plpack'] },
        { name: 'All files', extensions: ['*'] }
      ],
      properties: ['openFile']
    })
    if (picked.canceled || picked.filePaths.length === 0) {
      return { ok: false, error: 'Import cancelled.' }
    }

    try {
      const buffer = await readFile(picked.filePaths[0])
      const pack = await unpackPlpack(buffer)
      const stats = await importPackPayload(pack)
      return {
        ok: true,
        pack,
        merged: stats.merged,
        skipped: stats.skipped,
        retired: stats.retired,
        storage: getStorageStatus().backend
      }
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : String(err)
      }
    }
  })

  ipcMain.handle(
    'pack:importPath',
    async (_e, filePath: string): Promise<PackImportResult> => {
      try {
        const buffer = await readFile(filePath)
        const pack = await unpackPlpack(buffer)
        const stats = await importPackPayload(pack)
        return {
          ok: true,
          pack,
          merged: stats.merged,
          skipped: stats.skipped,
          retired: stats.retired,
          storage: getStorageStatus().backend
        }
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : String(err)
        }
      }
    }
  )

  ipcMain.handle(
    'pack:export',
    async (
      _e,
      args: {
        meta: {
          packId: string
          version: string
          title: string
          description?: string
          retiredIds?: string[]
        }
        questionIds: string[]
      }
    ): Promise<PackExportResult> => {
      try {
        const payload = await buildPackFromQuestionIds(args.meta, args.questionIds)
        return await writePackWithDialog(payload)
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : String(err)
        }
      }
    }
  )

  ipcMain.handle(
    'pack:exportPayload',
    async (_e, payload: PackPayload): Promise<PackExportResult> => {
      try {
        return await writePackWithDialog(payload)
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : String(err)
        }
      }
    }
  )

  /**
   * TODO(M1): run student SQL against an isolated exercise schema and evaluate checks.
   * Stubbed until MySQL exercise runner lands; still records the intent in UI.
   */
  ipcMain.handle(
    'practice:runQuery',
    async (
      _e,
      args: { questionId: string; sql: string }
    ): Promise<{
      ok: boolean
      stub: true
      message: string
      questionId: string
      sql: string
    }> => {
      const q = getQuestion(args.questionId)
      if (!q) {
        return {
          ok: false,
          stub: true,
          message: `Unknown question "${args.questionId}"`,
          questionId: args.questionId,
          sql: args.sql
        }
      }
      return {
        ok: true,
        stub: true,
        message:
          'TODO: execute against MySQL exercise schema and evaluate checks. Pack + bank are wired; query runner is next.',
        questionId: args.questionId,
        sql: args.sql
      }
    }
  )
}

async function writePackWithDialog(payload: PackPayload): Promise<PackExportResult> {
  const suggested = `${payload.manifest.packId}-v${payload.manifest.version}.plpack`
  const saved = await dialog.showSaveDialog({
    title: 'Export question pack',
    defaultPath: suggested,
    filters: [{ name: 'PortableLeetcode pack', extensions: ['plpack'] }]
  })
  if (saved.canceled || !saved.filePath) {
    return { ok: false, error: 'Export cancelled.', cancelled: true }
  }

  const path = saved.filePath.endsWith('.plpack')
    ? saved.filePath
    : `${saved.filePath}.plpack`

  const buffer = await packPlpack(payload)
  await writeFile(path, buffer)
  return { ok: true, path }
}
