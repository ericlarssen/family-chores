import CheckBox from './CheckBox'
import { WEEKDAYS } from '../lib/weeks'
import { encodeTick } from '../lib/ticks'

// Days across, tasks down. Every row and label comes from config — there is no
// hardcoded chore text here. `sections` groups rows under a heading (one per
// adult's anchor). Each row lights up only the days its task applies to.
export default function TaskGrid({ days, sections, ticks, onToggle }) {
  return (
    <div className="grid-scroll">
      <div className="grid" role="table">
        {/* Header: corner + weekday columns */}
        <div className="grid-row grid-row--head" role="row">
          <div className="grid-cell grid-cell--corner" role="columnheader" />
          {days.map((day) => (
            <div
              key={day.iso}
              role="columnheader"
              className={`grid-cell grid-day${day.isToday ? ' grid-day--today' : ''}`}
            >
              <span className="grid-day-dow">{WEEKDAYS[day.index]}</span>
              <span className="grid-day-num">{Number(day.iso.slice(8, 10))}</span>
            </div>
          ))}
        </div>

        {sections.map((section) => (
          <div key={section.key} className="grid-section" role="rowgroup">
            <div className="grid-section-head" role="row">
              <span
                className="grid-section-swatch"
                style={{ background: section.color || 'var(--color-accent)' }}
              />
              <span className="grid-section-title">{section.title}</span>
              {section.subtitle ? (
                <span className="grid-section-sub">{section.subtitle}</span>
              ) : null}
            </div>

            {section.rows.map((row) => (
              <div key={row.taskId} className="grid-row" role="row">
                <div className="grid-cell grid-task" role="rowheader">
                  {row.label}
                </div>
                {days.map((day) => {
                  const active = row.activeDays.includes(day.index)
                  if (!active) {
                    return (
                      <div
                        key={day.iso}
                        role="cell"
                        className="grid-cell grid-box grid-box--empty"
                      />
                    )
                  }
                  const key = encodeTick(row.personId, row.taskId, day.index)
                  const tick = ticks?.[key]
                  return (
                    <div key={day.iso} role="cell" className="grid-cell grid-box">
                      <CheckBox
                        done={!!tick?.done}
                        color={row.color}
                        title={tick?.done ? `Done · ${row.personId}` : undefined}
                        onToggle={(next) =>
                          onToggle(row.personId, row.taskId, day.index, next)
                        }
                      />
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
