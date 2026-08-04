import { describe, expect, it } from 'vitest'
import { anchorSteps, isRoutineTask, routineDone } from '../../src/lib/steps'
import { encodeTick } from '../../src/lib/ticks'

const anchor = {
  id: 'evening',
  steps: ['Kitchen to zero', 'Living room reset', 'Basket lap'],
}

describe('anchorSteps', () => {
  it('normalizes string steps to stable {id,label} pairs', () => {
    expect(anchorSteps(anchor)).toEqual([
      { id: 'evening-step-0', label: 'Kitchen to zero' },
      { id: 'evening-step-1', label: 'Living room reset' },
      { id: 'evening-step-2', label: 'Basket lap' },
    ])
  })
  it('produces ids with no dots or double-underscores', () => {
    for (const s of anchorSteps(anchor)) {
      expect(s.id).not.toContain('.')
      expect(s.id).not.toContain('__')
    }
  })
  it('handles a missing steps array', () => {
    expect(anchorSteps({ id: 'x' })).toEqual([])
  })
})

describe('isRoutineTask', () => {
  it('matches the reset task by id suffix', () => {
    expect(isRoutineTask({ id: 'eve-reset' })).toBe(true)
    expect(isRoutineTask({ id: 'morn-reset' })).toBe(true)
    expect(isRoutineTask({ id: 'eve-walk' })).toBe(false)
  })
})

describe('routineDone', () => {
  const steps = anchorSteps(anchor)
  it('is false until every step is ticked', () => {
    const week = {
      ticks: {
        [encodeTick('p1', 'evening-step-0', 0)]: { done: true },
        [encodeTick('p1', 'evening-step-1', 0)]: { done: true },
      },
    }
    expect(routineDone(week, 'p1', 0, steps)).toBe(false)
  })
  it('is true once all steps are ticked', () => {
    const ticks = {}
    for (const s of steps) ticks[encodeTick('p1', s.id, 0)] = { done: true }
    expect(routineDone({ ticks }, 'p1', 0, steps)).toBe(true)
  })
})
