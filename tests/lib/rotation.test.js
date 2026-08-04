import { describe, expect, it } from 'vitest'
import { rolesForWeek } from '../../src/lib/rotation'

// Mirror of seed/config.json's shape, trimmed to what rotation reads.
const config = {
  rotation: {
    swapEveryNWeeks: 1,
    anchorMonday: '2026-08-03',
    start: { p1: 'evening', p2: 'morning' },
  },
  anchors: { evening: {}, morning: {} },
}

describe('rolesForWeek', () => {
  it('uses the start assignment on the anchor week', () => {
    expect(rolesForWeek(config, '2026-08-03')).toEqual({
      p1: 'evening',
      p2: 'morning',
    })
  })

  it('swaps every week (swapEveryNWeeks = 1)', () => {
    expect(rolesForWeek(config, '2026-08-10')).toEqual({
      p1: 'morning',
      p2: 'evening',
    })
    expect(rolesForWeek(config, '2026-08-17')).toEqual({
      p1: 'evening',
      p2: 'morning',
    })
  })

  it('alternates correctly into the past', () => {
    expect(rolesForWeek(config, '2026-07-27')).toEqual({
      p1: 'morning',
      p2: 'evening',
    })
  })

  it('respects swapEveryNWeeks = 2', () => {
    const biweekly = {
      ...config,
      rotation: { ...config.rotation, swapEveryNWeeks: 2 },
    }
    expect(rolesForWeek(biweekly, '2026-08-03').p1).toBe('evening')
    expect(rolesForWeek(biweekly, '2026-08-10').p1).toBe('evening') // still wk 0-1
    expect(rolesForWeek(biweekly, '2026-08-17').p1).toBe('morning') // wk 2 → swap
  })
})
