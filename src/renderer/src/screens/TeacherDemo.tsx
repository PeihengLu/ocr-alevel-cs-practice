import { useEffect, useState, type ReactElement } from 'react'
import { ResultGrid } from '../components/ResultGrid'
import {
  CLASSROOM_LESSON,
  CLASSROOM_SCHEMA,
  type ClassroomLessonStep
} from '../../../shared/demo/classroom'
import type { QueryRunResult, StorageStatus } from '../pack'

export function TeacherDemo(): ReactElement {
  const [status, setStatus] = useState<StorageStatus | null>(null)
  const [stepId, setStepId] = useState(CLASSROOM_LESSON[0]?.id ?? '')
  const [sql, setSql] = useState(CLASSROOM_LESSON[0]?.sql ?? 'SELECT * FROM students;')
  const [talkingPoint, setTalkingPoint] = useState(
    CLASSROOM_LESSON[0]?.say ?? ''
  )
  const [stepTitle, setStepTitle] = useState(CLASSROOM_LESSON[0]?.title ?? '')
  const [runResult, setRunResult] = useState<QueryRunResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [autoRun, setAutoRun] = useState(true)

  useEffect(() => {
    void window.portableLeetcode.getStorageStatus().then(setStatus)
    const first = CLASSROOM_LESSON[0]?.sql ?? 'SELECT * FROM students;'
    setBusy(true)
    void window.portableLeetcode
      .runClassroomSql(first)
      .then(setRunResult)
      .finally(() => setBusy(false))
  }, [])

  function applyStep(step: ClassroomLessonStep, run: boolean): void {
    setStepId(step.id)
    setSql(step.sql)
    setTalkingPoint(step.say)
    setStepTitle(step.title)
    setRunResult(null)
    if (run && autoRun) {
      void runSql(step.sql)
    }
  }

  async function runSql(query: string): Promise<void> {
    setBusy(true)
    try {
      const result = await window.portableLeetcode.runClassroomSql(query)
      setRunResult(result)
    } finally {
      setBusy(false)
    }
  }

  const stepIndex = CLASSROOM_LESSON.findIndex((s) => s.id === stepId)

  function goRelative(delta: number): void {
    const next = CLASSROOM_LESSON[stepIndex + delta]
    if (next) applyStep(next, true)
  }

  return (
    <section className="shell demo-shell">
      <header className="demo-header">
        <div>
          <p className="eyebrow">Teacher · live lesson</p>
          <h1>Classroom demo</h1>
          <p className="lede">
            Project this screen. Walk the class through SQL on a real sample
            table — click each example, run it, and talk through the result.
          </p>
        </div>
        {status && (
          <p className="demo-status" role="status">
            {status.mysqlConnected ? 'MySQL ready' : 'MySQL offline'} ·{' '}
            {status.backend}
          </p>
        )}
      </header>

      <div className="demo-layout">
        <aside className="panel demo-sidebar">
          <h2>Example database</h2>
          <p className="muted demo-dataset-note">
            School roster — 6 students. Same dataset as the sql-basics pack.
          </p>
          {CLASSROOM_SCHEMA.map((table) => (
            <div key={table.name} className="schema-block">
              <h3 className="schema-table-name">
                Table <code>{table.name}</code>
              </h3>
              <table className="schema-table">
                <thead>
                  <tr>
                    <th>Column</th>
                    <th>Type</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {table.columns.map((col) => (
                    <tr key={col.name}>
                      <td>
                        <code>{col.name}</code>
                      </td>
                      <td>{col.type}</td>
                      <td className="muted">{col.notes ?? ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          <h2 className="lesson-heading">Lesson steps</h2>
          <ol className="lesson-list">
            {CLASSROOM_LESSON.map((step, i) => (
              <li key={step.id}>
                <button
                  type="button"
                  className={
                    step.id === stepId ? 'lesson-step active' : 'lesson-step'
                  }
                  onClick={() => applyStep(step, true)}
                >
                  <span className="lesson-num">{i + 1}</span>
                  <span className="lesson-label">{step.label}</span>
                  <span className="lesson-title">{step.title}</span>
                </button>
              </li>
            ))}
          </ol>
        </aside>

        <div className="demo-stage">
          <div className="panel demo-query-panel">
            <div className="demo-step-banner">
              <h2>{stepTitle || 'Try a query'}</h2>
              <p className="talking-point">{talkingPoint}</p>
            </div>

            <div className="example-chips" role="group" aria-label="Example commands">
              {CLASSROOM_LESSON.map((step) => (
                <button
                  key={step.id}
                  type="button"
                  className={
                    step.id === stepId ? 'example-chip active' : 'example-chip'
                  }
                  onClick={() => applyStep(step, true)}
                >
                  {step.label}
                </button>
              ))}
            </div>

            <label className="field-label" htmlFor="classroom-sql">
              SQL (projected)
            </label>
            <textarea
              id="classroom-sql"
              className="code-input demo-editor"
              rows={8}
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              spellCheck={false}
            />

            <div className="btn-row demo-actions">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={busy || stepIndex <= 0}
                onClick={() => goRelative(-1)}
              >
                ← Previous
              </button>
              <button
                type="button"
                className="btn"
                disabled={busy}
                onClick={() => void runSql(sql)}
              >
                Run for class
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={busy || stepIndex < 0 || stepIndex >= CLASSROOM_LESSON.length - 1}
                onClick={() => goRelative(1)}
              >
                Next →
              </button>
              <label className="auto-run-toggle">
                <input
                  type="checkbox"
                  checked={autoRun}
                  onChange={(e) => setAutoRun(e.target.checked)}
                />
                Auto-run when picking a step
              </label>
            </div>
          </div>

          <div className="panel demo-result-panel">
            <h2>Results</h2>
            {runResult ? (
              <>
                <p
                  className={runResult.ok ? 'pass-banner' : 'fail-banner'}
                  role="status"
                >
                  {runResult.message}
                </p>
                {runResult.result ? (
                  <div className="demo-result-wrap">
                    <ResultGrid result={runResult.result} />
                  </div>
                ) : (
                  <p className="muted">No result grid.</p>
                )}
              </>
            ) : (
              <p className="muted">
                Click a lesson step or <strong>Run for class</strong> to show
                results on the projector.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
