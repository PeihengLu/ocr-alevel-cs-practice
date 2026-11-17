import { findPythonExercise } from '../../../shared/python/chapters'
import {
  buildPythonProgram,
  gradePythonRun,
  type PythonRunResult
} from '../../../shared/python/report'

type PyodideInterface = {
  runPythonAsync: (code: string) => Promise<unknown>
  setStdout: (opts: { batched: (text: string) => void }) => void
  setStderr: (opts: { batched: (text: string) => void }) => void
}

type LoadPyodide = (opts: { indexURL: string }) => Promise<PyodideInterface>

let pyodidePromise: Promise<PyodideInterface> | null = null

function pyodideIndexUrl(): string {
  const base = import.meta.env.BASE_URL || '/'
  const normalized = base.endsWith('/') ? base : `${base}/`
  // Prefer absolute URL so worker/wasm fetches resolve correctly in the webview.
  if (typeof window !== 'undefined' && window.location?.origin) {
    return new URL(`${normalized}pyodide/`, window.location.origin).href
  }
  return `${normalized}pyodide/`
}

async function loadPyodideRuntime(): Promise<PyodideInterface> {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      const indexURL = pyodideIndexUrl()
      const moduleUrl = `${indexURL}pyodide.mjs`
      const mod = (await import(/* @vite-ignore */ moduleUrl)) as {
        loadPyodide: LoadPyodide
      }
      return mod.loadPyodide({ indexURL })
    })().catch((err) => {
      pyodidePromise = null
      throw err
    })
  }
  return pyodidePromise
}

async function execWithTimeout(
  py: PyodideInterface,
  code: string,
  timeoutMs: number
): Promise<{ ok: boolean; output: string; error?: string }> {
  let output = ''
  let errorOut = ''
  py.setStdout({
    batched: (text) => {
      output += `${text}\n`
    }
  })
  py.setStderr({
    batched: (text) => {
      errorOut += `${text}\n`
    }
  })

  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    await Promise.race([
      py.runPythonAsync(code),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs)
      })
    ])
    return { ok: true, output: output.trimEnd() }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (message === 'TIMEOUT' || message.includes('TIMEOUT')) {
      pyodidePromise = null
      return { ok: false, output: output.trimEnd(), error: 'TIMEOUT' }
    }
    const detail = errorOut.trim() || message
    return { ok: false, output: output.trimEnd(), error: detail }
  } finally {
    if (timer) clearTimeout(timer)
  }
}

/** Grade one Python exercise inside the webview with bundled Pyodide. */
export async function runPythonExercise(
  exerciseId: string,
  code: string,
  execTimeoutMs = 4000
): Promise<PythonRunResult> {
  const exercise = findPythonExercise(exerciseId)
  if (!exercise) {
    return {
      passed: false,
      message: `Unknown exercise "${exerciseId}".`,
      checks: [],
      output: ''
    }
  }
  if (code.length > 40_000) {
    return {
      passed: false,
      message: 'That program is too long.',
      checks: [],
      output: ''
    }
  }

  try {
    const py = await loadPyodideRuntime()
    const program = buildPythonProgram(code, exercise.tests)
    const raw = await execWithTimeout(py, program, execTimeoutMs)
    return gradePythonRun(raw)
  } catch (err) {
    return {
      passed: false,
      message: 'Python runtime failed to load.',
      checks: [],
      output: '',
      error: err instanceof Error ? err.message : String(err)
    }
  }
}
