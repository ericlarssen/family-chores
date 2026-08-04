import { weeksBetween } from './weeks'

// Which anchor each adult holds in a given week.
//
// The rotation swaps every `swapEveryNWeeks` weeks, counting from
// `rotation.anchorMonday` where `rotation.start` defines the assignment. With
// two anchors and two adults, an odd number of swaps means each adult holds the
// other anchor.
//
// This is computed once and then FROZEN onto the week doc when it's first
// created (see useWeek). Reading roles back from the doc — rather than
// recomputing live — keeps history true if the rotation rule ever changes.
export function rolesForWeek(config, mondayIso) {
  const { anchorMonday, swapEveryNWeeks, start } = config.rotation
  const anchorIds = Object.keys(config.anchors)

  const weeks = weeksBetween(anchorMonday, mondayIso)
  const swaps = Math.floor(weeks / swapEveryNWeeks)
  const swapped = ((swaps % 2) + 2) % 2 === 1

  const roles = {}
  for (const [personId, anchor] of Object.entries(start)) {
    roles[personId] = swapped
      ? anchorIds.find((a) => a !== anchor) ?? anchor
      : anchor
  }
  return roles
}
