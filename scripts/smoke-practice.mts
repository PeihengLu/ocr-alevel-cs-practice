/**
 * Lightweight smoke tests for sanitize + compare (no MySQL required).
 *   node --experimental-strip-types scripts/smoke-practice.mts
 */
import assert from 'node:assert/strict'
import { assertSafeSelect } from '../src/main/practice/sanitize.ts'
import { evaluateChecks, toGrid } from '../src/main/practice/compare.ts'

assert.equal(assertSafeSelect('SELECT * FROM students;'), 'SELECT * FROM students')
assert.equal(
  assertSafeSelect("SELECT name FROM students ORDER BY name DESC"),
  'SELECT name FROM students ORDER BY name DESC'
)
assert.throws(() => assertSafeSelect('SELECT 1; DROP TABLE students'), /single/)
assert.throws(() => assertSafeSelect('DELETE FROM students'), /SELECT/)
assert.equal(
  assertSafeSelect("SELECT * FROM t WHERE x = 'DROP'"),
  "SELECT * FROM t WHERE x = 'DROP'"
)

const grid = toGrid(
  ['name', 'house'],
  [
    { name: 'Amina', house: 'Red' },
    { name: 'Ben', house: 'Blue' }
  ]
)

const unordered = evaluateChecks(grid, [
  {
    type: 'result_set',
    ordered: false,
    expected: [
      { house: 'Blue', name: 'Ben' },
      { house: 'Red', name: 'Amina' }
    ]
  }
])
assert.equal(unordered[0].passed, true)

const orderedFail = evaluateChecks(grid, [
  {
    type: 'result_set',
    ordered: true,
    expected: [
      { name: 'Ben', house: 'Blue' },
      { name: 'Amina', house: 'Red' }
    ]
  }
])
assert.equal(orderedFail[0].passed, false)

const countGrid = toGrid(['COUNT(*)'], [{ 'COUNT(*)': 6 }])
const countOk = evaluateChecks(countGrid, [
  { type: 'result_set', expected: [{ total: 6 }] }
])
assert.equal(countOk[0].passed, true)

console.log('smoke-practice: ok')
