import { describe, it, expect } from 'vitest'
import {
  fmtTime,
  fmtHM,
  fmtDate,
  fmtDateTime,
  dayKey,
  toLocalInput,
  fromLocalInput,
  initialsOf,
  hueOf,
} from './format'

describe('format helpers', () => {
  it('renders an em-dash for missing values', () => {
    expect(fmtTime(null)).toBe('—')
    expect(fmtHM(undefined)).toBe('—')
    expect(fmtDate('')).toBe('—')
    expect(fmtDateTime(null)).toBe('—')
  })

  it('groups by local calendar day', () => {
    expect(dayKey('2026-03-05T10:00:00Z')).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(dayKey(new Date(2026, 0, 5).toISOString())).toBe('2026-01-05')
  })

  it('round-trips datetime-local values through fromLocalInput', () => {
    const iso = fromLocalInput('2026-03-05T16:30')
    expect(toLocalInput(iso)).toBe('2026-03-05T16:30')
  })

  it('defaults toLocalInput to now (non-empty)', () => {
    expect(toLocalInput()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
  })

  it('extracts up to two initials', () => {
    expect(initialsOf('jose dela cruz')).toBe('JD')
    expect(initialsOf('')).toBe('?')
    expect(initialsOf('  ')).toBe('?')
  })

  it('produces a deterministic hue for a given name', () => {
    expect(hueOf('Ana')).toBe(hueOf('Ana'))
    expect(hueOf('Ana')).toBeGreaterThanOrEqual(0)
    expect(hueOf('Ana')).toBeLessThan(360)
  })
})
