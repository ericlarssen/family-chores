import { describe, expect, it } from 'vitest'
import { effectiveRoles, hasSwap, isSkipped } from '../../src/lib/overrides'

const baseWeek = {
  roles: { p1: 'evening', p2: 'morning' },
  overrides: [],
}

describe('effectiveRoles', () => {
  it('returns the frozen roles when there is no override', () => {
    expect(effectiveRoles(baseWeek, 2)).toEqual({ p1: 'evening', p2: 'morning' })
  })

  it('swaps the two adults on the override day only', () => {
    const week = { ...baseWeek, overrides: [{ type: 'swap', day: 2 }] }
    expect(effectiveRoles(week, 2)).toEqual({ p1: 'morning', p2: 'evening' })
    // Other days are untouched.
    expect(effectiveRoles(week, 3)).toEqual({ p1: 'evening', p2: 'morning' })
  })

  it('is a no-op when two swaps cancel out', () => {
    const week = {
      ...baseWeek,
      overrides: [
        { type: 'swap', day: 2 },
        { type: 'swap', day: 2 },
      ],
    }
    expect(effectiveRoles(week, 2)).toEqual({ p1: 'evening', p2: 'morning' })
  })
})

describe('hasSwap', () => {
  it('reflects an odd number of swaps for the day', () => {
    const week = { ...baseWeek, overrides: [{ type: 'swap', day: 4 }] }
    expect(hasSwap(week, 4)).toBe(true)
    expect(hasSwap(week, 5)).toBe(false)
  })
})

describe('isSkipped', () => {
  it('matches a skip on day + person + task', () => {
    const week = {
      ...baseWeek,
      overrides: [{ type: 'skip', day: 1, personId: 'p1', taskId: 'eve-cook' }],
    }
    expect(isSkipped(week, 1, 'p1', 'eve-cook')).toBe(true)
    expect(isSkipped(week, 1, 'p2', 'eve-cook')).toBe(false)
    expect(isSkipped(week, 2, 'p1', 'eve-cook')).toBe(false)
  })
})
