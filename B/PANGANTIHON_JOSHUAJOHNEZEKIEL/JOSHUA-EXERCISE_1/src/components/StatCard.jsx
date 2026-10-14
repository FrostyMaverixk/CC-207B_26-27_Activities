export default function StatCard({ icon: Icon, accent = 'indigo', label, value, sub }) {
  return (
    <div className="card stat-card">
      {Icon && (
        <div className={`stat-icon ${accent}`}>
          <Icon size={21} />
        </div>
      )}
      <div style={{ minWidth: 0 }}>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
    </div>
  )
}
