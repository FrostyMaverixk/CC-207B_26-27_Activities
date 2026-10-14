import { useEffect, useMemo, useRef } from 'react'
import { ArrowUp, ArrowDown } from 'lucide-react'
import KebabMenu from './KebabMenu'

/**
 * Generic table with: search filter, sortable columns, row selection
 * (bulk delete), kebab actions column, loading & empty states.
 *
 * columns: [{ key, label, sortable?, sortValue?(row), render?(row), className? }]
 */
export default function DataTable({
  columns,
  rows = [],
  rowKey = 'id',
  searchTerm = '',
  searchKeys,
  sort,
  onSort,
  selectable = false,
  selected,
  onSelectedChange,
  actions,
  loading = false,
  empty,
  getRowClass,
}) {
  const headCheckRef = useRef(null)

  const filteredRows = useMemo(() => {
    let out = rows
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase()
      const keys = searchKeys || columns.map((c) => c.key)
      out = out.filter((row) =>
        keys.some((k) => String(row[k] ?? '').toLowerCase().includes(term)),
      )
    }
    if (sort?.key) {
      const col = columns.find((c) => c.key === sort.key)
      if (col) {
        const dirFactor = sort.dir === 'desc' ? -1 : 1
        out = [...out].sort((a, b) => {
          const av = col.sortValue ? col.sortValue(a) : a[col.key]
          const bv = col.sortValue ? col.sortValue(b) : b[col.key]
          if (av == null && bv == null) return 0
          if (av == null) return 1
          if (bv == null) return -1
          if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dirFactor
          return String(av).localeCompare(String(bv), undefined, { numeric: true }) * dirFactor
        })
      }
    }
    return out
  }, [rows, searchTerm, sort, columns, searchKeys])

  const allIds = filteredRows.map((r) => String(r[rowKey]))
  const selectedOnPage = allIds.filter((id) => selected?.has(id)).length
  const allChecked = allIds.length > 0 && selectedOnPage === allIds.length

  // Keep the header checkbox in "indeterminate" state when partial.
  // (Done post-commit in an effect — DOM mutation is not allowed during render.)
  useEffect(() => {
    if (headCheckRef.current) {
      headCheckRef.current.indeterminate = selectedOnPage > 0 && !allChecked
    }
  }, [selectedOnPage, allChecked])

  const toggleAll = () => {
    const next = new Set(selected || [])
    if (allChecked) allIds.forEach((id) => next.delete(id))
    else allIds.forEach((id) => next.add(id))
    onSelectedChange?.(next)
  }

  const toggleRow = (id) => {
    const next = new Set(selected || [])
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onSelectedChange?.(next)
  }

  const colCount = columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)

  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            {selectable && (
              <th className="col-check">
                <input
                  ref={headCheckRef}
                  type="checkbox"
                  checked={allChecked}
                  onChange={toggleAll}
                  aria-label="Select all rows"
                />
              </th>
            )}
            {columns.map((col) => {
              const sortable = Boolean(col.sortable)
              const sorted = sortable && sort?.key === col.key
              return (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={
                    sorted
                      ? sort.dir === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : sortable
                        ? 'none'
                        : undefined
                  }
                  className={`${sortable ? 'th-sortable' : ''} ${col.className || ''}`}
                  onClick={() => sortable && onSort?.(col.key)}
                  onKeyDown={(e) => {
                    if (!sortable) return
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSort?.(col.key)
                    }
                  }}
                  tabIndex={sortable ? 0 : undefined}
                  role={sortable ? 'button' : undefined}
                >
                  <span className="row" style={{ gap: 5 }}>
                    {col.label}
                    {sorted && (
                      <>
                        {sort.dir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                      </>
                    )}
                  </span>
                </th>
              )
            })}
            {actions && <th style={{ width: 46 }} aria-label="Actions" />}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={colCount} className="center muted" style={{ padding: 40, gap: 10 }}>
                Loading…
              </td>
            </tr>
          ) : filteredRows.length === 0 ? (
            <tr>
              <td colSpan={colCount} style={{ padding: 0 }}>
                {empty}
              </td>
            </tr>
          ) : (
            filteredRows.map((row) => {
              const id = String(row[rowKey])
              return (
                <tr
                  key={id}
                  className={[
                    selectable && selected?.has(id) ? 'row-selected' : '',
                    getRowClass?.(row) || '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {selectable && (
                    <td className="col-check">
                      <input
                        type="checkbox"
                        checked={selected?.has(id) || false}
                        onChange={() => toggleRow(id)}
                        aria-label={`Select row ${id}`}
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className={col.className || ''}>
                      {col.render ? col.render(row) : row[col.key] ?? <span className="muted">—</span>}
                    </td>
                  ))}
                  {actions && (
                    <td>
                      <KebabMenu items={actions(row)} />
                    </td>
                  )}
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

