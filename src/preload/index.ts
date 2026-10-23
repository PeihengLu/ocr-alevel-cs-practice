import { contextBridge, ipcRenderer } from 'electron'
import type {
  PackExportResult,
  PackImportResult,
  PackPayload,
  QueryRunResult,
  QuestionSummary,
  SqlQuestion,
  StorageStatus
} from '../shared/pack/types'

const api = {
  platform: process.platform,
  editions: ['student', 'teacher'] as const,

  getStorageStatus(): Promise<StorageStatus> {
    return ipcRenderer.invoke('storage:status')
  },

  listQuestions(): Promise<SqlQuestion[]> {
    return ipcRenderer.invoke('bank:listQuestions')
  },

  listQuestionSummaries(): Promise<QuestionSummary[]> {
    return ipcRenderer.invoke('bank:listQuestionSummaries')
  },

  getQuestion(id: string): Promise<SqlQuestion | null> {
    return ipcRenderer.invoke('bank:getQuestion', id)
  },

  getSqlAsset(schemaRef: string): Promise<string | null> {
    return ipcRenderer.invoke('bank:getSqlAsset', schemaRef)
  },

  upsertQuestion(
    question: SqlQuestion,
    sqlAsset?: string
  ): Promise<{ ok: true } | { ok: false; error: string }> {
    return ipcRenderer.invoke('bank:upsertQuestion', { question, sqlAsset })
  },

  importPack(): Promise<PackImportResult> {
    return ipcRenderer.invoke('pack:import')
  },

  importPackPath(filePath: string): Promise<PackImportResult> {
    return ipcRenderer.invoke('pack:importPath', filePath)
  },

  exportPack(args: {
    meta: {
      packId: string
      version: string
      title: string
      description?: string
      retiredIds?: string[]
    }
    questionIds: string[]
  }): Promise<PackExportResult> {
    return ipcRenderer.invoke('pack:export', args)
  },

  exportPackPayload(payload: PackPayload): Promise<PackExportResult> {
    return ipcRenderer.invoke('pack:exportPayload', payload)
  },

  runQuery(questionId: string, sql: string): Promise<QueryRunResult> {
    return ipcRenderer.invoke('practice:runQuery', { questionId, sql })
  },

  runDemo(questionId: string, sql?: string): Promise<QueryRunResult> {
    return ipcRenderer.invoke('practice:runDemo', { questionId, sql })
  },

  /** Classroom Demo: project SELECT against the built-in school dataset. */
  runClassroomSql(sql: string): Promise<QueryRunResult> {
    return ipcRenderer.invoke('demo:runClassroomSql', sql)
  }
}

contextBridge.exposeInMainWorld('portableLeetcode', api)

export type PortableLeetcodeApi = typeof api
