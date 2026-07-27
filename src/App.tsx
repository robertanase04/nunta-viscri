import { useState } from 'react'
import { CardUnfold, shouldPlayIntro } from './components/CardUnfold/CardUnfold'

export function App() {
  const [introPlaying, setIntroPlaying] = useState(() => shouldPlayIntro())

  return (
    <>
      <div className="paper-vignette" />

      {introPlaying && <CardUnfold onDone={() => setIntroPlaying(false)} />}

      <main className="shell" style={{ minHeight: '200vh', paddingBlock: '6rem' }}>
        <h1 style={{ fontSize: 'var(--step-4)' }}>Isabella &amp; Alin</h1>
        <p className="caps caps-wide" style={{ marginTop: '1rem', opacity: 0.6 }}>
          04 · 05 · 06 septembrie 2026
        </p>
      </main>

      <div className="paper-grain" />
    </>
  )
}
