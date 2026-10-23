import { useCallback, useEffect, useState, type ReactElement } from 'react'
import { exportPack } from '../pack'
import type { SqlQuestion, StorageStatus } from '../pack'

const defaultSql = `-- Example dataset for this question
CREATE TABLE students (
  id INT PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  year_group INT NOT NULL
);

INSERT INTO students (id, name, year_group) VALUES
  (1, 'Amina', 12),
  (2, 'Ben', 13),
  (3, 'Cara', 12);
`

function blankQuestion(): SqlQuestion {
  return {
    id: 'new-question',
    version: 1,
    title: '',
    prompt: '',
    starterQuery: 'SELECT ',
    solutionQuery: '',
    checks: [{ type: 'row_count', expected: 1 }],
    tags: ['sql'],
    difficulty: 'easy',
    schemaRef: 'demo_students'
  }
}

export function TeacherAuthor(): ReactElement {
  const [status, setStatus] = useState<StorageStatus | null>(null)
  const [questions, setQuestions] = useState<SqlQuestion[]>([])
  const [draft, setDraft] = useState<SqlQuestion>(blankQuestion)
  const [sqlAsset, setSqlAsset] = useState(defaultSql)
  const [packId, setPackId] = useState('teacher-draft')
  const [packVersion, setPackVersion] = useState('0.1.0')
  const [packTitle, setPackTitle] = useState('Teacher draft pack')
  const [selectedExport, setSelectedExport] = useState<Record<string, boolean>>(
    {}
  )
  const [flash, setFlash] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    const api = window.portableLeetcode
    const [nextStatus, list] = await Promise.all([
      api.getStorageStatus(),
      api.listQuestions()
    ])
    setStatus(nextStatus)
    setQuestions(list)
    setSelectedExport((prev) => {
      const next: Record<string, boolean> = {}
      for (const q of list) {
        next[q.id] = prev[q.id] ?? true
      }
      return next
    })
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function onSave(): Promise<void> {
    setBusy(true)
    setFlash(null)
    try {
      if (!draft.id.trim() || !draft.title.trim()) {
        setFlash('Question id and title are required.')
        return
      }
      const result = await window.portableLeetcode.upsertQuestion(draft, sqlAsset)
      if (!result.ok) {
        setFlash(result.error)
        return
      }
      setFlash(`Saved question “${draft.id}” v${draft.version}.`)
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  async function onLoad(q: SqlQuestion): Promise<void> {
    setDraft({ ...q, tags: [...q.tags], checks: q.checks.map((c) => ({ ...c })) })
    const sql = await window.portableLeetcode.getSqlAsset(q.schemaRef)
    setSqlAsset(sql ?? defaultSql)
    setFlash(`Loaded “${q.id}” for editing.`)
  }

  async function onExport(): Promise<void> {
    setBusy(true)
    setFlash(null)
    try {
      const questionIds = questions
        .filter((q) => selectedExport[q.id])
        .map((q) => q.id)
      if (questionIds.length === 0) {
        setFlash('Select at least one question to export.')
        return
      }
      const result = await exportPack({
        meta: {
          packId: packId.trim() || 'teacher-draft',
          version: packVersion.trim() || '0.1.0',
          title: packTitle.trim() || 'Teacher draft pack'
        },
        questionIds
      })
      if (!result.ok) {
        if (!result.cancelled) setFlash(result.error)
        return
      }
      setFlash(`Exported pack to ${result.path}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="shell">
      <header className="shell-header">
        <p className="eyebrow">Teacher</p>
        <h1>Author</h1>
        <p className="lede">
          Create SQL questions (schema, seed, prompt, checks) and export a{' '}
          <code>.plpack</code> for offline student installs.
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

      <div className="author-grid">
        <article className="panel">
          <h2>Question editor</h2>
          <div className="form-grid">
            <label>
              Id
              <input
                value={draft.id}
                onChange={(e) => setDraft({ ...draft, id: e.target.value })}
              />
            </label>
            <label>
              Version
              <input
                type="number"
                min={1}
                value={draft.version}
                onChange={(e) =>
                  setDraft({ ...draft, version: Number(e.target.value) || 1 })
                }
              />
            </label>
            <label className="span-2">
              Title
              <input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </label>
            <label className="span-2">
              Prompt
              <textarea
                rows={4}
                value={draft.prompt}
                onChange={(e) => setDraft({ ...draft, prompt: e.target.value })}
              />
            </label>
            <label>
              Difficulty
              <select
                value={draft.difficulty}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    difficulty: e.target.value as SqlQuestion['difficulty']
                  })
                }
              >
                <option value="easy">easy</option>
                <option value="medium">medium</option>
                <option value="hard">hard</option>
              </select>
            </label>
            <label>
              Schema ref
              <input
                value={draft.schemaRef}
                onChange={(e) =>
                  setDraft({ ...draft, schemaRef: e.target.value })
                }
              />
            </label>
            <label className="span-2">
              Tags (comma-separated)
              <input
                value={draft.tags.join(', ')}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    tags: e.target.value
                      .split(',')
                      .map((t) => t.trim())
                      .filter(Boolean)
                  })
                }
              />
            </label>
            <label className="span-2">
              Starter query
              <textarea
                className="code-input"
                rows={3}
                value={draft.starterQuery}
                onChange={(e) =>
                  setDraft({ ...draft, starterQuery: e.target.value })
                }
                spellCheck={false}
              />
            </label>
            <label className="span-2">
              Solution query (optional)
              <textarea
                className="code-input"
                rows={3}
                value={draft.solutionQuery ?? ''}
                onChange={(e) =>
                  setDraft({ ...draft, solutionQuery: e.target.value })
                }
                spellCheck={false}
              />
            </label>
            <label className="span-2">
              Schema + seed SQL
              <textarea
                className="code-input"
                rows={8}
                value={sqlAsset}
                onChange={(e) => setSqlAsset(e.target.value)}
                spellCheck={false}
              />
            </label>
            <label className="span-2">
              Expected row count check
              <input
                type="number"
                min={0}
                value={
                  draft.checks[0]?.type === 'row_count'
                    ? draft.checks[0].expected
                    : 0
                }
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    checks: [
                      { type: 'row_count', expected: Number(e.target.value) || 0 }
                    ]
                  })
                }
              />
            </label>
          </div>
          <div className="btn-row">
            <button
              type="button"
              className="btn"
              disabled={busy}
              onClick={() => void onSave()}
            >
              Save to bank
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={busy}
              onClick={() => {
                setDraft(blankQuestion())
                setSqlAsset(defaultSql)
              }}
            >
              New blank
            </button>
          </div>
        </article>

        <div className="author-side">
          <article className="panel">
            <h2>Bank ({questions.length})</h2>
            {questions.length === 0 ? (
              <p className="muted">No authored questions yet.</p>
            ) : (
              <ul className="question-list">
                {questions.map((q) => (
                  <li key={q.id}>
                    <button
                      type="button"
                      className="question-item"
                      onClick={() => void onLoad(q)}
                    >
                      <span className="q-title">{q.title || q.id}</span>
                      <span className="q-meta">
                        {q.difficulty} · v{q.version}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="panel">
            <h2>Export pack</h2>
            <div className="form-grid">
              <label>
                Pack id
                <input value={packId} onChange={(e) => setPackId(e.target.value)} />
              </label>
              <label>
                Version
                <input
                  value={packVersion}
                  onChange={(e) => setPackVersion(e.target.value)}
                />
              </label>
              <label className="span-2">
                Title
                <input
                  value={packTitle}
                  onChange={(e) => setPackTitle(e.target.value)}
                />
              </label>
            </div>
            <fieldset className="export-set">
              <legend>Include questions</legend>
              {questions.map((q) => (
                <label key={q.id} className="check-row">
                  <input
                    type="checkbox"
                    checked={Boolean(selectedExport[q.id])}
                    onChange={(e) =>
                      setSelectedExport({
                        ...selectedExport,
                        [q.id]: e.target.checked
                      })
                    }
                  />
                  {q.title || q.id}
                </label>
              ))}
            </fieldset>
            <button
              type="button"
              className="btn"
              disabled={busy || questions.length === 0}
              onClick={() => void onExport()}
            >
              Export .plpack…
            </button>
          </article>
        </div>
      </div>
    </section>
  )
}
