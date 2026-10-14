const LABELS = {
  present: 'Present',
  late: 'Late',
  absent: 'Absent',
  dash: '—',
  active: 'Active',
  ended: 'Ended',
}

export default function StatusBadge({ status = 'dash', label }) {
  return <span className={`badge ${status}`}>{label || LABELS[status] || status}</span>
}
