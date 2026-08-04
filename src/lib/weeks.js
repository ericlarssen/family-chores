// Calendar-day math for the chore chart. Everything is a `YYYY-MM-DD` string in
// the household timezone — never a JS Date in storage — so a task never slides
// across a day boundary from UTC drift. Internally we anchor to UTC whole days,
// which have no DST, making all offsets exact.

const DAY_MS = 24 * 60 * 60 * 1000

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

// `YYYY-MM-DD` → UTC epoch ms at midnight of that calendar day.
function isoToUTC(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

function utcToIso(ms) {
  const dt = new Date(ms)
  const y = dt.getUTCFullYear()
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0')
  const d = String(dt.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Add (or subtract) whole days to a date string. DST-proof: UTC has no DST.
export function addDays(iso, n) {
  return utcToIso(isoToUTC(iso) + n * DAY_MS)
}

export function addWeeks(iso, n) {
  return addDays(iso, n * 7)
}

// Today's calendar date in the household timezone, as `YYYY-MM-DD`.
// en-CA formats as ISO, which is why it's used here.
export function todayIso(timeZone) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

// The Monday (week start) on or before `iso`. This is the week id.
export function mondayOf(iso) {
  const dow = new Date(isoToUTC(iso)).getUTCDay() // 0=Sun … 6=Sat
  const offsetToMonday = (dow + 6) % 7
  return addDays(iso, -offsetToMonday)
}

// The current week's id in the household timezone.
export function currentWeekId(timeZone) {
  return mondayOf(todayIso(timeZone))
}

// The seven day-strings of a week, Monday (index 0) through Sunday (index 6).
export function dayDates(mondayIso) {
  return Array.from({ length: 7 }, (_, i) => addDays(mondayIso, i))
}

// Whole weeks from Monday `a` to Monday `b` (signed). Both must be Mondays.
export function weeksBetween(a, b) {
  return Math.round((isoToUTC(b) - isoToUTC(a)) / (7 * DAY_MS))
}

// "Mon 4" style label for a day cell.
export function dayLabel(iso, index) {
  return `${WEEKDAYS[index]} ${Number(iso.slice(8, 10))}`
}

// "Aug 3 – 9" style label for a whole week (handles month/year spillover).
export function weekRangeLabel(mondayIso) {
  const sundayIso = addDays(mondayIso, 6)
  const mMonth = MONTHS[Number(mondayIso.slice(5, 7)) - 1]
  const sMonth = MONTHS[Number(sundayIso.slice(5, 7)) - 1]
  const mDay = Number(mondayIso.slice(8, 10))
  const sDay = Number(sundayIso.slice(8, 10))
  if (mMonth === sMonth) return `${mMonth} ${mDay} – ${sDay}`
  return `${mMonth} ${mDay} – ${sMonth} ${sDay}`
}

// Day index within its week, Monday = 0 … Sunday = 6.
export function dayIndexOf(iso) {
  const dow = new Date(isoToUTC(iso)).getUTCDay()
  return (dow + 6) % 7
}

// Longer human date, e.g. "Wed, Aug 5".
export function longDayLabel(iso) {
  const month = MONTHS[Number(iso.slice(5, 7)) - 1]
  return `${WEEKDAYS[dayIndexOf(iso)]}, ${month} ${Number(iso.slice(8, 10))}`
}
