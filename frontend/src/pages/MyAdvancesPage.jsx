import { useEffect, useMemo, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { api } from '../api/client';

function Timeline({ activityLog }) {
  if (!activityLog?.length) {
    return <div className="empty-state">No activity log available yet.</div>;
  }

  return (
    <div className="timeline-list">
      {activityLog.map((item) => (
        <div className="timeline-event" key={item.id}>
          <div className="timeline-event-dot" />
          <div>
            <strong>{item.action.replace('advance.', '').replace('.', ' ')}</strong>
            <p>
              {item.actor?.name || 'System'} · {new Date(item.createdAt).toLocaleString()}
            </p>
            {item.metadata?.rejectionReason ? <small>Reason: {item.metadata.rejectionReason}</small> : null}
            {item.metadata?.paymentMode ? <small>Payment mode: {item.metadata.paymentMode}</small> : null}
            {item.metadata?.note ? <small>Note: {item.metadata.note}</small> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MyAdvancesPage() {
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  async function loadItems() {
    setLoading(true);
    try {
      const { data } = await api.get('/advances/mine');
      const nextItems = data.items || [];
      setItems(nextItems);
      if (nextItems.length && !selectedId) {
        setSelectedId(nextItems[0].id);
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadDetail(id) {
    if (!id) return;
    setDetailLoading(true);
    try {
      const { data } = await api.get(`/advances/${id}`);
      setDetail(data);
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    if (selectedId) {
      loadDetail(selectedId);
    }
  }, [selectedId]);

  useEffect(() => {
    if (!items.length) return;
    const selectedStillExists = items.some((item) => item.id === selectedId);
    if (!selectedStillExists) {
      setSelectedId(items[0].id);
    }
  }, [items, selectedId]);

  const summary = useMemo(
    () => ({
      pending: items.filter((item) => item.status === 'pending').length,
      approved: items.filter((item) => item.status === 'approved').length,
      paid: items.filter((item) => item.status === 'paid').length
    }),
    [items]
  );

  return (
    <AppLayout
      title="My Advance Requests"
      description="Employee-visible request history, payment status, and activity log based on your reference flow."
    >
      <section className="stats-grid compact-grid">
        <div className="stat-card">
          <p>Total requests</p>
          <h3>{items.length}</h3>
          <small>All submitted requests</small>
        </div>
        <div className="stat-card">
          <p>Pending</p>
          <h3>{summary.pending}</h3>
          <small>Waiting for review</small>
        </div>
        <div className="stat-card">
          <p>Approved</p>
          <h3>{summary.approved}</h3>
          <small>Ready for payment</small>
        </div>
        <div className="stat-card">
          <p>Paid</p>
          <h3>{summary.paid}</h3>
          <small>Disbursed requests</small>
        </div>
      </section>

      <section className="split-layout">
        <article className="card">
          <div className="section-header">
            <div>
              <h3>History</h3>
              <p>Newest requests first.</p>
            </div>
          </div>

          {loading ? <div className="empty-state">Loading...</div> : null}

          {!loading && items.length === 0 ? (
            <div className="empty-state">No advance requests yet.</div>
          ) : (
            <div className="list-stack selectable-list">
              {items.map((item) => (
                <button
                  type="button"
                  className={`timeline-card selectable-card ${selectedId === item.id ? 'selected' : ''}`}
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                >
                  <div className="timeline-head">
                    <strong>₹{item.amount.toLocaleString('en-IN')}</strong>
                    <span className={`status-chip ${item.status}`}>{item.status}</span>
                  </div>
                  <p>{item.reason}</p>
                  <div className="timeline-meta stacked-meta">
                    <span>Requested: {new Date(item.createdAt).toLocaleDateString()}</span>
                    <span>Plan: {item.repaymentPlan}</span>
                    {item.rejectionReason ? <span>Reason: {item.rejectionReason}</span> : null}
                  </div>
                </button>
              ))}
            </div>
          )}
        </article>

        <article className="card detail-card">
          <div className="section-header">
            <div>
              <h3>Request details</h3>
              <p>Visible to employee and admin, matching the diagram flow.</p>
            </div>
          </div>

          {detailLoading ? <div className="empty-state">Loading details...</div> : null}

          {!detailLoading && !detail?.advance ? (
            <div className="empty-state">Select a request to view status history.</div>
          ) : null}

          {detail?.advance ? (
            <div className="detail-stack">
              <div className="detail-grid">
                <div>
                  <span className="muted-label">Status</span>
                  <strong className={`status-chip ${detail.advance.status}`}>{detail.advance.status}</strong>
                </div>
                <div>
                  <span className="muted-label">Amount</span>
                  <strong>₹{detail.advance.amount.toLocaleString('en-IN')}</strong>
                </div>
                <div>
                  <span className="muted-label">Repayment plan</span>
                  <strong>{detail.advance.repaymentPlan}</strong>
                </div>
                <div>
                  <span className="muted-label">Reference</span>
                  <strong>{detail.advance.reference || '—'}</strong>
                </div>
              </div>

              <div className="detail-section">
                <span className="muted-label">Reason</span>
                <p>{detail.advance.reason}</p>
              </div>

              {detail.advance.notes ? (
                <div className="detail-section">
                  <span className="muted-label">Employee notes</span>
                  <p>{detail.advance.notes}</p>
                </div>
              ) : null}

              {detail.advance.adminNote ? (
                <div className="detail-section">
                  <span className="muted-label">Admin note</span>
                  <p>{detail.advance.adminNote}</p>
                </div>
              ) : null}

              {detail.advance.rejectionReason ? (
                <div className="detail-section">
                  <span className="muted-label">Rejection reason</span>
                  <p>{detail.advance.rejectionReason}</p>
                </div>
              ) : null}

              <div className="detail-section">
                <h4>Activity log</h4>
                <Timeline activityLog={detail.activityLog} />
              </div>
            </div>
          ) : null}
        </article>
      </section>
    </AppLayout>
  );
}
