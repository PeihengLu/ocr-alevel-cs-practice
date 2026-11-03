import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react'
import schoolBasicsSql from '../../../../samples/sql-basics/sql/school_basics.sql?raw'
import { CodeEditor } from '../components/CodeEditor'
import { ResultGrid } from '../components/ResultGrid'
import { compareNumberedTitles } from '../../../shared/order'
import { SQL_CHAPTERS, type SqlChapter } from '../../../shared/sql/chapters'
import type {
  QueryRunResult,
  QuestionProgressStatus,
  QuestionSummary,
  StorageStatus
} from '../pack'

const BUILTIN_SCHEMAS: Record<string, string> = {
  school_basics: schoolBasicsSql
}

type StatusFilter = 'all' | QuestionProgressStatus

const STATUS_LABEL: Record<QuestionProgressStatus, string> = {
  unseen: 'Not attempted',
  attempted: 'Attempted',
  passed: 'Passed'
}

const STATUS_ICON: Record<QuestionProgressStatus, string> = {
  unseen: '○',
  attempted: '◐',
  passed: '✓'
}

export function StudentPractice(): ReactElement {
  const [status, setStatus] = useState<StorageStatus | null>(null)
  const [summaries, setSummaries] = useState<QuestionSummary[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [runResult, setRunResult] = useState<QueryRunResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [focusMode, setFocusMode] = useState(false)
  const [chapterId, setChapterId] = useState(SQL_CHAPTERS[0]?.id ?? '')
  const [schemaText, setSchemaText] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const selected =
    summaries.find((s) => s.question.id === selectedId)?.question ?? null
  const selectedProgress =
    summaries.find((s) => s.question.id === selectedId)?.progress ?? null

  const chapters = useMemo(() => chaptersFromSummaries(summaries), [summaries])
  const chapter = chapters.find((item) => item.id === chapterId) ?? chapters[0] ?? null

  const visible = useMemo(() => {
    const inChapter = questionsForChapter(chapter, summaries)
    if (filter === 'all') return inChapter
    return inChapter.filter((item) => item.progress.status === filter)
  }, [chapter, summaries, filter])

  const schemaRef = chapter?.schemaRef ?? null

  const refresh = useCallback(async () => {
    const api = window.portableLeetcode
    if (!api?.listQuestionSummaries || !api.getStorageStatus) {
      setLoadError(
        'This page cannot reach the question bank. Use the PortableLeetcode window.'
      )
      setLoaded(true)
      return
    }
    try {
      const [nextStatus, list] = await Promise.all([
        api.getStorageStatus(),
        api.listQuestionSummaries()
      ])
      setStatus(nextStatus)
      setSummaries(list)
      setLoadError(null)
      setSelectedId((prev) => {
        if (prev && list.some((s) => s.question.id === prev)) return prev
        return list[0]?.question.id ?? null
      })
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoaded(true)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    const question = summaries.find((item) => item.question.id === selectedId)?.question
    setQuery(question ? question.starterQuery : '')
    setRunResult(null)
    // Reload the starter only when the student opens a different question.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  useEffect(() => {
    if (!schemaRef) {
      setSchemaText(null)
      return
    }
    setSchemaText(BUILTIN_SCHEMAS[schemaRef] ?? null)
    const api = window.portableLeetcode
    if (!api?.getSqlAsset) return
    let cancel = false
    void api.getSqlAsset(schemaRef).then((sql) => {
      if (!cancel && sql) setSchemaText(sql)
    })
    return () => {
      cancel = true
    }
  }, [schemaRef])

  useEffect(() => {
    if (!selectedId) return
    const owner = chapters.find((item) => item.questionIds.includes(selectedId))
    if (owner) setChapterId(owner.id)
  }, [selectedId, chapters])

  function openChapter(nextChapterId: string): void {
    const next = chapters.find((item) => item.id === nextChapterId)
    if (!next) return
    setChapterId(next.id)
    if (selectedId && next.questionIds.includes(selectedId)) return
    const first = questionsForChapter(next, summaries)[0]
    if (first) setSelectedId(first.question.id)
  }

  useEffect(() => {
    if (!focusMode) return
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        e.preventDefault()
        setFocusMode(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [focusMode])

  async function onRun(): Promise<void> {
    if (!selected) return
    setBusy(true)
    try {
      const result = await window.portableLeetcode.runQuery(selected.id, query)
      setRunResult(result)
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className={focusMode ? 'shell practice-focus' : 'shell'}>
      {!focusMode && status && (
        <p className="status-line" role="status">
          Storage: <strong>{status.backend}</strong>
          {status.sqliteReady
            ? ' · SQLite ready for Run Query'
            : ' · SQLite failed to load'}
          {' — '}
          {status.message}
        </p>
      )}
      <div className={focusMode ? 'practice-grid focus-layout' : 'practice-grid'}>
        {!focusMode && (
          <>
            <article className="panel">
              <h2>Chapters</h2>
              <ul className="chapter-list">
                {chapters.map((item) => {
                  const open = item.id === chapter?.id
                  const questions = questionsForChapter(item, summaries)
                  const passed = questions.filter(
                    (entry) => entry.progress.status === 'passed'
                  ).length
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        className={open ? 'chapter-item active' : 'chapter-item'}
                        aria-current={open ? 'true' : undefined}
                        onClick={() => openChapter(item.id)}
                      >
                        <span className="chapter-item-row">
                          <span className="q-title">{item.title}</span>
                          <span className="chapter-count">
                            {passed}/{questions.length || item.questionIds.length}
                          </span>
                        </span>
                      </button>
                      {open && <p className="chapter-summary">{item.summary}</p>}
                    </li>
                  )
                })}
              </ul>
            </article>

            <article className="panel question-list-panel">
              <h2>Questions</h2>
              <div className="status-filter" role="group" aria-label="Filter by status">
                {(
                  [
                    ['all', 'All'],
                    ['unseen', 'Not attempted'],
                    ['attempted', 'Attempted'],
                    ['passed', 'Passed']
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={
                      filter === value ? 'filter-chip active' : 'filter-chip'
                    }
                    onClick={() => setFilter(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {visible.length === 0 ? (
                <p className="muted">
                  {!loaded
                    ? 'Loading questions…'
                    : loadError
                      ? loadError
                      : summaries.length === 0
                        ? 'No questions loaded. Restart the app if this build should include them.'
                        : 'No questions in this chapter match this filter.'}
                </p>
              ) : (
                <ul className="question-list">
                  {visible.map(({ question: q, progress }) => (
                    <li key={q.id}>
                      <button
                        type="button"
                        className={
                          q.id === selectedId
                            ? 'question-item active'
                            : 'question-item'
                        }
                        onClick={() => setSelectedId(q.id)}
                      >
                        <span className="q-title-row">
                          <ProgressBadge status={progress.status} />
                          <span className="q-title">{q.title}</span>
                        </span>
                        <span className="q-meta">
                          {q.difficulty}
                          {progress.attemptCount > 0
                            ? ` · ${progress.attemptCount} try${progress.attemptCount === 1 ? '' : 'ies'}`
                            : ''}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </>
        )}

        <article
          className={
            focusMode ? 'panel runner-panel focus-runner' : 'panel runner-panel'
          }
        >
          <div className="runner-toolbar">
            <div>
              {chapter && <p className="eyebrow">{chapter.title}</p>}
              <h2>{selected ? selected.title : 'Open a question'}</h2>
            </div>
            <div className="btn-row toolbar-actions">
              {selectedProgress && (
                <ProgressBadge status={selectedProgress.status} />
              )}
              {focusMode ? (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setFocusMode(false)}
                >
                  Exit focus (Esc)
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={!selected}
                  onClick={() => setFocusMode(true)}
                  title="Expand editor and results"
                >
                  Focus editor
                </button>
              )}
            </div>
          </div>

          {!focusMode && schemaText && (
            <section className="schema-block" aria-label="Schema for this chapter">
              <h3>Schema</h3>
              <pre className="schema-view">{schemaText.trim()}</pre>
            </section>
          )}

          {selected ? (
            <>
              {!focusMode && (
                <>
                  <p className="prompt">{selected.prompt}</p>
                  {selected.tags.length > 0 && (
                    <p className="muted tags">{selected.tags.join(' · ')}</p>
                  )}
                </>
              )}
              {focusMode && (
                <p className="focus-hint muted">
                  Focus mode — editor and results fill the window. Press Esc or
                  Exit focus to restore the list.
                </p>
              )}
              <label className="field-label" htmlFor="student-sql">
                {queryLabel(selected)}
              </label>
              <CodeEditor
                id="student-sql"
                className={focusMode ? 'code-input focus-editor' : 'code-input'}
                language="sql"
                rows={focusMode ? 16 : 8}
                value={query}
                onChange={setQuery}
              />
              <div className="btn-row">
                <button
                  type="button"
                  className="btn"
                  disabled={busy}
                  onClick={() => void onRun()}
                >
                  Run query
                </button>
              </div>

              {runResult && (
                <div className="run-outcome">
                  <p
                    className={
                      runResult.ok && runResult.passed
                        ? 'pass-banner'
                        : 'fail-banner'
                    }
                    role="status"
                  >
                    {runResult.message}
                  </p>
                  {runResult.checks && runResult.checks.length > 0 && (
                    <ul className="check-list">
                      {runResult.checks.map((c) => (
                        <li
                          key={c.index}
                          className={c.passed ? 'check-pass' : 'check-fail'}
                        >
                          {c.passed ? '✓' : '✗'} {c.detail}
                        </li>
                      ))}
                    </ul>
                  )}
                  {runResult.result && (
                    <>
                      <h3 className="result-heading">
                        {selected.statement
                          ? 'Database after your statement'
                          : 'Result'}
                      </h3>
                      <ResultGrid result={runResult.result} />
                    </>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="muted">Select a question from the list.</p>
          )}
        </article>
      </div>
    </section>
  )
}

function chaptersFromSummaries(summaries: QuestionSummary[]): SqlChapter[] {
  const assigned = new Set(SQL_CHAPTERS.flatMap((chapter) => chapter.questionIds))
  const extras = new Map<string, string[]>()
  for (const item of summaries) {
    if (assigned.has(item.question.id)) continue
    const ids = extras.get(item.question.schemaRef) ?? []
    ids.push(item.question.id)
    extras.set(item.question.schemaRef, ids)
  }
  const extraChapters: SqlChapter[] = []
  extras.forEach((questionIds, schemaRef) => {
    extraChapters.push({
      id: `other-${schemaRef}`,
      title: 'Other questions',
      summary: 'Questions that are not in a chapter yet.',
      schemaRef,
      questionIds
    })
  })
  return [...SQL_CHAPTERS, ...extraChapters]
}

function questionsForChapter(
  chapter: SqlChapter | null,
  summaries: QuestionSummary[]
): QuestionSummary[] {
  if (!chapter) return []
  const byId = new Map(summaries.map((item) => [item.question.id, item]))
  const found = chapter.questionIds.flatMap((id) => {
    const item = byId.get(id)
    return item ? [item] : []
  })
  return [...found].sort((a, b) =>
    compareNumberedTitles(a.question.title, b.question.title)
  )
}

function queryLabel(question: {
  statement?: 'insert' | 'delete' | 'drop'
}): string {
  if (question.statement === 'insert') return 'Your statement (single INSERT)'
  if (question.statement === 'delete') return 'Your statement (single DELETE)'
  if (question.statement === 'drop') return 'Your statement (single DROP TABLE)'
  return 'Your query (single SELECT)'
}

function ProgressBadge({
  status
}: {
  status: QuestionProgressStatus
}): ReactElement {
  return (
    <span
      className={`progress-badge progress-${status}`}
      title={STATUS_LABEL[status]}
    >
      <span className="progress-icon" aria-hidden="true">
        {STATUS_ICON[status]}
      </span>
      <span className="progress-text">{STATUS_LABEL[status]}</span>
    </span>
  )
}
