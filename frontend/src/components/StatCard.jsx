const TrendUp = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
  </svg>
);
const TrendDown = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>
  </svg>
);

export default function StatCard({ title, value, hint, icon, trendUp, trendLabel, iconColor = 'blue' }) {
  if (icon) {
    const isUp = trendUp === true;
    const isDown = trendUp === false;

    return (
      <article className="stat-card">
        <div className="stat-card-header">
          <span className="stat-card-label">{title}</span>
          <div className={`stat-card-icon ${iconColor}`}>{icon}</div>
        </div>
        <p className="stat-card-value">{value}</p>
        {trendLabel && (
          <div className={`stat-card-trend ${isUp ? 'up' : isDown ? 'down' : ''}`}>
            {isUp && <TrendUp />}
            {isDown && <TrendDown />}
            <strong style={{ fontSize: '0.82rem' }}>
              {trendLabel}
            </strong>
            <span>vs last month</span>
          </div>
        )}
        {!trendLabel && hint && <small style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{hint}</small>}
      </article>
    );
  }

  return (
    <article className="stat-card">
      <p style={{ color: 'var(--muted)', fontSize: '0.82rem', fontWeight: 600, margin: 0 }}>{title}</p>
      <h3>{value}</h3>
      <small>{hint}</small>
    </article>
  );
}
