import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DataTable from './DataTable'

const COLUMNS = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'program', label: 'Program', sortable: true },
  { key: 'year', label: 'Year', sortable: true, sortValue: (r) => Number(r.year) },
]

const ROWS = [
  { id: '1', name: 'Ana', program: 'BSMATH', year: '4' },
  { id: '2', name: 'Ben', program: 'ABPSYCH', year: '2' },
  { id: '3', name: 'Cal', program: 'BSMATH', year: '1' },
]

function renderTable(props = {}) {
  const sort = { key: 'name', dir: 'asc' }
  const onSort = vi.fn()
  const view = render(
    <DataTable
      columns={COLUMNS}
      rows={ROWS}
      rowKey="id"
      searchTerm=""
      sort={sort}
      onSort={onSort}
      selectable
      selected={new Set()}
      onSelectedChange={vi.fn()}
      {...props}
    />,
  )
  return { ...view, onSort }
}

describe('DataTable', () => {
  it('renders all rows', () => {
    renderTable()
    expect(screen.getByText('Ana')).toBeInTheDocument()
    expect(screen.getByText('Ben')).toBeInTheDocument()
    expect(screen.getByText('Cal')).toBeInTheDocument()
  })

  it('filters by search term across the given keys', () => {
    renderTable({ searchTerm: 'BSMATH' })
    expect(screen.getByText('Ana')).toBeInTheDocument()
    expect(screen.getByText('Cal')).toBeInTheDocument()
    expect(screen.queryByText('Ben')).not.toBeInTheDocument()
  })

  it('sorts by a numeric sortValue when asked', () => {
    const sort = { key: 'year', dir: 'asc' }
    const { container } = render(
      <DataTable
        columns={COLUMNS}
        rows={ROWS}
        rowKey="id"
        sort={sort}
        onSort={vi.fn()}
      />,
    )
    const years = [...container.querySelectorAll('tbody td:nth-child(3)')].map((td) => td.textContent)
    expect(years).toEqual(['1', '2', '4'])
  })

  it('selects all on the header checkbox and reflects it', () => {
    const onSelectedChange = vi.fn()
    render(
      <DataTable
        columns={COLUMNS}
        rows={ROWS}
        rowKey="id"
        sort={{ key: 'name', dir: 'asc' }}
        onSort={vi.fn()}
        selectable
        selected={new Set()}
        onSelectedChange={onSelectedChange}
      />,
    )
    fireEvent.click(screen.getByLabelText('Select all rows'))
    expect(onSelectedChange).toHaveBeenCalledWith(new Set(['1', '2', '3']))
  })

  it('calls onSort for a sortable header (and is keyboard-reachable)', () => {
    const { onSort } = renderTable()
    const header = screen.getByText('Name').closest('th')
    expect(header).toHaveAttribute('aria-sort', 'ascending')
    fireEvent.click(screen.getByText('Name'))
    expect(onSort).toHaveBeenCalledWith('name')
    fireEvent.keyDown(screen.getByText('Name'), { key: 'Enter' })
    expect(onSort).toHaveBeenCalledTimes(2)
  })

  it('shows the loading state instead of rows', () => {
    renderTable({ loading: true })
    expect(screen.getByText('Loading…')).toBeInTheDocument()
    expect(screen.queryByText('Ana')).not.toBeInTheDocument()
  })

  it('renders the empty-state node when there are no matches', () => {
    renderTable({ searchTerm: 'zzz', empty: <div>Nothing here</div> })
    expect(screen.getByText('Nothing here')).toBeInTheDocument()
  })
})
