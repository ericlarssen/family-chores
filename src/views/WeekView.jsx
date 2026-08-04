import { useConfig } from '../data/useConfig'
import { useHousehold } from '../data/useHousehold'
import { useWeek } from '../data/useWeek'
import { useWeekId } from '../data/useWeekId'
import { currentWeekId, dayDates, longDayLabel, todayIso } from '../lib/weeks'
import WeekNav from '../components/WeekNav'
import TaskGrid from '../components/TaskGrid'
import Banner from '../components/Banner'

// Turn a person's frozen anchor into grid rows: daily tasks (multi-day) followed
// by weekly tasks (single day). All text comes from config.
function anchorRows(anchor, person) {
  if (!anchor) return []
  const daily = (anchor.daily || []).map((t) => ({
    taskId: t.id,
    personId: person.id,
    label: t.label,
    activeDays: t.days,
    color: person.color,
  }))
  const weekly = (anchor.weekly || []).map((t) => ({
    taskId: t.id,
    personId: person.id,
    label: t.label,
    activeDays: [t.day],
    color: person.color,
  }))
  return [...daily, ...weekly]
}

export default function WeekView({ profile, onSignOut }) {
  const { config, loading: configLoading } = useConfig()
  const { timezone } = useHousehold()

  const defaultMonday = currentWeekId(timezone)
  const { weekId, goToWeek } = useWeekId(defaultMonday)
  const { week, loading: weekLoading, toggleTick } = useWeek(weekId, config)

  if (configLoading) {
    return <div className="app-shell"><p className="auth-muted">Loading…</p></div>
  }
  if (!config) {
    return (
      <div className="app-shell">
        <h1>No config yet</h1>
        <p className="auth-muted">Run the seed script to set up this household.</p>
      </div>
    )
  }

  const days = dayDates(weekId).map((iso, index) => ({
    iso,
    index,
    isToday: iso === todayIso(timezone),
  }))

  // Sections: one per adult, showing the anchor they hold this week (frozen).
  const adults = (config.people || []).filter((p) => p.type === 'adult')
  const sections = week
    ? adults.map((person) => {
        const anchorId = week.roles?.[person.id]
        const anchor = anchorId ? config.anchors?.[anchorId] : null
        return {
          key: person.id,
          title: person.name,
          subtitle: anchor?.label,
          color: person.color,
          rows: anchorRows(anchor, person),
        }
      })
    : []

  return (
    <div className="week-view">
      <header className="app-header">
        <span className="app-header-title">Family Chores</span>
        <span className="app-header-user">
          {profile.displayName || profile.email}
          <button type="button" className="linkbtn" onClick={onSignOut}>
            Sign out
          </button>
        </span>
      </header>

      <WeekNav weekId={weekId} timezone={timezone} onGoToWeek={goToWeek} />

      {week?.cleanerVisit ? (
        <Banner icon="🧽" title={`Cleaner visits ${longDayLabel(week.cleanerVisit)}`}>
          Clear the decks the evening before.
        </Banner>
      ) : null}

      {weekLoading || !week ? (
        <p className="auth-muted week-loading">Loading week…</p>
      ) : (
        <TaskGrid
          days={days}
          sections={sections}
          ticks={week.ticks}
          onToggle={toggleTick}
        />
      )}
    </div>
  )
}
