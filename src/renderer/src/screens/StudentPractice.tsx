import type { ReactElement } from 'react'
import { importPack } from '../pack'

export function StudentPractice(): ReactElement {
  return (
    <section className="shell">
      <header className="shell-header">
        <p className="eyebrow">Student</p>
        <h1>Practice</h1>
        <p className="lede">
          Import a question pack, pick a SQL exercise, run queries against local
          MySQL, and see pass/fail. MySQL + pack I/O land after this scaffold.
        </p>
      </header>

      <div className="panel-list" role="list">
        <article className="panel" role="listitem">
          <h2>Pack import</h2>
          <p>Drop a <code>.plpack</code> or load from the optional <code>content/</code> folder.</p>
          <button
            type="button"
            className="btn"
            onClick={() => {
              void importPack('(choose file)').then((result) => {
                console.info('importPack stub:', result)
              })
            }}
          >
            Import pack (stub)
          </button>
        </article>

        <article className="panel" role="listitem">
          <h2>Question list</h2>
          <p className="muted">No questions loaded yet.</p>
        </article>

        <article className="panel" role="listitem">
          <h2>Query runner</h2>
          <p className="muted">Editor + result table placeholder.</p>
        </article>
      </div>
    </section>
  )
}
