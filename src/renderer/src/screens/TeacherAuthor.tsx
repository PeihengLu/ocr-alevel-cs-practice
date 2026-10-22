import type { ReactElement } from 'react'
import { exportPack } from '../pack'
import type { PackPayload } from '../pack'

const emptyPack: PackPayload = {
  manifest: {
    packId: 'draft',
    version: '0.0.0',
    title: 'Untitled pack',
    createdAt: new Date().toISOString(),
    minAppVersion: '0.1.0'
  },
  questions: [],
  sqlAssets: {}
}

export function TeacherAuthor(): ReactElement {
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

      <div className="panel-list" role="list">
        <article className="panel" role="listitem">
          <h2>Question editor</h2>
          <p className="muted">Schema / seed / prompt / solution stubs — not wired yet.</p>
        </article>

        <article className="panel" role="listitem">
          <h2>Export pack</h2>
          <button
            type="button"
            className="btn"
            onClick={() => {
              void exportPack(emptyPack, '(choose path)').then((result) => {
                console.info('exportPack stub:', result)
              })
            }}
          >
            Export .plpack (stub)
          </button>
        </article>
      </div>
    </section>
  )
}
