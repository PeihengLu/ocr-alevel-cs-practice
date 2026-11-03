export interface SqlChapter {
  id: string
  title: string
  summary: string
  /** Key into the shipped SQL assets (filename under samples/sql-basics/sql). */
  schemaRef: string
  questionIds: string[]
}

/** SQL practice chapters, in the order a student meets them. */
export const SQL_CHAPTERS: SqlChapter[] = [
  {
    id: 'select',
    title: 'SELECT and FROM',
    summary: 'Read columns from a table. The * wildcard means every column.',
    schemaRef: 'school_basics',
    questionIds: ['basics-select-all', 'basics-select-columns']
  },
  {
    id: 'where',
    title: 'WHERE',
    summary:
      'Keep the rows that match. Combine tests with AND and OR, and match text with LIKE and %.',
    schemaRef: 'school_basics',
    questionIds: [
      'basics-where-equals',
      'basics-where-and',
      'basics-where-or',
      'basics-like'
    ]
  },
  {
    id: 'combine',
    title: 'Nested SELECT and JOIN',
    summary:
      'A nested SELECT is a query inside another query. JOIN matches rows from two tables.',
    schemaRef: 'school_basics',
    questionIds: ['basics-nested-select', 'basics-join']
  },
  {
    id: 'change',
    title: 'INSERT, DELETE, and DROP',
    summary:
      'Add a row, remove rows, or remove a table. Each question starts from a fresh copy of the schema.',
    schemaRef: 'school_basics',
    questionIds: ['basics-insert', 'basics-delete', 'basics-drop']
  }
]

export function sqlChapterForQuestion(questionId: string): SqlChapter | undefined {
  return SQL_CHAPTERS.find((chapter) => chapter.questionIds.includes(questionId))
}
