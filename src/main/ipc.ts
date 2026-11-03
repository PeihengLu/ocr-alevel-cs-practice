import { app, dialog, ipcMain } from 'electron'
import { join } from 'node:path'
import { readFile } from 'node:fs/promises'
import type {
  PackImportResult,
  PackPayload,
  QueryRunResult,
  QuestionSummary,
  SqlQuestion,
  StorageStatus
} from '../shared/pack/types'
import { unpackPlpack } from './pack/zip'
import { runStudentQuery } from './practice/runner'
import { runLinkedListExercise, type PythonRunResult } from './python/linkedListRun'
import type { PythonPaths } from './python/session'
import {
  getQuestion,
  getSqlAsset,
  getStorageStatus,
  importPackPayload,
  listQuestionSummaries,
  listQuestions
} from './store/bank'

export function registerIpcHandlers(): void {
  ipcMain.handle('storage:status', (): StorageStatus => getStorageStatus())

  ipcMain.handle('bank:listQuestions', (): SqlQuestion[] =>
    listQuestions().map(hideSolution)
  )

  ipcMain.handle('bank:listQuestionSummaries', (): QuestionSummary[] =>
    listQuestionSummaries().map((item) => ({
      ...item,
      question: hideSolution(item.question)
    }))
  )

  ipcMain.handle(
    'bank:getQuestion',
    (_e, id: string): SqlQuestion | null => {
      const question = getQuestion(id)
      return question ? hideSolution(question) : null
    }
  )

  ipcMain.handle(
    'bank:getSqlAsset',
    (_e, schemaRef: string): string | null => getSqlAsset(schemaRef)
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
        pack: hidePackSolutions(pack),
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
          pack: hidePackSolutions(pack),
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
    'practice:runQuery',
    async (
      _e,
      args: { questionId: string; sql: string }
    ): Promise<QueryRunResult> => {
      const q = getQuestion(args.questionId)
      if (!q) {
        return {
          ok: false,
          passed: false,
          message: `Unknown question "${args.questionId}"`,
          questionId: args.questionId,
          sql: args.sql
        }
      }
      return runStudentQuery(q, args.sql)
    }
  )

  ipcMain.handle(
    'python:runLinkedList',
    async (_e, args: { exerciseId: string; code: string }): Promise<PythonRunResult> =>
      runLinkedListExercise(pythonPaths(), args.exerciseId, args.code)
  )
}

/** Answer keys stay in the bank. The practice window does not receive them. */
function hideSolution(question: SqlQuestion): SqlQuestion {
  if (question.solutionQuery === undefined) return question
  const next = { ...question }
  delete next.solutionQuery
  return next
}

function hidePackSolutions(pack: PackPayload): PackPayload {
  return {
    ...pack,
    questions: pack.questions.map(hideSolution)
  }
}

function pythonPaths(): PythonPaths {
  return {
    execPath: process.execPath,
    runnerPath: app.isPackaged
      ? join(process.resourcesPath, 'python', 'python-run.mjs')
      : join(process.cwd(), 'src/main/python/python-run.mjs'),
    pyodideDir: app.isPackaged
      ? join(process.resourcesPath, 'pyodide')
      : join(process.cwd(), 'node_modules/pyodide')
  }
}
