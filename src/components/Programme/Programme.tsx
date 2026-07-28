import { T } from '../../copy'
import { Icon } from '../Ornament/icons'
import './Programme.css'

export function Programme() {
  return (
    <div className="programme">
      {T.programme.days.map((day) => (
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
