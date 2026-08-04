// Tick key format: `{personId}__{taskId}__{dayIndex}` — double underscore,
// day index 0–6 with Monday as 0.
//
// NEVER use dots in tick keys. Firestore field paths treat dots as nesting, so
// `updateDoc({ ['ticks.' + key]: … })` with a dotted key would silently create
// nested objects instead of one flat field. Task ids in config are kebab-case
// (no dots) for exactly this reason.

export function encodeTick(personId, taskId, dayIndex) {
  return `${personId}__${taskId}__${dayIndex}`
}

export function decodeTick(key) {
  const [personId, taskId, dayIndex] = key.split('__')
  return { personId, taskId, dayIndex: Number(dayIndex) }
}
