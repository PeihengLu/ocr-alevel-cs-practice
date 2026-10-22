export type Edition = 'student' | 'teacher'

/** Build-time edition — set via VITE_EDITION / EDITION in npm scripts. */
export const EDITION: Edition =
  import.meta.env.VITE_EDITION === 'teacher' ? 'teacher' : 'student'

export const isTeacher = EDITION === 'teacher'
export const isStudent = EDITION === 'student'
