import { useEffect, useMemo, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

function buildCsv(items) {
  const headers = ['Employee', 'Email', 'Amount', 'Status', 'Requested On', 'Repayment Plan', 'Reason', 'Paid On'];
  const rows = items.map((item) => [
    item.requestedBy?.name || '',
    item.requestedBy?.email || '',
    item.amount,
    item.status,
    new Date(item.createdAt).toLocaleDateString(),
    item.repaymentPlan,
    item.reason,
    item.paidAt ? new Date(item.paidAt).toLocaleDateString() : ''
  ]);

  return [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(','))
    .join('\n');
}

function downloadCsv(items) {
  const csv = buildCsv(items);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'advance-requests.csv';
  link.click();
  URL.revokeObjectURL(url);
}

function ActivityLog({ items }) {
  if (!items?.length) {
    return <div className="empty-state">No activity logged yet.</div>;
  }

  return (
    <div className="timeline-list">
      {items.map((item) => (
        <div className="timeline-event" key={item.id}>
          <div className="timeline-event-dot" />
          <div>
            <strong>{item.action.replace('advance.', '').replace('.', ' ')}</strong>
            <p>
              {item.actor?.name || 'System'} · {new Date(item.createdAt).toLocaleString()}
            </p>
            {item.metadata?.rejectionReason ? <small>Reason: {item.metadata.rejectionReason}</small> : null}
            {item.metadata?.note ? <small>Note: {item.metadata.note}</small> : null}
            {item.metadata?.paymentMode ? <small>Payment mode: {item.metadata.paymentMode}</small> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdvanceAdminPage() {
  const { hasPermission } = useAuth();
  const canApprove = hasPermission('advance', 'approve');
  const canPay = hasPermission('advance', 'pay');
  const [items, setItems] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [approvalNote, setApprovalNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [paymentModes, setPaymentModes] = useState([]);
  const [paymentForm, setPaymentForm] = useState({
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentMode: 'bank',
    reference: ''
  });

  async function loadItems() {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.set('limit', '50');
      if (statusFilter) params.set('status', statusFilter);
      if (search.trim()) params.set('q', search.trim());

      const { data } = await api.get(`/advances?${params.toString()}`);
      const nextItems = data.items || [];
      setItems(nextItems);

      if (!selectedId && nextItems.length) {
        setSelectedId(nextItems[0].id);
      } else if (selectedId && !nextItems.some((item) => item.id === selectedId)) {
        setSelectedId(nextItems[0]?.id || '');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  }

  async function loadDetail(id) {
    if (!id) {
      setDetail(null);
      return;
    }

    setDetailLoading(true);
    try {
      const { data } = await api.get(`/advances/${id}`);
      setDetail(data);
      setApprovalNote(data.advance?.adminNote || '');
      setRejectionReason(data.advance?.rejectionReason || '');
      setPaymentForm((prev) => ({
        ...prev,
        paymentDate: data.advance?.paidAt ? new Date(data.advance.paidAt).toISOString().slice(0, 10) : prev.paymentDate,
        paymentMode: data.advance?.paymentMode || prev.paymentMode,
        reference: data.advance?.reference || ''
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load request detail');
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    if (!canApprove && canPay) {
      setStatusFilter('approved');
    }
  }, [canApprove, canPay]);

  useEffect(() => {
    loadItems();
  }, [statusFilter]);

  useEffect(() => {
    async function loadSupportData() {
      try {
        const { data } = await api.get('/settings/form-options');
        const modes = data.masterData?.['payment-modes'] || [];
        setPaymentModes(modes);
        if (modes.length) {
          setPaymentForm((prev) => ({ ...prev, paymentMode: prev.paymentMode || modes[0].key }));
        }
      } catch {
        setPaymentModes([]);
      }
    }

    loadSupportData();
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadItems();
    }, 300);
    return () => window.clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    if (selectedId) {
      loadDetail(selectedId);
    }
  }, [selectedId]);

  const filteredItems = useMemo(() => items, [items]);

  const summary = useMemo(
    () => ({
      pending: items.filter((item) => item.status === 'pending').length,
      approved: items.filter((item) => item.status === 'approved').length,
      paid: items.filter((item) => item.status === 'paid').length,
      rejected: items.filter((item) => item.status === 'rejected').length
    }),
    [items]
  );

  async function refreshCurrentState() {
    await loadItems();
    if (selectedId) {
      await loadDetail(selectedId);
    }
  }

  async function approve() {
    if (!selectedId) return;
    setError('');
    setMessage('');
    try {
      await api.put(`/advances/${selectedId}/approve`, { note: approvalNote });
      setMessage('Request approved successfully. It is now available in the payout queue for roles with payout access.');
      await refreshCurrentState();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve request');
    }
  }

  async function reject() {
    if (!selectedId) return;
    setError('');
    setMessage('');
    try {
      await api.put(`/advances/${selectedId}/reject`, { rejectionReason });
      setMessage('Request rejected successfully. Employee notification has been created.');
      await refreshCurrentState();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject request');
    }
  }

  async function markPaid() {
    if (!selectedId) return;
    setError('');
    setMessage('');
    try {
      await api.put(`/advances/${selectedId}/pay`, paymentForm);
      setMessage('Payment recorded successfully by payout queue role and history log updated.');
      await refreshCurrentState();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark request as paid');
    }
  }

  return (
    <AppLayout
      eyebrow="Advance approval & payout"
      title="Advance Workflow"
      description="Separated workflow: approval can be handled by HR/approvers, while payout can be handled by Accounts or any role with advance.pay permission."
    >
      <section className="stats-grid compact-grid">
        <div className="stat-card">
          <p>Pending approval</p>
          <h3>{summary.pending}</h3>
          <small>Approval queue</small>
        </div>
        <div className="stat-card">
          <p>Approved awaiting payout</p>
          <h3>{summary.approved}</h3>
          <small>Payout queue</small>
        </div>
        <div className="stat-card">
          <p>Paid</p>
          <h3>{summary.paid}</h3>
          <small>Disbursement recorded</small>
        </div>
        <div className="stat-card">
          <p>Rejected</p>
          <h3>{summary.rejected}</h3>
          <small>Reason captured</small>
        </div>
      </section>

      {error ? <div className="alert alert-error">{error}</div> : null}
      {message ? <div className="alert alert-success">{message}</div> : null}

      <section className="two-column-layout">
        <article className="card card-elevated">
          <div className="section-header wrap-on-mobile">
            <div>
              <h3>Workflow responsibilities</h3>
              <p>Use permissions to split who approves vs who pays out.</p>
            </div>
          </div>
          <div className="feature-grid compact">
            <div className="feature-card">
              <strong>Approval access</strong>
              <span>{canApprove ? 'You can approve or reject pending requests.' : 'This role does not currently have approval access.'}</span>
            </div>
            <div className="feature-card">
              <strong>Payout access</strong>
              <span>{canPay ? 'You can process approved requests and mark them paid.' : 'This role does not currently have payout access.'}</span>
            </div>
          </div>
        </article>

        <article className="card card-elevated">
          <div className="section-header wrap-on-mobile">
            <div>
              <h3>Request queue</h3>
              <p>Filter, search, review, and export.</p>
            </div>
            <button className="secondary-button" type="button" onClick={() => downloadCsv(filteredItems)}>
              Export CSV
            </button>
          </div>

          <div className="filter-toolbar">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search employee, email, department..."
            />
            <div className="filter-row compact-wrap">
              <button className={`chip-button ${statusFilter === '' ? 'active' : ''}`} type="button" onClick={() => setStatusFilter('')}>
                All
              </button>
              <button className={`chip-button ${statusFilter === 'pending' ? 'active' : ''}`} type="button" onClick={() => setStatusFilter('pending')}>
                Pending approval
              </button>
              <button className={`chip-button ${statusFilter === 'approved' ? 'active' : ''}`} type="button" onClick={() => setStatusFilter('approved')}>
                Awaiting payout
              </button>
              <button className={`chip-button ${statusFilter === 'paid' ? 'active' : ''}`} type="button" onClick={() => setStatusFilter('paid')}>
                Paid
              </button>
              <button className={`chip-button ${statusFilter === 'rejected' ? 'active' : ''}`} type="button" onClick={() => setStatusFilter('rejected')}>
                Rejected
              </button>
            </div>
          </div>

          {loading ? <div className="empty-state">Loading requests...</div> : null}

          {!loading && filteredItems.length === 0 ? (
            <div className="empty-state">No requests found for this filter.</div>
          ) : (
            <div className="list-stack selectable-list">
              {filteredItems.map((item) => (
                <button
                  type="button"
                  className={`request-card selectable-card ${selectedId === item.id ? 'selected' : ''}`}
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                >
                  <div className="request-card-top">
                    <div>
                      <strong>{item.requestedBy?.name}</strong>
                      <p>{item.requestedBy?.email}</p>
                    </div>
                    <span className={`status-chip ${item.status}`}>{item.status}</span>
                  </div>

                  <div className="request-grid request-grid-compact">
                    <div>
                      <span className="muted-label">Amount</span>
                      <strong>₹{item.amount.toLocaleString('en-IN')}</strong>
                    </div>
                    <div>
                      <span className="muted-label">Requested</span>
                      <strong>{new Date(item.createdAt).toLocaleDateString()}</strong>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="single-column-layout">
        <article className="card detail-card card-elevated">
          <div className="section-header">
            <div>
              <h3>Review & action</h3>
              <p>Approval and payout are now separated so different departments or roles can own different workflow stages.</p>
            </div>
          </div>

          {detailLoading ? <div className="empty-state">Loading request detail...</div> : null}
          {!detailLoading && !detail?.advance ? <div className="empty-state">Select a request to review it.</div> : null}

          {detail?.advance ? (
            <div className="detail-stack">
              <div className="detail-grid">
                <div>
                  <span className="muted-label">Employee</span>
                  <strong>{detail.advance.requestedBy?.name}</strong>
                </div>
                <div>
                  <span className="muted-label">Department</span>
                  <strong>{detail.advance.requestedBy?.department || '—'}</strong>
                </div>
                <div>
                  <span className="muted-label">Amount</span>
                  <strong>₹{detail.advance.amount.toLocaleString('en-IN')}</strong>
                </div>
                <div>
                  <span className="muted-label">Status</span>
                  <strong className={`status-chip ${detail.advance.status}`}>{detail.advance.status}</strong>
                </div>
              </div>

              <div className="detail-section">
                <span className="muted-label">Reason</span>
                <p>{detail.advance.reason}</p>
              </div>

              <div className="detail-grid">
                <div>
                  <span className="muted-label">Repayment plan</span>
                  <strong>{detail.advance.repaymentPlan}</strong>
                </div>
                <div>
                  <span className="muted-label">Requested on</span>
                  <strong>{new Date(detail.advance.createdAt).toLocaleDateString()}</strong>
                </div>
                <div>
                  <span className="muted-label">Payment mode</span>
                  <strong>{detail.advance.paymentMode || '—'}</strong>
                </div>
                <div>
                  <span className="muted-label">Reference</span>
                  <strong>{detail.advance.reference || '—'}</strong>
                </div>
              </div>

              {detail.advance.notes ? (
                <div className="detail-section">
                  <span className="muted-label">Employee notes</span>
                  <p>{detail.advance.notes}</p>
                </div>
              ) : null}

              <div className="detail-section">
                <h4>Employee history</h4>
                <div className="mini-history-list">
                  {detail.history?.map((historyItem) => (
                    <div className="mini-history-item" key={historyItem.id}>
                      <div>
                        <strong>₹{historyItem.amount.toLocaleString('en-IN')}</strong>
                        <p>{historyItem.reason}</p>
                      </div>
                      <span className={`status-chip ${historyItem.status}`}>{historyItem.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {detail.advance.status === 'pending' && canApprove ? (
                <div className="detail-section action-panel-grid">
                  <div className="sub-card">
                    <h4>Approval queue</h4>
                    <label className="field">
                      <span>Approval note (optional)</span>
                      <textarea
                        rows="3"
                        value={approvalNote}
                        onChange={(event) => setApprovalNote(event.target.value)}
                        placeholder="Add context for the employee"
                      />
                    </label>
                    <button className="primary-button" type="button" onClick={approve}>
                      Approve request
                    </button>
                  </div>

                  <div className="sub-card danger-panel">
                    <h4>Reject request</h4>
                    <label className="field">
                      <span>Rejection reason</span>
                      <textarea
                        rows="3"
                        value={rejectionReason}
                        onChange={(event) => setRejectionReason(event.target.value)}
                        placeholder="Reason is required"
                      />
                    </label>
                    <button className="danger-button" type="button" onClick={reject} disabled={!rejectionReason.trim()}>
                      Reject request
                    </button>
                  </div>
                </div>
              ) : null}

              {detail.advance.status === 'approved' && canPay ? (
                <div className="detail-section sub-card">
                  <h4>Payout queue</h4>
                  <p className="helper-text">This request has already been approved and is waiting for payout processing.</p>
                  <div className="form-grid">
                    <label className="field">
                      <span>Payment date</span>
                      <input
                        type="date"
                        value={paymentForm.paymentDate}
                        max={new Date().toISOString().slice(0, 10)}
                        onChange={(event) =>
                          setPaymentForm((prev) => ({ ...prev, paymentDate: event.target.value }))
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Payment mode</span>
                      <select
                        value={paymentForm.paymentMode}
                        onChange={(event) =>
                          setPaymentForm((prev) => ({ ...prev, paymentMode: event.target.value }))
                        }
                      >
                        {(paymentModes.length ? paymentModes : [{ key: 'bank', label: 'Bank' }, { key: 'cash', label: 'Cash' }, { key: 'upi', label: 'UPI' }]).map((mode) => (
                          <option key={mode.id || mode.key} value={mode.key}>{mode.label}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className="field">
                    <span>Reference number</span>
                    <input
                      type="text"
                      value={paymentForm.reference}
                      onChange={(event) => setPaymentForm((prev) => ({ ...prev, reference: event.target.value }))}
                      placeholder="Optional reference"
                    />
                  </label>

                  <button className="secondary-button" type="button" onClick={markPaid}>
                    Mark as paid
                  </button>
                </div>
              ) : null}

              {detail.advance.status === 'approved' && !canPay ? (
                <div className="empty-state">This request has been approved and is waiting for payout by a role or department with advance payout access.</div>
              ) : null}

              <div className="detail-section">
                <h4>Activity log</h4>
                <ActivityLog items={detail.activityLog} />
              </div>
            </div>
          ) : null}
        </article>
      </section>
    </AppLayout>
  );
}
