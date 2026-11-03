import { findPythonExercise } from '../../shared/python/chapters'
import {
  buildPythonProgram,
  gradePythonRun,
  type PythonRunResult
} from '../../shared/python/report'
import { PythonSession, type PythonPaths } from './session'

export type { PythonRunResult }

let session: PythonSession | null = null

export function stopPythonSession(): void {
  session?.stop()
  session = null
}

export async function runLinkedListExercise(
  paths: PythonPaths,
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

  if (!session) session = new PythonSession(paths)
  const raw = await session.run(buildPythonProgram(code, exercise.tests), execTimeoutMs)
  if (raw.error === 'TIMEOUT') session = null
  return gradePythonRun(raw)
}
