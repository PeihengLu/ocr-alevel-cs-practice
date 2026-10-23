import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react'
import { ResultGrid } from '../components/ResultGrid'
import { importPack } from '../pack'
import type {
  QueryRunResult,
  QuestionProgressStatus,
  QuestionSummary,
  StorageStatus
} from '../pack'

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
  const [flash, setFlash] = useState<string | null>(null)
  const [runResult, setRunResult] = useState<QueryRunResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [focusMode, setFocusMode] = useState(false)

  const selected =
    summaries.find((s) => s.question.id === selectedId)?.question ?? null
  const selectedProgress =
    summaries.find((s) => s.question.id === selectedId)?.progress ?? null

  const visible = useMemo(() => {
    if (filter === 'all') return summaries
    return summaries.filter((s) => s.progress.status === filter)
  }, [summaries, filter])

  const refresh = useCallback(async () => {
    const api = window.portableLeetcode
    const [nextStatus, list] = await Promise.all([
      api.getStorageStatus(),
      api.listQuestionSummaries()
    ])
    setStatus(nextStatus)
    setSummaries(list)
    setSelectedId((prev) => {
      if (prev && list.some((s) => s.question.id === prev)) return prev
      return list[0]?.question.id ?? null
    })
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (selected) setQuery(selected.starterQuery)
    else setQuery('')
    setRunResult(null)
  }, [selected])

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

  async function onImport(): Promise<void> {
    setBusy(true)
    setFlash(null)
    try {
      const result = await importPack()
      if (!result.ok) {
        setFlash(result.error)
        return
      }
      setFlash(
        `Imported “${result.pack.manifest.title}”: ${result.merged} merged, ${result.skipped} skipped, ${result.retired} retired (${result.storage}).`
      )
      await refresh()
    } finally {
      setBusy(false)
    }
  }

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
      {!focusMode && (
        <header className="shell-header">
          <p className="eyebrow">Student</p>
          <h1>Practice</h1>
          <p className="lede">
            Import a <code>.plpack</code>, open a question, and run a single{' '}
            <code>SELECT</code>. Status badges show Not attempted / Attempted /
            Passed (once passed, it stays passed).
          </p>
        </header>
      )}

      {!focusMode && status && (
        <p className="status-line" role="status">
          Storage: <strong>{status.backend}</strong>
          {status.mysqlConnected
            ? ' · MySQL ready for Run Query'
            : ' · MySQL offline (Run Query needs local MySQL)'}
          {' — '}
          {status.message}
        </p>
      )}
      {!focusMode && flash && (
        <p className="flash" role="status">
          {flash}
        </p>
      )}

      <div className={focusMode ? 'practice-grid focus-layout' : 'practice-grid'}>
        {!focusMode && (
          <>
            <article className="panel">
              <h2>Packs</h2>
              <p>
                Try <code>samples/sql-basics.plpack</code> for absolute beginners.
              </p>
              <button
                type="button"
                className="btn"
                disabled={busy}
                onClick={() => void onImport()}
              >
                Import .plpack…
              </button>
            </article>

            <article className="panel question-list-panel">
              <h2>Questions ({summaries.length})</h2>
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
                  {summaries.length === 0
                    ? 'No questions yet — import a pack to start.'
                    : 'No questions match this filter.'}
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
            <h2>{selected ? selected.title : 'Open a question'}</h2>
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

          {selected ? (
            <>
              {!focusMode && (
                <>
                  <p className="prompt">{selected.prompt}</p>
                  <p className="muted tags">
                    {selected.tags.join(' · ') || 'untagged'} · schema{' '}
                    <code>{selected.schemaRef}</code>
                  </p>
                </>
              )}
              {focusMode && (
                <p className="focus-hint muted">
                  Focus mode — editor and results fill the window. Press Esc or
                  Exit focus to restore the list.
                </p>
              )}
              <label className="field-label" htmlFor="student-sql">
                Your query (single SELECT only)
              </label>
              <textarea
                id="student-sql"
                className={focusMode ? 'code-input focus-editor' : 'code-input'}
                rows={focusMode ? 16 : 8}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                spellCheck={false}
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
                      <h3 className="result-heading">Result</h3>
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
