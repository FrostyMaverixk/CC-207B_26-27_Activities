import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatusBadge from './StatusBadge'

describe('StatusBadge', () => {
  it.each([
    ['present', 'Present'],
    ['late', 'Late'],
    ['absent', 'Absent'],
    ['dash', '—'],
    ['active', 'Active'],
    ['ended', 'Ended'],
  ])('maps status %s to label %s', (status, label) => {
    render(<StatusBadge status={status} />)
    expect(screen.getByText(label)).toBeInTheDocument()
  })

  it('prioritises an explicit label', () => {
    render(<StatusBadge status="late" label="Custom label" />)
    expect(screen.getByText('Custom label')).toBeInTheDocument()
  })

  it('falls back to the raw status for unknown values', () => {
    render(<StatusBadge status="weird" />)
    expect(screen.getByText('weird')).toBeInTheDocument()
  })
})
