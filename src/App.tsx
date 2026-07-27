import { CompassStar, Divider, Milestone, Ribbon, Rosette, Swallow } from './components/Ornament'
import { Icon, ICON_NAMES } from './components/Ornament/icons'

/** Temporary proofing sheet — replaced by the real page once the ornament
 *  set reads correctly against the printed original. */
export function App() {
  return (
    <>
      <div className="paper-vignette" />
      <main className="shell" style={{ paddingBlock: '4rem', color: 'var(--ink)' }}>
        <p className="caps caps-wide" style={{ marginBottom: '2.5rem', opacity: 0.6 }}>
          Coală de probă · ornamente
        </p>

        <div style={{ display: 'flex', gap: '3rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <CompassStar label="Stea-busolă" style={{ width: 120 }} />
          <Rosette label="Rozetă" style={{ width: 90 }} />
          <Rosette style={{ width: 44 }} />
          <Milestone n="04" style={{ width: 70 }} />
          <Milestone n="06" style={{ width: 70 }} />
          <Swallow label="Rândunică" style={{ width: 110 }} />
        </div>

        <div style={{ maxWidth: 420, marginBlock: '3rem' }}>
          <Divider />
          <p className="caps" style={{ textAlign: 'center', marginBlock: '1.25rem', lineHeight: 2 }}>
            Cele mai bune drumuri
            <br />
            sunt cele pe care le facem împreună.
          </p>
          <Divider />
        </div>

        <Ribbon style={{ width: 300, marginBlock: '2rem' }}>I &amp; A</Ribbon>

        <div style={{ display: 'flex', gap: '1.75rem', flexWrap: 'wrap', marginTop: '2rem' }}>
          {ICON_NAMES.map((n) => (
            <div key={n} style={{ textAlign: 'center', width: 76 }}>
              <Icon name={n} label={n} style={{ width: 46, margin: '0 auto' }} />
              <span className="caps" style={{ fontSize: 10, opacity: 0.55 }}>{n}</span>
            </div>
          ))}
        </div>
      </main>
      <div className="paper-grain" />
    </>
  )
}
