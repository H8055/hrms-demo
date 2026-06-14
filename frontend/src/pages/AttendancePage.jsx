import { useEffect, useMemo, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const apiOrigin = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

export default function AttendancePage() {
  const { hasPermission } = useAuth();
  const canApprove = hasPermission('attendance', 'approve');
  const canExport = hasPermission('attendance', 'export');
  const [summary, setSummary] = useState(null);
  const [supportData, setSupportData] = useState({ masterData: {} });
  const [myItems, setMyItems] = useState([]);
  const [adminItems, setAdminItems] = useState([]);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), reason: '', requestedCheckIn: '', requestedCheckOut: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadSupportData() {
    try {
      const { data } = await api.get('/settings/form-options');
      setSupportData({ masterData: data.masterData || {} });
    } catch {
      setSupportData({ masterData: {} });
    }
  }

  async function loadData() {
    try {
      const requests = [api.get('/attendance/summary'), api.get('/attendance/mine')];
      if (canApprove) requests.push(api.get('/attendance'));
      const [summaryRes, mineRes, adminRes] = await Promise.all(requests);
      setSummary(summaryRes.data);
      setMyItems(mineRes.data.items || []);
      setAdminItems(adminRes?.data?.items || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load attendance');
    }
  }

  useEffect(() => {
    loadSupportData();
    loadData();
  }, [canApprove]);

  const pendingRegularizations = useMemo(
    () => adminItems.filter((item) => item.status === 'regularization-pending' || item.regularization?.status === 'pending'),
    [adminItems]
  );

  const shifts = supportData.masterData.shifts || [];
  const holidays = supportData.masterData.holidays || [];

  async function doCheckIn() {
    try {
      await api.post('/attendance/check-in');
      setMessage('Checked in successfully.');
      setError('');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Check-in failed');
    }
  }

  async function doCheckOut() {
    try {
      await api.post('/attendance/check-out');
      setMessage('Checked out successfully.');
      setError('');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Check-out failed');
    }
  }

  async function submitRegularization(event) {
    event.preventDefault();
    try {
      await api.post('/attendance/regularize', form);
      setMessage('Regularization submitted.');
      setError('');
      setForm({ date: new Date().toISOString().slice(0, 10), reason: '', requestedCheckIn: '', requestedCheckOut: '' });
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit regularization');
    }
  }

  async function decideRegularization(id, decision) {
    const comment = window.prompt(`Optional comment for ${decision}`) || '';
    try {
      await api.put(`/attendance/${id}/regularization-decision`, { decision, comment });
      setMessage(`Regularization ${decision}.`);
      setError('');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update regularization');
    }
  }

  function exportCsv() {
    window.open(`${apiOrigin}/api/attendance/export/csv`, '_blank', 'noopener,noreferrer');
  }

  return (
    <AppLayout title="Attendance" description="Sprint 3 implementation with check-in/out, regularization, configured shifts, holidays, and CSV export.">
      <section className="stats-grid compact-grid">
        <div className="stat-card"><p>Present</p><h3>{summary?.present ?? 0}</h3><small>Recorded attendance days</small></div>
        <div className="stat-card"><p>On leave</p><h3>{summary?.onLeave ?? 0}</h3><small>Approved leave days</small></div>
        <div className="stat-card"><p>Absent</p><h3>{summary?.absent ?? 0}</h3><small>No attendance or rejected regularization</small></div>
        <div className="stat-card"><p>Pending regularization</p><h3>{summary?.pendingRegularization ?? 0}</h3><small>Awaiting review</small></div>
      </section>

      {error ? <div className="alert alert-error">{error}</div> : null}
      {message ? <div className="alert alert-success">{message}</div> : null}

      <section className="split-layout">
        <article className="card">
          <div className="section-header wrap-on-mobile">
            <div>
              <h3>My attendance actions</h3>
              <p>Check-in/out and raise regularization requests.</p>
            </div>
            <div className="action-row compact-wrap">
              {canExport ? <button className="secondary-button small" type="button" onClick={exportCsv}>Export CSV</button> : null}
              <button className="primary-button small" type="button" onClick={doCheckIn}>Check in</button>
              <button className="secondary-button small" type="button" onClick={doCheckOut}>Check out</button>
            </div>
          </div>

          <form className="detail-stack" onSubmit={submitRegularization}>
            <div className="detail-grid">
              <label className="field"><span>Date</span><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></label>
              <label className="field"><span>Requested check-in</span><input type="datetime-local" value={form.requestedCheckIn} onChange={(e) => setForm({ ...form, requestedCheckIn: e.target.value })} /></label>
              <label className="field"><span>Requested check-out</span><input type="datetime-local" value={form.requestedCheckOut} onChange={(e) => setForm({ ...form, requestedCheckOut: e.target.value })} /></label>
            </div>
            <label className="field"><span>Reason</span><textarea rows="3" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required /></label>
            <button className="primary-button" type="submit">Submit regularization</button>
          </form>

          <div className="detail-section">
            <h4>Configured shifts</h4>
            <div className="mini-history-list">
              {shifts.length === 0 ? <div className="empty-state">No shifts configured yet.</div> : shifts.map((shift) => (
                <div className="mini-history-item" key={shift.id}>
                  <div>
                    <strong>{shift.label}</strong>
                    <p>{shift.description || 'Configured from settings master data'}</p>
                  </div>
                  <span>{shift.metadata?.startTime || '—'} to {shift.metadata?.endTime || '—'}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="detail-section">
            <h4>Upcoming holidays</h4>
            <div className="mini-history-list">
              {holidays.length === 0 ? <div className="empty-state">No holidays configured yet.</div> : holidays.slice(0, 8).map((holiday) => (
                <div className="mini-history-item" key={holiday.id}>
                  <div>
                    <strong>{holiday.label}</strong>
                    <p>{holiday.description || 'Holiday master from settings'}</p>
                  </div>
                  <span>{holiday.metadata?.date || 'Date not set'}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="detail-section">
            <h4>My recent records</h4>
            <div className="list-stack">
              {myItems.slice(0, 12).map((item) => (
                <div className="timeline-card" key={item.id}>
                  <div className="timeline-head"><strong>{new Date(item.date).toLocaleDateString()}</strong><span className={`status-chip ${item.status}`}>{item.status}</span></div>
                  <div className="timeline-meta stacked-meta">
                    <span>Check in: {item.checkIn ? new Date(item.checkIn).toLocaleString() : '—'}</span>
                    <span>Check out: {item.checkOut ? new Date(item.checkOut).toLocaleString() : '—'}</span>
                    {item.regularization?.reason ? <span>Regularization: {item.regularization.reason}</span> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="card detail-card">
          <div className="section-header">
            <div>
              <h3>{canApprove ? 'Attendance admin queue' : 'Attendance guidance'}</h3>
              <p>{canApprove ? 'Review pending regularization requests and view all records.' : 'Your manager or HR will review regularization requests.'}</p>
            </div>
          </div>

          {!canApprove ? (
            <div className="empty-state">You can check in/out from this page, and all history stays visible here.</div>
          ) : (
            <div className="detail-stack">
              <div className="detail-section">
                <h4>Pending regularizations</h4>
                <div className="list-stack">
                  {pendingRegularizations.length === 0 ? <div className="empty-state">No pending regularizations.</div> : pendingRegularizations.map((item) => (
                    <div className="request-card" key={item.id}>
                      <div className="request-card-top">
                        <div>
                          <strong>{item.user?.name}</strong>
                          <p>{new Date(item.date).toLocaleDateString()}</p>
                        </div>
                        <span className="status-chip pending">pending</span>
                      </div>
                      <p>{item.regularization?.reason}</p>
                      <div className="action-row">
                        <button className="primary-button small" type="button" onClick={() => decideRegularization(item.id, 'approved')}>Approve</button>
                        <button className="danger-button small" type="button" onClick={() => decideRegularization(item.id, 'rejected')}>Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="detail-section">
                <h4>All attendance records</h4>
                <div className="mini-history-list">
                  {adminItems.slice(0, 20).map((item) => (
                    <div className="mini-history-item" key={item.id}>
                      <div>
                        <strong>{item.user?.name}</strong>
                        <p>{new Date(item.date).toLocaleDateString()} · {item.user?.department || '—'}</p>
                      </div>
                      <span className={`status-chip ${item.status}`}>{item.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </article>
      </section>
    </AppLayout>
  );
}
