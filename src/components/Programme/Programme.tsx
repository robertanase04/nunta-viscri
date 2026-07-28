import { Icon, type IconName } from '../Ornament/icons'
import './Programme.css'

interface Entry {
  icon: IconName
  label: string
  note?: string
}

interface Day {
  weekday: string
  date: string
  /** Printed in red on the plate — the one detail you must not miss. */
  hour: string
  where: string
  entries: readonly Entry[]
}

/**
 * The three days as printed. Each one is a place and an hour rather than a
 * timetable: the plate gives a single red start time per day and lists what
 * follows in order, so inventing clock times for the individual items would
 * be adding information the couple has not committed to.
 */
const DAYS: readonly Day[] = [
  {
    weekday: 'Vineri',
    date: '4 septembrie',
    hour: '17:00',
    where: 'Cetatea Saschiz',
    entries: [
      { icon: 'glass', label: 'Ne vedem la Castle View', note: 'De aici pornim toți împreună.' },
      { icon: 'church', label: 'Cununia civilă' },
      { icon: 'cutlery', label: 'Cina' },
      { icon: 'music', label: 'DJ set' },
    ],
  },
  {
    weekday: 'Sâmbătă',
    date: '5 septembrie',
    hour: '14:30',
    where: 'Viscri 9',
    entries: [
      { icon: 'glass', label: 'Ne vedem la Viscri 9' },
      { icon: 'church', label: 'Cununia religioasă' },
      { icon: 'feast', label: 'Masa festivă' },
      { icon: 'bonfire', label: 'Mare chef', note: 'Cât ține noaptea.' },
    ],
  },
  {
    weekday: 'Duminică',
    date: '6 septembrie',
    hour: '12:00',
    where: 'Bike Check-Inn',
    entries: [
      { icon: 'cup', label: 'Coffee van' },
      { icon: 'bicycle', label: 'Tur cu bicicleta', note: 'Bicicletele sunt ale casei.' },
      { icon: 'feast', label: 'Slow food' },
      { icon: 'heart', label: 'Folk la foc' },
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
            <p className="caps day-when">
              <span className="day-hour">{day.hour}</span>
              <span className="day-date">{day.date}</span>
            </p>
            <p className="caps day-where">{day.where}</p>
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
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  )
}
