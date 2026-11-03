import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react'
import { CodeEditor } from '../components/CodeEditor'
import { byNumberedTitle } from '../../../shared/order'
import {
  chaptersForTrack,
  type PythonTrack
} from '../../../shared/python/chapters'
import type { PythonRunResult } from '../../../shared/python/report'

type ProgressStatus = 'unseen' | 'attempted' | 'passed'
type StatusFilter = 'all' | ProgressStatus

/**
 * One store for every Python exercise, keyed by exercise id.
 * Programming Basics and Data Structures both read and write this key, so splitting
 * the panels does not drop saved code or pass marks. The legacy key is the original
 * linked-list-only store from before the shared key existed.
 */
const STORAGE_KEY = 'portable-leetcode.python'
const LEGACY_STORAGE_KEY = 'portable-leetcode.python.linked-list'

interface SavedPractice {
  status: Record<string, ProgressStatus>
  code: Record<string, string>
}

const STATUS_LABEL: Record<ProgressStatus, string> = {
  unseen: 'Not attempted',
  attempted: 'Attempted',
  passed: 'Passed'
}

const STATUS_ICON: Record<ProgressStatus, string> = {
  unseen: '○',
  attempted: '◐',
  passed: '✓'
}

function loadSaved(): SavedPractice {
  try {
    const current = localStorage.getItem(STORAGE_KEY)
    const raw = current ?? localStorage.getItem(LEGACY_STORAGE_KEY)
    if (!raw) return { status: {}, code: {} }
    if (!current) localStorage.setItem(STORAGE_KEY, raw)
    const parsed = JSON.parse(raw) as Partial<SavedPractice>
    return {
      status: parsed.status ?? {},
      code: parsed.code ?? {}
    }
  } catch {
    return { status: {}, code: {} }
  }
}

function saveSaved(saved: SavedPractice): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
}

export function PythonPractice({ track }: { track: PythonTrack }): ReactElement {
  const chapters = useMemo(() => chaptersForTrack(track), [track])
  const [saved, setSaved] = useState<SavedPractice>(loadSaved)
  const [selectedId, setSelectedId] = useState(
    () => byNumberedTitle(chaptersForTrack(track)[0]?.exercises ?? [])[0]?.id ?? ''
  )
  const [code, setCode] = useState(() => {
    const first = byNumberedTitle(chaptersForTrack(track)[0]?.exercises ?? [])[0]
    if (!first) return ''
    return loadSaved().code[first.id] ?? first.starterCode
  })
  const [result, setResult] = useState<PythonRunResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [filter, setFilter] = useState<StatusFilter>('all')

  const chapter =
    chapters.find((item) => item.exercises.some((exerciseItem) => exerciseItem.id === selectedId)) ??
    chapters[0]
  const ordered = byNumberedTitle(chapter?.exercises ?? [])
  const exercise =
    ordered.find((item) => item.id === selectedId) ?? ordered[0]
  const savedRef = useRef(saved)
  savedRef.current = saved

  useEffect(() => {
    const inTrack = chapters.some((item) =>
      item.exercises.some((exerciseItem) => exerciseItem.id === selectedId)
    )
    if (inTrack) return
    const next = byNumberedTitle(chapters[0]?.exercises ?? [])[0]
    if (next) setSelectedId(next.id)
  }, [chapters, selectedId])

  useEffect(() => {
    if (!exercise) return
    setCode(savedRef.current.code[exercise.id] ?? exercise.starterCode)
    setResult(null)
  }, [exercise])

  const visible = useMemo(() => {
    const exercises = byNumberedTitle(chapter?.exercises ?? [])
    if (filter === 'all') return exercises
    return exercises.filter((item) => (saved.status[item.id] ?? 'unseen') === filter)
  }, [chapter, filter, saved.status])

  function openChapter(chapterId: string): void {
    const nextChapter = chapters.find((item) => item.id === chapterId)
    if (!nextChapter) return
    if (nextChapter.exercises.some((item) => item.id === selectedId)) return
    const next = byNumberedTitle(nextChapter.exercises)[0]
    if (next) setSelectedId(next.id)
  }

  function writeCode(next: string): void {
    if (!exercise) return
    setCode(next)
    setSaved((prev) => {
      const updated = {
        ...prev,
        code: { ...prev.code, [exercise.id]: next }
      }
      saveSaved(updated)
      return updated
    })
  }

  async function onRun(): Promise<void> {
    if (!exercise) return
    setBusy(true)
    try {
      const next = await window.portableLeetcode.runLinkedList(exercise.id, code)
      setResult(next)
      setSaved((prev) => {
        const already = prev.status[exercise.id]
        const status: ProgressStatus =
          next.passed || already === 'passed' ? 'passed' : 'attempted'
        const updated = {
          ...prev,
          status: { ...prev.status, [exercise.id]: status }
        }
        saveSaved(updated)
        return updated
      })
    } finally {
      setBusy(false)
    }
  }

  function onResetStarter(): void {
    if (!exercise) return
    writeCode(exercise.starterCode)
    setResult(null)
  }

  if (!exercise) return <p>No exercises.</p>

  const status = saved.status[exercise.id] ?? 'unseen'

  return (
    <section className="shell">
      <header className="shell-header">
        <p className="lede">
          Work through one chapter at a time. Each chapter is a short set of
          exercises on one idea. Python runs inside the app.
        </p>
      </header>

      <div className="python-grid">
        <article className="panel">
          <h2>Chapters</h2>
          <ul className="chapter-list">
            {chapters.map((item) => {
              const open = item.id === chapter?.id
              const passed = item.exercises.filter(
                (exerciseItem) => saved.status[exerciseItem.id] === 'passed'
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
                        {passed}/{item.exercises.length}
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
          <h2>Exercises</h2>
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
                className={filter === value ? 'filter-chip active' : 'filter-chip'}
                onClick={() => setFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <ul className="question-list">
            {visible.length === 0 && (
              <li className="muted">No exercises in this filter.</li>
            )}
            {visible.map((exerciseItem) => {
              const itemStatus = saved.status[exerciseItem.id] ?? 'unseen'
              return (
                <li key={exerciseItem.id}>
                  <button
                    type="button"
                    className={
                      exerciseItem.id === exercise.id
                        ? 'question-item active'
                        : 'question-item'
                    }
                    onClick={() => setSelectedId(exerciseItem.id)}
                  >
                    <span className="q-title-row">
                      <span className="q-title">{exerciseItem.title}</span>
                      <ProgressBadge status={itemStatus} />
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </article>

        <article className="panel">
          <div className="runner-toolbar">
            <div>
              <p className="eyebrow">{chapter?.title}</p>
              <h2>{exercise.title}</h2>
            </div>
            <ProgressBadge status={status} />
          </div>
          <p className="prompt">{exercise.prompt}</p>
          <label className="field-label" htmlFor="python-code">
            Your Python
          </label>
          <CodeEditor
            id="python-code"
            className="code-input"
            language="python"
            rows={16}
            value={code}
            onChange={writeCode}
            indentAfterColon
          />
          <div className="btn-row">
            <button type="button" className="btn" disabled={busy} onClick={() => void onRun()}>
              {busy ? 'Running…' : 'Run checks'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={busy}
              onClick={onResetStarter}
            >
              Reset starter
            </button>
          </div>
          <p className="muted python-hint">
            The first run loads Python. After that, checks start straight away.
            A loop that never stops is stopped for you.
          </p>

          {result && (
            <div className="run-outcome">
              <p
                className={result.passed ? 'pass-banner' : 'fail-banner'}
                role="status"
              >
                {result.message}
              </p>
              {result.checks.length > 0 && (
                <ul className="check-list">
                  {result.checks.map((check) => (
                    <li
                      key={check.name}
                      className={check.passed ? 'check-pass' : 'check-fail'}
                    >
                      {check.passed ? '✓' : '✗'} {check.name}
                      {check.passed ? '' : ` — ${check.detail}`}
                    </li>
                  ))}
                </ul>
              )}
              {result.error && <pre className="python-trace">{result.error}</pre>}
              {result.output && (
                <>
                  <h3 className="result-heading">Printed output</h3>
                  <pre className="python-trace">{result.output}</pre>
                </>
              )}
            </div>
          )}
        </article>
      </div>
    </section>
  )
}

function ProgressBadge({ status }: { status: ProgressStatus }): ReactElement {
  return (
    <span className={`progress-badge progress-${status}`} title={STATUS_LABEL[status]}>
      <span className="progress-icon" aria-hidden="true">
        {STATUS_ICON[status]}
      </span>
      <span className="progress-text">{STATUS_LABEL[status]}</span>
    </span>
  )
}
