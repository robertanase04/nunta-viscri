import { Icon, type IconName } from '../Ornament/icons'
import './Programme.css'

interface Entry {
  icon: IconName
  label: string
  time: string
  note?: string
}

interface Day {
  weekday: string
  date: string
  entries: readonly Entry[]
}

/** The three days as printed, in Romanian and with the hours filled in. */
const DAYS: readonly Day[] = [
  {
    weekday: 'Vineri',
    date: '4 septembrie',
    entries: [
      { icon: 'bicycle', label: 'Sosirea', time: 'de la 15:00', note: 'Vă așteptăm în sat, pe îndelete.' },
      { icon: 'glass', label: 'Un pahar de bun venit', time: '19:00' },
      { icon: 'cutlery', label: 'Cină în curte', time: '20:30' },
    ],
  },
  {
    weekday: 'Sâmbătă',
    date: '5 septembrie',
    entries: [
      { icon: 'church', label: 'Cununia', time: '16:00', note: 'La biserica fortificată.' },
      { icon: 'glass', label: 'Aperitiv pe iarbă', time: '17:30' },
      { icon: 'feast', label: 'Masa mare', time: '19:30' },
      { icon: 'music', label: 'Dansul', time: '22:00' },
      { icon: 'bonfire', label: 'Focul, pentru cine mai poate', time: 'târziu' },
    ],
  },
  {
    weekday: 'Duminică',
    date: '6 septembrie',
    entries: [
      { icon: 'cup', label: 'Micul dejun lung', time: '10:00' },
      { icon: 'bicycle', label: 'O tură prin împrejurimi', time: '12:00', note: 'Bicicletele sunt ale casei.' },
      { icon: 'heart', label: 'Drum bun', time: 'când vă îndurați' },
    ],
  },
]

export function Programme() {
  return (
    <div className="programme">
      {DAYS.map((day) => (
        <article key={day.weekday} className="day" data-reveal>
          <header className="day-head">
            <h3 className="day-name">{day.weekday}</h3>
            <p className="caps day-date">{day.date}</p>
          </header>

          <ul className="day-list">
            {day.entries.map((e) => (
              <li key={e.label} className="entry">
                <span className="entry-icon" aria-hidden>
                  <Icon name={e.icon} label="" />
                </span>
                <span className="entry-text">
                  <span className="entry-label">{e.label}</span>
                  {e.note ? <span className="entry-note">{e.note}</span> : null}
                </span>
                <span className="caps entry-time">{e.time}</span>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  )
}
