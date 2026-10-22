import {
  PACK_FORMAT_VERSION,
  type PackManifest,
  type PackPayload,
  type SqlCheck,
  type SqlQuestion
} from './types'

export function validatePackPayload(raw: unknown): PackPayload {
  if (!isRecord(raw)) {
    throw new Error('Pack payload must be an object')
  }

  const manifest = validateManifest(raw.manifest)
  const questionsRaw = raw.questions
  if (!Array.isArray(questionsRaw)) {
    throw new Error('Pack questions must be an array')
  }

  const questions = questionsRaw.map((q, i) => validateQuestion(q, i))
  const byId = new Set(questions.map((q) => q.id))

  for (const id of manifest.questionIds) {
    if (!byId.has(id)) {
      throw new Error(`manifest.questionIds references missing question "${id}"`)
    }
  }

  const sqlAssets = validateSqlAssets(raw.sqlAssets)
  for (const q of questions) {
    if (!(q.schemaRef in sqlAssets)) {
      throw new Error(
        `Question "${q.id}" schemaRef "${q.schemaRef}" missing from sqlAssets`
      )
    }
  }

  return { manifest, questions, sqlAssets }
}

function validateManifest(raw: unknown): PackManifest {
  if (!isRecord(raw)) throw new Error('manifest.json must be an object')

  const formatVersion = raw.formatVersion
  if (formatVersion !== PACK_FORMAT_VERSION) {
    throw new Error(
      `Unsupported pack formatVersion ${String(formatVersion)} (expected ${PACK_FORMAT_VERSION})`
    )
  }

  const packId = requireString(raw, 'packId')
  const version = requireString(raw, 'version')
  const title = requireString(raw, 'title')
  const createdAt = requireString(raw, 'createdAt')
  const minAppVersion = requireString(raw, 'minAppVersion')

  const questionIds = raw.questionIds
  if (!Array.isArray(questionIds) || !questionIds.every((x) => typeof x === 'string')) {
    throw new Error('manifest.questionIds must be a string array')
  }

  const retiredIds = raw.retiredIds
  if (
    retiredIds !== undefined &&
    (!Array.isArray(retiredIds) || !retiredIds.every((x) => typeof x === 'string'))
  ) {
    throw new Error('manifest.retiredIds must be a string array when present')
  }

  const description =
    raw.description === undefined ? undefined : requireString(raw, 'description')
  const checksum =
    raw.checksum === undefined ? undefined : requireString(raw, 'checksum')

  return {
    formatVersion: PACK_FORMAT_VERSION,
    packId,
    version,
    title,
    description,
    createdAt,
    minAppVersion,
    questionIds,
    retiredIds,
    checksum
  }
}

function validateQuestion(raw: unknown, index: number): SqlQuestion {
  if (!isRecord(raw)) {
    throw new Error(`questions[${index}] must be an object`)
  }

  const id = requireString(raw, 'id')
  const version = raw.version
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    throw new Error(`questions[${index}].version must be a positive integer`)
  }

  const difficulty = raw.difficulty
  if (difficulty !== 'easy' && difficulty !== 'medium' && difficulty !== 'hard') {
    throw new Error(`questions[${index}].difficulty must be easy|medium|hard`)
  }

  const tags = raw.tags
  if (!Array.isArray(tags) || !tags.every((t) => typeof t === 'string')) {
    throw new Error(`questions[${index}].tags must be a string array`)
  }

  const checksRaw = raw.checks
  if (!Array.isArray(checksRaw)) {
    throw new Error(`questions[${index}].checks must be an array`)
  }
  const checks = checksRaw.map((c, ci) => validateCheck(c, index, ci))

  const solutionQuery =
    raw.solutionQuery === undefined
      ? undefined
      : requireString(raw, 'solutionQuery')

  return {
    id,
    version,
    title: requireString(raw, 'title'),
    prompt: requireString(raw, 'prompt'),
    starterQuery: requireString(raw, 'starterQuery'),
    solutionQuery,
    checks,
    tags,
    difficulty,
    schemaRef: requireString(raw, 'schemaRef')
  }
}

function validateCheck(raw: unknown, qi: number, ci: number): SqlCheck {
  if (!isRecord(raw) || typeof raw.type !== 'string') {
    throw new Error(`questions[${qi}].checks[${ci}] must have a type`)
  }

  if (raw.type === 'result_set') {
    if (!Array.isArray(raw.expected)) {
      throw new Error(`questions[${qi}].checks[${ci}].expected must be an array`)
    }
    const ordered = raw.ordered
    if (ordered !== undefined && typeof ordered !== 'boolean') {
      throw new Error(`questions[${qi}].checks[${ci}].ordered must be a boolean`)
    }
    return {
      type: 'result_set',
      expected: raw.expected as Record<string, unknown>[],
      ordered
    }
  }

  if (raw.type === 'row_count') {
    if (typeof raw.expected !== 'number') {
      throw new Error(`questions[${qi}].checks[${ci}].expected must be a number`)
    }
    return { type: 'row_count', expected: raw.expected }
  }

  if (raw.type === 'columns') {
    if (
      !Array.isArray(raw.expected) ||
      !raw.expected.every((c) => typeof c === 'string')
    ) {
      throw new Error(
        `questions[${qi}].checks[${ci}].expected must be a string array`
      )
    }
    return { type: 'columns', expected: raw.expected }
  }

  throw new Error(`questions[${qi}].checks[${ci}]: unknown type "${raw.type}"`)
}

function validateSqlAssets(raw: unknown): Record<string, string> {
  if (!isRecord(raw)) {
    throw new Error('sqlAssets must be an object map of schemaRef → SQL')
  }
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value !== 'string') {
      throw new Error(`sqlAssets["${key}"] must be a string`)
    }
    out[key] = value
  }
  return out
}

function requireString(obj: Record<string, unknown>, key: string): string {
  const v = obj[key]
  if (typeof v !== 'string' || v.trim() === '') {
    throw new Error(`Missing or empty string field "${key}"`)
  }
  return v
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}
