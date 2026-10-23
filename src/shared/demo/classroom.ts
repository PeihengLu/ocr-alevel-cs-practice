/**
 * Built-in classroom demo dataset + lesson steps.
 * Teacher Demo projects these live — not pack authoring.
 */

export const CLASSROOM_DEMO_ID = '__classroom_demo__'

export const CLASSROOM_SEED_SQL = `-- Classroom demo: school roster (same as sql-basics)
CREATE TABLE students (
  id INT PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  year_group INT NOT NULL,
  house VARCHAR(32) NOT NULL,
  maths_score INT NOT NULL
);

INSERT INTO students (id, name, year_group, house, maths_score) VALUES
  (1, 'Amina', 12, 'Red', 78),
  (2, 'Ben', 13, 'Blue', 64),
  (3, 'Cara', 12, 'Green', 91),
  (4, 'Dev', 12, 'Red', 55),
  (5, 'Elena', 13, 'Blue', 88),
  (6, 'Farah', 11, 'Green', 72);
`

export interface ClassroomSchemaColumn {
  name: string
  type: string
  notes?: string
}

export interface ClassroomSchemaTable {
  name: string
  columns: ClassroomSchemaColumn[]
}

export const CLASSROOM_SCHEMA: ClassroomSchemaTable[] = [
  {
    name: 'students',
    columns: [
      { name: 'id', type: 'INT', notes: 'primary key' },
      { name: 'name', type: 'VARCHAR(64)' },
      { name: 'year_group', type: 'INT', notes: 'e.g. 11, 12, 13' },
      { name: 'house', type: 'VARCHAR(32)', notes: 'Red / Blue / Green' },
      { name: 'maths_score', type: 'INT', notes: '0–100' }
    ]
  }
]

export interface ClassroomLessonStep {
  id: string
  label: string
  title: string
  say: string
  sql: string
}

/** Click-through script for a projected lesson. */
export const CLASSROOM_LESSON: ClassroomLessonStep[] = [
  {
    id: 'select-star',
    label: 'SELECT *',
    title: 'See the whole table',
    say: 'SELECT * returns every column for every row in students.',
    sql: 'SELECT * FROM students;'
  },
  {
    id: 'select-cols',
    label: 'Columns',
    title: 'Pick specific columns',
    say: 'List only the columns you need — here name and house.',
    sql: 'SELECT name, house FROM students;'
  },
  {
    id: 'where-eq',
    label: 'WHERE =',
    title: 'Filter with WHERE',
    say: 'WHERE keeps rows that match a condition. Year group 12 only.',
    sql: 'SELECT name, year_group\nFROM students\nWHERE year_group = 12;'
  },
  {
    id: 'where-or',
    label: 'AND / OR',
    title: 'Combine conditions',
    say: 'OR widens the filter: year 13, or a maths score of at least 90.',
    sql: 'SELECT name, year_group, maths_score\nFROM students\nWHERE year_group = 13 OR maths_score >= 90;'
  },
  {
    id: 'order-asc',
    label: 'ORDER BY ↑',
    title: 'Sort ascending',
    say: 'ORDER BY sorts the result. ASC is A→Z (or small→large).',
    sql: 'SELECT name\nFROM students\nORDER BY name ASC;'
  },
  {
    id: 'order-desc',
    label: 'ORDER BY ↓',
    title: 'Sort descending',
    say: 'DESC reverses the order — highest maths scores first.',
    sql: 'SELECT name, maths_score\nFROM students\nORDER BY maths_score DESC;'
  },
  {
    id: 'limit',
    label: 'LIMIT',
    title: 'Keep the top rows',
    say: 'LIMIT takes only the first N rows after sorting — top 3 scores.',
    sql: 'SELECT name, maths_score\nFROM students\nORDER BY maths_score DESC\nLIMIT 3;'
  },
  {
    id: 'count',
    label: 'COUNT',
    title: 'Count the rows',
    say: 'COUNT(*) tells you how many rows match (here: the whole table).',
    sql: 'SELECT COUNT(*) AS student_count\nFROM students;'
  },
  {
    id: 'distinct',
    label: 'DISTINCT',
    title: 'Unique values',
    say: 'DISTINCT removes duplicates — each house once.',
    sql: 'SELECT DISTINCT house\nFROM students;'
  }
]
