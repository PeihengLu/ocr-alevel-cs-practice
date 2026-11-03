/**
 * Runs every Python chapter solution and starter in Pyodide.
 *   node --experimental-strip-types scripts/smoke-python.mts
 */
import assert from 'node:assert/strict'
import { join } from 'node:path'
import { PythonSession } from '../src/main/python/session.ts'
import { findPythonExercise, PYTHON_CHAPTERS } from '../src/shared/python/chapters.ts'
import { LINKED_LIST_EXERCISES } from '../src/shared/python/linkedList.ts'
import { LINKED_LIST_SOLUTIONS } from '../src/shared/python/linkedList.solutions.ts'
import { SOLVING_SOLUTIONS } from '../src/shared/python/solving.solutions.ts'
import { buildPythonProgram, gradePythonRun } from '../src/shared/python/report.ts'

const SOLUTIONS: Record<string, string> = {
  ...SOLVING_SOLUTIONS,
  ...LINKED_LIST_SOLUTIONS
}

const session = new PythonSession({
  execPath: process.execPath,
  runnerPath: join(process.cwd(), 'src/main/python/python-run.mjs'),
  pyodideDir: join(process.cwd(), 'node_modules/pyodide')
})

async function run(id: string, code: string, timeoutMs = 4000) {
  const exercise = findPythonExercise(id)
  assert.ok(exercise, id)
  const raw = await session.run(buildPythonProgram(code, exercise.tests), timeoutMs)
  if (raw.error === 'TIMEOUT') {
    session.stop()
  }
  return gradePythonRun(raw)
}

try {
  assert.equal(PYTHON_CHAPTERS[0]?.id, 'one-at-a-time')
  const linkedList = PYTHON_CHAPTERS.find((chapter) => chapter.id === 'linked-list')
  assert.ok(linkedList, 'missing linked-list chapter')
  assert.deepEqual(
    linkedList.exercises.map((item) => item.id),
    LINKED_LIST_EXERCISES.map((item) => item.id)
  )

  const exercises = PYTHON_CHAPTERS.flatMap((chapter) => chapter.exercises)
  for (const exercise of exercises) {
    const solution = SOLUTIONS[exercise.id]
    assert.ok(solution, `missing solution for ${exercise.id}`)
    const result = await run(exercise.id, solution)
    assert.equal(
      result.passed,
      true,
      `${exercise.id} solution: ${result.message}\n${result.error ?? ''}\n${result.checks
        .map((check) => `${check.passed ? 'ok' : 'FAIL'} ${check.name} ${check.detail}`)
        .join('\n')}`
    )

    const starter = await run(exercise.id, exercise.starterCode)
    assert.equal(starter.error, undefined, `${exercise.id} starter crashed:\n${starter.error}`)
    assert.ok(starter.checks.length > 0, `${exercise.id} starter ran no checks`)
    assert.equal(starter.passed, false, `${exercise.id} starter should not pass`)
  }

  const hung = await run('ll-node', 'while True:\n    pass\n', 1200)
  assert.match(hung.message, /too long/)

  const again = await run('ll-length', LINKED_LIST_SOLUTIONS['ll-length'] ?? '')
  assert.equal(again.passed, true, again.message)
  console.log('smoke-python: ok')
} finally {
  session.stop()
}
