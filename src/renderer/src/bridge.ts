import { invoke } from '@tauri-apps/api/core'
import { runPythonExercise } from './python/runInWebview'

type Bridge = Window['portableLeetcode']

function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

function electronApi(): Bridge | null {
  if (isTauri()) return null
  return window.portableLeetcode ?? null
}

function tauriApi(): Bridge {
  return {
    platform: 'darwin',
    getStorageStatus: () => invoke('storage_status'),
    listQuestions: () => invoke('bank_list_questions'),
    listQuestionSummaries: () => invoke('bank_list_question_summaries'),
    getQuestion: (id) => invoke('bank_get_question', { id }),
    getSqlAsset: (schemaRef) => invoke('bank_get_sql_asset', { schemaRef }),
    importPack: () => invoke('pack_import'),
    importPackPath: (filePath) => invoke('pack_import_path', { filePath }),
    runQuery: (questionId, sql) =>
      invoke('practice_run_query', { questionId, sql }),
    runLinkedList: (exerciseId, code) => runPythonExercise(exerciseId, code)
  }
}

let cached: Bridge | null = null
let platformReady: Promise<void> | null = null

async function ensurePlatform(api: Bridge): Promise<void> {
  if (!platformReady) {
    platformReady = invoke<string>('get_platform')
      .then((p) => {
        if (p === 'darwin' || p === 'win32' || p === 'linux') {
          api.platform = p
        }
      })
      .catch(() => undefined)
  }
  await platformReady
}

/** Shared bridge for Electron preload and Tauri invoke. */
export async function getPortableLeetcode(): Promise<Bridge> {
  const existing = electronApi()
  if (existing) return existing
  if (!cached) {
    cached = tauriApi()
    window.portableLeetcode = cached
  }
  await ensurePlatform(cached)
  return cached
}
