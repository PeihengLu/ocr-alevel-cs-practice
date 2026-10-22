import { useCallback, useEffect, useState, type ReactElement } from 'react'
import { ResultGrid } from '../components/ResultGrid'
import type { QueryRunResult, SqlQuestion, StorageStatus } from '../pack'

export function TeacherDemo(): ReactElement {
  const [status, setStatus] = useState<StorageStatus | null>(null)
  const [questions, setQuestions] = useState<SqlQuestion[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sql, setSql] = useState('')
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
    if (!selected) {
      setSql('')
      setRunResult(null)
      return
    }
    setSql(selected.solutionQuery || selected.starterQuery)
    setRunResult(null)
  }, [selected])

  async function onShowSolution(): Promise<void> {
    if (!selected) return
    setSql(selected.solutionQuery || selected.starterQuery)
  }

  async function onRunDemo(): Promise<void> {
    if (!selected) return
    setBusy(true)
    try {
      const result = await window.portableLeetcode.runDemo(selected.id, sql)
      setRunResult(result)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="shell">
      <header className="shell-header">
        <p className="eyebrow">Teacher</p>
        <h1>Classroom demo</h1>
        <p className="lede">
          Pick a bank question, project the solution query, and run it against
          the isolated exercise schema so the class can see the result grid.
        </p>
      </header>

      {status && (
        <p className="status-line" role="status">
          Storage: <strong>{status.backend}</strong>
          {status.mysqlConnected ? ' · MySQL ready' : ' · MySQL offline'}
          {' — '}
          {status.message}
        </p>
      )}

      <div className="practice-grid">
        <article className="panel question-list-panel">
          <h2>Questions ({questions.length})</h2>
          {questions.length === 0 ? (
            <p className="muted">Import or author questions first.</p>
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
                      {q.solutionQuery ? 'has solution' : 'no solution'} ·{' '}
                      {q.difficulty}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="panel runner-panel" style={{ gridColumn: 'span 2' }}>
          <h2>{selected ? selected.title : 'Pick a question'}</h2>
          {selected ? (
            <>
              <p className="prompt">{selected.prompt}</p>
              <label className="field-label" htmlFor="demo-sql">
                Query to project
              </label>
              <textarea
                id="demo-sql"
                className="code-input"
                rows={8}
                value={sql}
                onChange={(e) => setSql(e.target.value)}
                spellCheck={false}
              />
              <div className="btn-row">
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={busy || !selected.solutionQuery}
                  onClick={() => void onShowSolution()}
                >
                  Load solution
                </button>
                <button
                  type="button"
                  className="btn"
                  disabled={busy}
                  onClick={() => void onRunDemo()}
                >
                  Run for class
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
            <p className="muted">Select a question to demo.</p>
          )}
        </article>
      </div>
    </section>
  )
}
