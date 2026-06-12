import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { api } from '../api/client';

export default function AuditLogsPage() {
  const [items, setItems] = useState([]);
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadLogs() {
      try {
        const params = new URLSearchParams();
        if (entityType) params.set('entityType', entityType);
        if (action.trim()) params.set('action', action.trim());
        const { data } = await api.get(`/audit-logs${params.toString() ? `?${params.toString()}` : ''}`);
        setItems(data.items || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load audit logs');
      }
    }

    const timeoutId = window.setTimeout(loadLogs, 200);
    return () => window.clearTimeout(timeoutId);
  }, [entityType, action]);

  return (
    <AppLayout title="Audit Logs" description="Track sensitive actions across employees, advances, attendance, leaves, payroll, and settings.">
      <section className="single-column-layout">
        <article className="card">
          <div className="filter-toolbar">
            <div className="detail-grid">
              <label className="field">
                <span>Entity type</span>
                <select value={entityType} onChange={(e) => setEntityType(e.target.value)}>
                  <option value="">All</option>
                  <option value="AdvanceRequest">AdvanceRequest</option>
                  <option value="User">User</option>
                  <option value="AttendanceRecord">AttendanceRecord</option>
                  <option value="LeaveRequest">LeaveRequest</option>
                  <option value="PayrollRecord">PayrollRecord</option>
                  <option value="PerformanceReview">PerformanceReview</option>
                  <option value="CompanySettings">CompanySettings</option>
                </select>
              </label>
              <label className="field">
                <span>Action search</span>
                <input value={action} onChange={(e) => setAction(e.target.value)} placeholder="advance.approved" />
              </label>
            </div>
          </div>

          {error ? <div className="alert alert-error">{error}</div> : null}

          <div className="list-stack">
            {items.length === 0 ? <div className="empty-state">No audit logs found.</div> : items.map((item) => (
              <div className="timeline-card" key={item.id}>
                <div className="timeline-head">
                  <strong>{item.action}</strong>
                  <span className="status-chip approved">{item.entityType}</span>
                </div>
                <div className="timeline-meta stacked-meta">
                  <span>Actor: {item.actor?.name || 'System'}{item.actor?.role ? ` · ${item.actor.role}` : ''}</span>
                  <span>At: {new Date(item.createdAt).toLocaleString()}</span>
                  <span>Entity ID: {item.entityId}</span>
                  {Object.keys(item.metadata || {}).length ? <span>Metadata: {JSON.stringify(item.metadata)}</span> : null}
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </AppLayout>
  );
}
