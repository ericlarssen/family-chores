import { addWeeks, currentWeekId, weekRangeLabel } from '../lib/weeks'

// Move between weeks and jump back to the current one. Each move updates the hash
// (via goToWeek) so the URL is always a deep link to the shown week.
export default function WeekNav({ weekId, timezone, onGoToWeek }) {
  const thisWeek = currentWeekId(timezone)
  const isCurrent = weekId === thisWeek

  return (
    <div className="weeknav">
      <button
        type="button"
        className="weeknav-btn"
        aria-label="Previous week"
        onClick={() => onGoToWeek(addWeeks(weekId, -1))}
      >
        ‹
      </button>

      <div className="weeknav-label">
        <span className="weeknav-range">{weekRangeLabel(weekId)}</span>
        {isCurrent ? (
          <span className="weeknav-tag">This week</span>
        ) : (
          <button
            type="button"
            className="weeknav-today"
            onClick={() => onGoToWeek(thisWeek)}
          >
            Jump to this week
          </button>
        )}
      </div>

      <button
        type="button"
        className="weeknav-btn"
        aria-label="Next week"
        onClick={() => onGoToWeek(addWeeks(weekId, 1))}
      >
        ›
      </button>
    </div>
  )
}
