import { useState, type ReactElement } from 'react'
import type { PythonTrack } from '../../../shared/python/chapters'
import { PythonPractice } from './PythonPractice'
import { StudentPractice } from './StudentPractice'

type PracticeArea = PythonTrack | 'sql'

const AREAS: { id: PracticeArea; label: string }[] = [
  { id: 'basics', label: 'Programming Basics' },
  { id: 'structures', label: 'Data Structures' },
  { id: 'sql', label: 'SQL' }
]

export function PracticeHome(): ReactElement {
  const [area, setArea] = useState<PracticeArea>('basics')

  return (
    <>
      <div className="subject-switch" role="tablist" aria-label="Practice area">
        {AREAS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={area === item.id}
            className={area === item.id ? 'subject-tab active' : 'subject-tab'}
            onClick={() => setArea(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {area === 'sql' ? <StudentPractice /> : <PythonPractice track={area} />}
    </>
  )
}
