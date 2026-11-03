import { LINKED_LIST_EXERCISES, type PythonExercise } from './linkedList.ts'
import {
  DECIDE_EXERCISES,
  FACT_EXERCISES,
  NESTED_EXERCISES,
  PLACE_EXERCISES,
  TEXT_EXERCISES,
  UNTIL_EXERCISES,
  WALK_EXERCISES
} from './solving.ts'

export type { PythonExercise }

/** Basics and data structures share one progress store. The track only chooses which chapters a panel shows. */
export type PythonTrack = 'basics' | 'structures'

export interface PythonChapter {
  id: string
  title: string
  summary: string
  track: PythonTrack
  exercises: PythonExercise[]
}

/** Practice chapters, in the order a student meets them. */
export const PYTHON_CHAPTERS: PythonChapter[] = [
  {
    id: 'one-at-a-time',
    title: 'Iteration',
    track: 'basics',
    summary:
      'A loop looks at one value, then the next. Remember a result outside the loop, and update it on each visit.',
    exercises: WALK_EXERCISES
  },
  {
    id: 'each-value',
    title: 'Conditional iteration',
    track: 'basics',
    summary:
      'Inside the loop, ask one yes-or-no question. Count a match, keep a value, or stop once you know.',
    exercises: DECIDE_EXERCISES
  },
  {
    id: 'one-fact',
    title: 'Aggregation',
    track: 'basics',
    summary:
      'Remember a single value as you go: the last, the biggest, or the smallest. An empty list has no value to start from.',
    exercises: FACT_EXERCISES
  },
  {
    id: 'the-place',
    title: 'Indexing',
    track: 'basics',
    summary:
      'Sometimes you need the position, not only the value. Keep an index and move it one place at a time.',
    exercises: PLACE_EXERCISES
  },
  {
    id: 'text',
    title: 'String processing',
    track: 'basics',
    summary:
      'A string is a sequence of characters. Counting, keeping, and checking neighbors work the same way as on a list.',
    exercises: TEXT_EXERCISES
  },
  {
    id: 'until',
    title: 'Stopping criteria',
    track: 'basics',
    summary:
      'When there is no list to walk, a while loop repeats until a condition fails. Each pass has to move toward that end.',
    exercises: UNTIL_EXERCISES
  },
  {
    id: 'nested',
    title: 'Nested iteration',
    track: 'basics',
    summary:
      'The outer loop picks one value and holds it. The inner loop walks a whole other sequence before the outer loop moves on.',
    exercises: NESTED_EXERCISES
  },
  {
    id: 'linked-list',
    title: 'Linked lists',
    track: 'structures',
    summary:
      'A node holds a value and a link. Build the list class, then insert, search, delete, and count by walking those links.',
    exercises: LINKED_LIST_EXERCISES
  }
]

export function chaptersForTrack(track: PythonTrack): PythonChapter[] {
  return PYTHON_CHAPTERS.filter((chapter) => chapter.track === track)
}

export function findPythonExercise(id: string): PythonExercise | undefined {
  for (const chapter of PYTHON_CHAPTERS) {
    const found = chapter.exercises.find((item) => item.id === id)
    if (found) return found
  }
  return undefined
}

export function chapterForExercise(id: string): PythonChapter | undefined {
  return PYTHON_CHAPTERS.find((chapter) =>
    chapter.exercises.some((item) => item.id === id)
  )
}
