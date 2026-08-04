import { describe, expect, it } from 'vitest'
import {
  addDays,
  addWeeks,
  dayDates,
  mondayOf,
  weekRangeLabel,
  weeksBetween,
} from '../../src/lib/weeks'

describe('mondayOf', () => {
  it('returns the same day for a Monday', () => {
    expect(mondayOf('2026-08-03')).toBe('2026-08-03')
  })
  it('snaps mid-week days back to Monday', () => {
    expect(mondayOf('2026-08-05')).toBe('2026-08-03') // Wed
    expect(mondayOf('2026-08-09')).toBe('2026-08-03') // Sun
  })
  it('snaps across a month boundary', () => {
    expect(mondayOf('2026-09-01')).toBe('2026-08-31') // Tue → prev Mon
  })
})

describe('addDays / addWeeks (DST-proof)', () => {
  it('crosses the US spring-forward boundary without drift', () => {
    // DST begins 2026-03-08 in the US. Whole-day math must stay exact.
    expect(addDays('2026-03-07', 2)).toBe('2026-03-09')
  })
  it('advances a week', () => {
    expect(addWeeks('2026-08-03', 1)).toBe('2026-08-10')
    expect(addWeeks('2026-08-03', -1)).toBe('2026-07-27')
  })
})

describe('dayDates', () => {
  it('lists Mon..Sun', () => {
    expect(dayDates('2026-08-03')).toEqual([
      '2026-08-03', '2026-08-04', '2026-08-05', '2026-08-06',
      '2026-08-07', '2026-08-08', '2026-08-09',
    ])
  })
})

describe('weeksBetween', () => {
  it('counts signed whole weeks', () => {
    expect(weeksBetween('2026-08-03', '2026-08-03')).toBe(0)
    expect(weeksBetween('2026-08-03', '2026-08-10')).toBe(1)
    expect(weeksBetween('2026-08-03', '2026-07-27')).toBe(-1)
    expect(weeksBetween('2026-08-03', '2026-10-05')).toBe(9)
  })
  it('stays exact across a DST transition', () => {
    // Spans spring-forward (2026-03-08); still an integer count.
    expect(weeksBetween('2026-03-02', '2026-03-16')).toBe(2)
  })
})

describe('weekRangeLabel', () => {
  it('formats same-month ranges', () => {
    expect(weekRangeLabel('2026-08-03')).toBe('Aug 3 – 9')
  })
  it('formats cross-month ranges', () => {
    expect(weekRangeLabel('2026-08-31')).toBe('Aug 31 – Sep 6')
  })
})
