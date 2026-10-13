import { Search, ArrowUp, ArrowDown } from 'lucide-react'

/**
 * Search input + "Sort by" select + ascending/descending toggle,
 * used at the top of every table tab.
 */
export default function SearchSortBar({
  placeholder = 'Search…',
  value,
  onChange,
  sortOptions = [],
  sortKey,
  onSortKeyChange,
  sortDir = 'asc',
  onToggleDir,
}) {
  return (
    <div className="toolbar">
      <div className="search-box">
        <Search size={15} />
        <input type="search" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
      <span className="spacer" />
      {sortOptions.length > 0 && (
        <>
          <select
            className="select mini"
            value={sortKey}
            onChange={(e) => onSortKeyChange(e.target.value)}
            aria-label="Sort by"
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>
                Sort by: {o.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn-outline btn-icon"
            onClick={onToggleDir}
            title={`Direction: ${sortDir === 'asc' ? 'ascending' : 'descending'}`}
            aria-label="Toggle sort direction"
          >
            {sortDir === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
          </button>
        </>
      )}
    </div>
  )
}
