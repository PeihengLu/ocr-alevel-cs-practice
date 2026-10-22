import { useCallback, useEffect, useState, type ReactElement } from 'react'
import { ResultGrid } from '../components/ResultGrid'
import { importPack } from '../pack'
import type { QueryRunResult, SqlQuestion, StorageStatus } from '../pack'

export function StudentPractice(): ReactElement {
  const [status, setStatus] = useState<StorageStatus | null>(null)
  const [questions, setQuestions] = useState<SqlQuestion[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [flash, setFlash] = useState<string | null>(null)
  const [runResult, setRunResult] = useState<QueryRunResult | null>(null)
  const [busy, setBusy] = useState(false)

  const selected = questions.find((q) => q.id === selectedId) ?? null

  const refresh = useCallback(async () => {
    const api = window.portableLeetcode
    const [nextStatus, list] = await Promise.all([
      api.getStorageStatus(),
      api.listQuestions()
    ])
    setStatus(nextStatus)
    setQuestions(list)
    setSelectedId((prev) => {
      if (prev && list.some((q) => q.id === prev)) return prev
      return list[0]?.id ?? null
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
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="shell">
      <header className="shell-header">
        <p className="eyebrow">Student</p>
        <h1>Practice</h1>
        <p className="lede">
          Import a <code>.plpack</code>, open a question, and run a single{' '}
          <code>SELECT</code> against the exercise MySQL schema. Results are
          checked for pass/fail.
        </p>
      </header>

      {status && (
        <p className="status-line" role="status">
          Storage: <strong>{status.backend}</strong>
          {status.mysqlConnected ? ' · MySQL ready for Run Query' : ' · MySQL offline (Run Query needs Docker/local MySQL)'}
          {' — '}
          {status.message}
        </p>
      )}
      {flash && (
        <p className="flash" role="status">
          {flash}
        </p>
      )}

      <div className="practice-grid">
        <article className="panel">
          <h2>Packs</h2>
          <p>
            Try <code>samples/sql-basics.plpack</code> for absolute beginners.
          </p>
          <button type="button" className="btn" disabled={busy} onClick={() => void onImport()}>
            Import .plpack…
          </button>
        </article>

        <article className="panel question-list-panel">
          <h2>Questions ({questions.length})</h2>
          {questions.length === 0 ? (
            <p className="muted">No questions yet — import a pack to start.</p>
          ) : (
            <ul className="question-list">
              {questions.map((q) => (
                <li key={q.id}>
                  <button
                    type="button"
                    className={
                      q.id === selectedId ? 'question-item active' : 'question-item'
                    }
                    onClick={() => setSelectedId(q.id)}
                  >
                    <span className="q-title">{q.title}</span>
                    <span className="q-meta">
                      {q.difficulty} · v{q.version}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="panel runner-panel">
          <h2>{selected ? selected.title : 'Open a question'}</h2>
          {selected ? (
            <>
              <p className="prompt">{selected.prompt}</p>
              <p className="muted tags">
                {selected.tags.join(' · ') || 'untagged'} · schema{' '}
                <code>{selected.schemaRef}</code>
              </p>
              <label className="field-label" htmlFor="student-sql">
                Your query (single SELECT only)
              </label>
              <textarea
                id="student-sql"
                className="code-input"
                rows={8}
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
                        <li key={c.index} className={c.passed ? 'check-pass' : 'check-fail'}>
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
