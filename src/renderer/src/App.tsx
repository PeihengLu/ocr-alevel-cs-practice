import { useState, type ReactElement } from 'react'
import { EDITION, isTeacher } from './edition'
import { StudentPractice } from './screens/StudentPractice'
import { TeacherAuthor } from './screens/TeacherAuthor'
import { TeacherDemo } from './screens/TeacherDemo'

type Route = 'practice' | 'author' | 'demo'

export default function App(): ReactElement {
  // Teacher opens on Demo (live lesson projector); Student on Practice.
  const [route, setRoute] = useState<Route>(isTeacher ? 'demo' : 'practice')

  return (
    <div className="app">
      <nav className="topnav" aria-label="Primary">
        <span className="brand">PortableLeetcode</span>
        <span className="edition-badge" data-edition={EDITION}>
          {EDITION} build
        </span>
        <div className="nav-links">
          {isTeacher && (
            <button
              type="button"
              className={route === 'demo' ? 'nav-link active' : 'nav-link'}
              onClick={() => setRoute('demo')}
            >
              Demo
            </button>
          )}
          <button
            type="button"
            className={route === 'practice' ? 'nav-link active' : 'nav-link'}
            onClick={() => setRoute('practice')}
          >
            Practice
          </button>
          {isTeacher && (
            <button
              type="button"
              className={route === 'author' ? 'nav-link active' : 'nav-link'}
              onClick={() => setRoute('author')}
            >
              Author
            </button>
          )}
        </div>
      </nav>

      <main>
        {route === 'practice' && <StudentPractice />}
        {isTeacher && route === 'author' && <TeacherAuthor />}
        {isTeacher && route === 'demo' && <TeacherDemo />}
      </main>
    </div>
  )
}
