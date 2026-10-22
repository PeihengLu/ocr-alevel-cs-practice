import type { ReactElement } from 'react'

export function TeacherDemo(): ReactElement {
  return (
    <section className="shell">
      <header className="shell-header">
        <p className="eyebrow">Teacher</p>
        <h1>Classroom demo</h1>
        <p className="lede">
          Project and step through example queries for class. Placeholder shell
          for Milestone 1 demo mode.
        </p>
      </header>

      <div className="panel-list" role="list">
        <article className="panel" role="listitem">
          <h2>Demo stage</h2>
          <p className="muted">Step-through query view will live here.</p>
        </article>
      </div>
    </section>
  )
}
