import { describe, it, expect } from 'vitest'
import { activeBarFor, CURSOR_BAND, CURSOR_LINE } from './chartTheme'

describe('chartTheme', () => {
  it('deepens known palette colors on hover (no white wash)', () => {
    expect(activeBarFor('#10b981').fill).toBe('#059669')
    expect(activeBarFor('#f59e0b').fill).toBe('#d97706')
    expect(activeBarFor('#f43f5e').fill).toBe('#e11d48')
  })

  it('keeps unknown colors unchanged and always adds a visible ring', () => {
    const active = activeBarFor('#123456')
    expect(active.fill).toBe('#123456')
    expect(active.strokeWidth).toBeGreaterThan(0)
    expect(active.stroke).toContain('rgba')
  })

  it('preserves the bar radius for hovered bars', () => {
    expect(activeBarFor('#0ea5e9', [0, 5, 5, 0]).radius).toEqual([0, 5, 5, 0])
  })

  it('exports cursor helpers', () => {
    expect(CURSOR_BAND.fill).toBeTruthy()
    expect(CURSOR_LINE.strokeDasharray).toBe('3 3')
  })
})
