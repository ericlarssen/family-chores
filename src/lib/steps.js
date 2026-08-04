import { encodeTick } from './ticks'

// The anchor's routine steps, normalized to { id, label }. Steps in config are
// plain strings without ids; we derive a stable id from the anchor + index
// (e.g. "evening-step-0") so each step can carry its own tick. Tolerant of an
// object shape too, in case steps gain explicit ids later.
export function anchorSteps(anchor) {
  const steps = anchor?.steps || []
  return steps.map((s, i) =>
    typeof s === 'string'
      ? { id: `${anchor.id}-step-${i}`, label: s }
      : { id: s.id || `${anchor.id}-step-${i}`, label: s.label },
  )
}

// The task that represents the whole anchor routine (its steps expand under it).
// Ids are immutable, so the "-reset" suffix is a safe, rename-proof signal.
export function isRoutineTask(task) {
  return typeof task?.id === 'string' && task.id.endsWith('-reset')
}

// A routine counts as done only when every step is ticked for that person/day.
export function routineDone(week, personId, dayIndex, steps) {
  return (
    steps.length > 0 &&
    steps.every((s) => week?.ticks?.[encodeTick(personId, s.id, dayIndex)]?.done)
  )
}
