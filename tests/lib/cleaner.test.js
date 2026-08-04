import { describe, expect, it } from 'vitest'
import { cleanerVisitFor } from '../../src/lib/cleaner'
import { encodeTick, decodeTick } from '../../src/lib/ticks'

const config = {
  cleaner: {
    source: 'schedule',
    schedule: { everyNWeeks: 2, anchorMonday: '2026-08-03', day: 2 },
  },
}

describe('cleanerVisitFor', () => {
  it('returns the visit date on an on-cadence week (Wed of week 0)', () => {
    expect(cleanerVisitFor(config, '2026-08-03')).toBe('2026-08-05')
  })
  it('returns null on an off week', () => {
    expect(cleanerVisitFor(config, '2026-08-10')).toBeNull()
  })
  it('returns the visit two weeks later', () => {
    expect(cleanerVisitFor(config, '2026-08-17')).toBe('2026-08-19')
  })
  it('handles weeks before the anchor', () => {
    expect(cleanerVisitFor(config, '2026-07-20')).toBe('2026-07-22')
    expect(cleanerVisitFor(config, '2026-07-27')).toBeNull()
  })
  it('returns null when the source is not a schedule', () => {
    expect(cleanerVisitFor({ cleaner: { source: 'calendar' } }, '2026-08-03')).toBeNull()
  })
})

describe('tick keys', () => {
  it('round-trips with double underscores and no dots', () => {
    const key = encodeTick('p1', 'eve-reset', 0)
    expect(key).toBe('p1__eve-reset__0')
    expect(key).not.toContain('.')
    expect(decodeTick(key)).toEqual({
      personId: 'p1',
      taskId: 'eve-reset',
      dayIndex: 0,
    })
  })
})
