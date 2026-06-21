import { useEffect, useMemo, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function LeavePage() {
  const { hasPermission } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const canApprove = hasPermission('leave', 'approve');
  const [supportData, setSupportData] = useState({ masterData: {} });
  const [form, setForm] = useState({
    leaveType: 'annual',
    fromDate: new Date().toISOString().slice(0, 10),
    toDate: new Date().toISOString().slice(0, 10),
    reason: ''
  });
  const [summary, setSummary] = useState(null);
  const [myItems, setMyItems] = useState([]);
  const [adminItems, setAdminItems] = useState([]);

  async function loadSupportData() {
    try {
      const { data } = await api.get('/settings/form-options');
      setSupportData({ masterData: data.masterData || {} });
      const leaveTypes = data.masterData?.['leave-types'] || [];
      if (leaveTypes.length) {
        setForm((prev) => ({ ...prev, leaveType: prev.leaveType || leaveTypes[0].key }));
      }
    } catch {
      setSupportData({ masterData: {} });
    }
  }

  async function loadData() {
    try {
      const requests = [api.get('/leaves/summary'), api.get('/leaves/mine')];
      if (canApprove) requests.push(api.get('/leaves'));
      const [summaryRes, mineRes, adminRes] = await Promise.all(requests);
      setSummary(summaryRes.data);
      setMyItems(mineRes.data.items || []);
      setAdminItems(adminRes?.data?.items || []);
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to load leave data');
    }
  }

  useEffect(() => {
    loadSupportData();
    loadData();
  }, [canApprove]);

  const pendingLeaves = useMemo(() => adminItems.filter((item) => item.status === 'pending'), [adminItems]);
  const leaveTypes = supportData.masterData['leave-types'] || [];
  const balanceEntries = Object.entries(summary?.balances || {});

  async function submitLeave(event) {
    event.preventDefault();
    try {
      await api.post('/leaves', form);
      toastSuccess('Leave request submitted.');
      setForm({
        leaveType: leaveTypes[0]?.key || 'annual',
        fromDate: new Date().toISOString().slice(0, 10),
        toDate: new Date().toISOString().slice(0, 10),
        reason: ''
      });
      loadData();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to submit leave request');
    }
  }

  async function decideLeave(id, decision) {
    const comment = window.prompt(`Optional comment for ${decision}`) || '';
    try {
      await api.put(`/leaves/${id}/decision`, { decision, comment });
      toastSuccess(`Leave ${decision}.`);
      loadData();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to update leave decision');
    }
  }

  return (
    <AppLayout title="Leave Management" description="Dynamic leave types, balances, application flow, and approvals.">
      <section className="stats-grid compact-grid">
        {balanceEntries.slice(0, 3).map(([key, value]) => (
          <div className="stat-card" key={key}><p>{key}</p><h3>{value}</h3><small>Available balance</small></div>
        ))}
        <div className="stat-card"><p>Pending</p><h3>{summary?.pending ?? 0}</h3><small>Awaiting approval</small></div>
      </section>

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
              <label className="field"><span>Leave type</span><select value={form.leaveType} onChange={(e) => setForm({ ...form, leaveType: e.target.value })}>{leaveTypes.map((item) => <option key={item.id} value={item.key}>{item.label}</option>)}</select></label>
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
              <h3>{canApprove ? 'Approval queue' : 'Approval flow'}</h3>
              <p>{canApprove ? 'Approve or reject leave requests.' : 'Your request will notify HR / managers for review.'}</p>
            </div>
          </div>
          {!canApprove ? (
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
