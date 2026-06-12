import { useEffect, useMemo, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const initialForm = {
  leaveType: 'annual',
  fromDate: new Date().toISOString().slice(0, 10),
  toDate: new Date().toISOString().slice(0, 10),
  reason: ''
};

export default function LeavePage() {
  const { user } = useAuth();
  const isElevated = ['admin', 'hr', 'manager'].includes(user.role);
  const [form, setForm] = useState(initialForm);
  const [summary, setSummary] = useState(null);
  const [myItems, setMyItems] = useState([]);
  const [adminItems, setAdminItems] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadData() {
    try {
      const requests = [api.get('/leaves/summary'), api.get('/leaves/mine')];
      if (isElevated) requests.push(api.get('/leaves'));
      const [summaryRes, mineRes, adminRes] = await Promise.all(requests);
      setSummary(summaryRes.data);
      setMyItems(mineRes.data.items || []);
      setAdminItems(adminRes?.data?.items || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load leave data');
    }
  }

  useEffect(() => {
    loadData();
  }, [isElevated]);

  const pendingLeaves = useMemo(() => adminItems.filter((item) => item.status === 'pending'), [adminItems]);

  async function submitLeave(event) {
    event.preventDefault();
    try {
      await api.post('/leaves', form);
      setMessage('Leave request submitted.');
      setError('');
      setForm(initialForm);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit leave request');
    }
  }

  async function decideLeave(id, decision) {
    const comment = window.prompt(`Optional comment for ${decision}`) || '';
    try {
      await api.put(`/leaves/${id}/decision`, { decision, comment });
      setMessage(`Leave ${decision}.`);
      setError('');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update leave decision');
    }
  }

  return (
    <AppLayout title="Leave Management" description="Sprint 4 MVP: leave application, approval flow, balances, and history.">
      <section className="stats-grid compact-grid">
        <div className="stat-card"><p>Annual balance</p><h3>{summary?.balances?.annual ?? 0}</h3><small>Remaining annual leaves</small></div>
        <div className="stat-card"><p>Sick balance</p><h3>{summary?.balances?.sick ?? 0}</h3><small>Remaining sick leaves</small></div>
        <div className="stat-card"><p>Pending</p><h3>{summary?.pending ?? 0}</h3><small>Awaiting approval</small></div>
        <div className="stat-card"><p>Approved days</p><h3>{summary?.totalDaysApproved ?? 0}</h3><small>Total approved leave days</small></div>
      </section>

      {error ? <div className="alert alert-error">{error}</div> : null}
      {message ? <div className="alert alert-success">{message}</div> : null}

      <section className="split-layout">
        <article className="card">
          <div className="section-header">
            <div>
              <h3>Apply for leave</h3>
              <p>Select type, date range, and reason.</p>
            </div>
          </div>
          <form className="detail-stack" onSubmit={submitLeave}>
            <div className="detail-grid">
              <label className="field"><span>Leave type</span><select value={form.leaveType} onChange={(e) => setForm({ ...form, leaveType: e.target.value })}><option value="annual">Annual</option><option value="sick">Sick</option><option value="casual">Casual</option><option value="unpaid">Unpaid</option></select></label>
              <label className="field"><span>From date</span><input type="date" value={form.fromDate} onChange={(e) => setForm({ ...form, fromDate: e.target.value })} required /></label>
              <label className="field"><span>To date</span><input type="date" value={form.toDate} onChange={(e) => setForm({ ...form, toDate: e.target.value })} required /></label>
            </div>
            <label className="field"><span>Reason</span><textarea rows="3" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required /></label>
            <button className="primary-button" type="submit">Submit leave request</button>
          </form>

          <div className="detail-section">
            <h4>My leave history</h4>
            <div className="list-stack">
              {myItems.map((item) => (
                <div className="timeline-card" key={item.id}>
                  <div className="timeline-head"><strong>{item.leaveType}</strong><span className={`status-chip ${item.status}`}>{item.status}</span></div>
                  <p>{item.reason}</p>
                  <div className="timeline-meta stacked-meta">
                    <span>{new Date(item.fromDate).toLocaleDateString()} → {new Date(item.toDate).toLocaleDateString()}</span>
                    <span>{item.days} day(s)</span>
                    {item.managerComment ? <span>Comment: {item.managerComment}</span> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="card detail-card">
          <div className="section-header">
            <div>
              <h3>{isElevated ? 'Approval queue' : 'Approval flow'}</h3>
              <p>{isElevated ? 'Approve or reject leave requests.' : 'Your request will notify HR / managers for review.'}</p>
            </div>
          </div>
          {!isElevated ? (
            <div className="empty-state">You can track all leave decisions from this page.</div>
          ) : (
            <div className="detail-stack">
              <div className="detail-section">
                <h4>Pending leave approvals</h4>
                <div className="list-stack">
                  {pendingLeaves.length === 0 ? <div className="empty-state">No pending leave requests.</div> : pendingLeaves.map((item) => (
                    <div className="request-card" key={item.id}>
                      <div className="request-card-top"><div><strong>{item.user?.name}</strong><p>{item.leaveType} · {item.days} day(s)</p></div><span className="status-chip pending">pending</span></div>
                      <p>{item.reason}</p>
                      <div className="action-row"><button className="primary-button small" type="button" onClick={() => decideLeave(item.id, 'approved')}>Approve</button><button className="danger-button small" type="button" onClick={() => decideLeave(item.id, 'rejected')}>Reject</button></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="detail-section">
                <h4>Recent team requests</h4>
                <div className="mini-history-list">
                  {adminItems.slice(0, 20).map((item) => (
                    <div className="mini-history-item" key={item.id}><div><strong>{item.user?.name}</strong><p>{item.leaveType} · {item.days} day(s)</p></div><span className={`status-chip ${item.status}`}>{item.status}</span></div>
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
