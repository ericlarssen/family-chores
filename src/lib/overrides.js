// Per-week, per-day exceptions layered on top of the frozen schedule. They live
// in the week doc's `overrides` array so real life (travel, illness, sleepovers)
// bends a single day without rewriting the rotation underneath — and never
// touches other weeks.
//
// Shapes:
//   { type: 'swap', day }                       — swap the two adults' anchors
//   { type: 'skip', day, personId, taskId }     — drop one task for one person

// Adult anchor assignments for a day, with any swap override applied. An odd
// number of swap overrides for the day means the two adults trade anchors.
export function effectiveRoles(week, dayIndex) {
  const roles = { ...(week?.roles || {}) }
  const swaps = (week?.overrides || []).filter(
    (o) => o.type === 'swap' && o.day === dayIndex,
  )
  const ids = Object.keys(roles)
  if (swaps.length % 2 === 1 && ids.length === 2) {
    const [a, b] = ids
    const tmp = roles[a]
    roles[a] = roles[b]
    roles[b] = tmp
  }
  return roles
}

export function hasSwap(week, dayIndex) {
  const count = (week?.overrides || []).filter(
    (o) => o.type === 'swap' && o.day === dayIndex,
  ).length
  return count % 2 === 1
}

export function isSkipped(week, dayIndex, personId, taskId) {
  return (week?.overrides || []).some(
    (o) =>
      o.type === 'skip' &&
      o.day === dayIndex &&
      o.personId === personId &&
      o.taskId === taskId,
  )
}
