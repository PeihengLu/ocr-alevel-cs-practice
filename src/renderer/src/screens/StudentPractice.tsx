import { useCallback, useEffect, useState, type ReactElement } from 'react'
import { importPack } from '../pack'
import type { SqlQuestion, StorageStatus } from '../pack'

export function StudentPractice(): ReactElement {
  const [status, setStatus] = useState<StorageStatus | null>(null)
  const [questions, setQuestions] = useState<SqlQuestion[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [flash, setFlash] = useState<string | null>(null)
  const [runNote, setRunNote] = useState<string | null>(null)
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
    setRunNote(null)
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
      setRunNote(result.message)
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
          Import a <code>.plpack</code>, browse SQL questions, open one, and try
          a query. Pass/fail against MySQL is stubbed until the exercise runner
          lands.
        </p>
      </header>

      {status && (
        <p className="status-line" role="status">
          Storage: <strong>{status.backend}</strong> — {status.message}
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
          <p>Load questions from a teacher-exported pack file.</p>
          <button type="button" className="btn" disabled={busy} onClick={() => void onImport()}>
            Import .plpack…
          </button>
        </article>

        <article className="panel question-list-panel">
          <h2>Questions ({questions.length})</h2>
          {questions.length === 0 ? (
            <p className="muted">No questions yet — import the sample pack to start.</p>
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
                Your query
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
              {runNote && (
                <p className="todo-note" role="status">
                  {runNote}
                </p>
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
