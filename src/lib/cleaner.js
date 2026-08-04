import { addDays, weeksBetween } from './weeks'

// The cleaner's visit date for a given week, or null if there's no visit.
//
// For `source: "schedule"`, visits recur every `everyNWeeks` weeks from
// `anchorMonday`, landing on day index `day` (0 = Monday). Later this can flip
// to `source: "calendar"` without touching callers.
export function cleanerVisitFor(config, mondayIso) {
  const cleaner = config.cleaner
  if (!cleaner || cleaner.source !== 'schedule' || !cleaner.schedule) {
    return null
  }

  const { everyNWeeks, anchorMonday, day } = cleaner.schedule
  const weeks = weeksBetween(anchorMonday, mondayIso)
  const mod = ((weeks % everyNWeeks) + everyNWeeks) % everyNWeeks
  if (mod !== 0) return null

  return addDays(mondayIso, day)
}
