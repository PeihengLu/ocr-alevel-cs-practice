import { contextBridge, ipcRenderer } from 'electron'
import type {
  PackImportResult,
  QueryRunResult,
  QuestionSummary,
  SqlQuestion,
  StorageStatus
} from '../shared/pack/types'
import type { PythonRunResult } from '../shared/python/report'

const api = {
  platform: process.platform,

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

  importPack(): Promise<PackImportResult> {
    return ipcRenderer.invoke('pack:import')
  },

  importPackPath(filePath: string): Promise<PackImportResult> {
    return ipcRenderer.invoke('pack:importPath', filePath)
  },

  runQuery(questionId: string, sql: string): Promise<QueryRunResult> {
    return ipcRenderer.invoke('practice:runQuery', { questionId, sql })
  },

  /** Run one linked-list exercise. Tests stay in the main process. */
  runLinkedList(exerciseId: string, code: string): Promise<PythonRunResult> {
    return ipcRenderer.invoke('python:runLinkedList', { exerciseId, code })
  }
}

contextBridge.exposeInMainWorld('portableLeetcode', api)

export type PortableLeetcodeApi = typeof api
