import type { ReactElement } from 'react'
import { PracticeHome } from './screens/PracticeHome'

export default function App(): ReactElement {
  return (
    <div className="app">
      <header className="topnav">
        <span className="brand">PortableLeetcode</span>
      </header>
      <main>
        <PracticeHome />
      </main>
    </div>
  )
}
