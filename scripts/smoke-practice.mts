/**
 * Lightweight smoke tests for sanitize + compare.
 *   node --experimental-strip-types scripts/smoke-practice.mts
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { evaluateChecks, toGrid } from '../src/main/practice/compare.ts'
import { assertPracticeStatement, assertSafeSelect } from '../src/main/practice/sanitize.ts'
import { compareNumberedTitles } from '../src/shared/order.ts'
import { SQL_CHAPTERS } from '../src/shared/sql/chapters.ts'

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
assert.equal(
  assertPracticeStatement(
    "INSERT INTO students (id, name) VALUES (7, 'DROP');",
    'insert'
  ),
  "INSERT INTO students (id, name) VALUES (7, 'DROP')"
)
assert.throws(
  () => assertPracticeStatement('DROP DATABASE students', 'drop'),
  /DROP TABLE/
)
assert.throws(
  () => assertPracticeStatement('DELETE FROM portable_leetcode.questions', 'delete'),
  /outside this exercise/
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

const catalogRoot = join(process.cwd(), 'samples', 'sql-basics')
const catalogManifest = JSON.parse(
  readFileSync(join(catalogRoot, 'manifest.json'), 'utf8')
) as { questionIds: string[] }
assert.equal(catalogManifest.questionIds.length, 11)
assert.ok(catalogManifest.questionIds.includes('basics-select-all'))
const selectAll = JSON.parse(
  readFileSync(join(catalogRoot, 'questions', 'basics-select-all.json'), 'utf8')
) as { version: number }
assert.equal(selectAll.version, 3)
assert.match(
  readFileSync(join(catalogRoot, 'sql', 'school_basics.sql'), 'utf8'),
  /CREATE TABLE students/
)

const catalogTitles = catalogManifest.questionIds.map((id) => {
  const question = JSON.parse(
    readFileSync(join(catalogRoot, 'questions', `${id}.json`), 'utf8')
  ) as { title: string }
  return question.title
})
const numberOf = (title: string): number => Number(/^(\d+)/.exec(title)?.[1])
const alphabetical = [...catalogTitles].sort((a, b) => a.localeCompare(b))
const numbered = [...catalogTitles].sort(compareNumberedTitles)
assert.deepEqual(numbered.map(numberOf), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
assert.ok(
  alphabetical.findIndex((title) => numberOf(title) === 11) <
    alphabetical.findIndex((title) => numberOf(title) === 2)
)
assert.ok(compareNumberedTitles('9. Count the nodes', '10. Next exercise') < 0)

const chapterIds = SQL_CHAPTERS.flatMap((chapter) => chapter.questionIds)
assert.deepEqual([...chapterIds].sort(), [...catalogManifest.questionIds].sort())
assert.equal(new Set(chapterIds).size, chapterIds.length)
for (const chapter of SQL_CHAPTERS) {
  for (const id of chapter.questionIds) {
    const question = JSON.parse(
      readFileSync(join(catalogRoot, 'questions', `${id}.json`), 'utf8')
    ) as { schemaRef: string }
    assert.equal(question.schemaRef, chapter.schemaRef, id)
  }
  assert.match(
    readFileSync(join(catalogRoot, 'sql', `${chapter.schemaRef}.sql`), 'utf8'),
    /CREATE TABLE/
  )
}

console.log('smoke-practice: ok')
