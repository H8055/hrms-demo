import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { api } from '../api/client';

const FIELD_LABELS = {
  phone: 'Phone',
  address: 'Address',
  photoUrl: 'Photo URL',
  dateOfBirth: 'Date of birth',
  gender: 'Gender',
  bloodGroup: 'Blood group',
  maritalStatus: 'Marital status',
  emergencyContactName: 'Emergency contact name',
  emergencyContactPhone: 'Emergency contact phone',
  'bankDetails.accountName': 'Bank account name',
  'bankDetails.accountNumber': 'Bank account number',
  'bankDetails.ifsc': 'Bank IFSC'
};

function formatDate(v) {
  if (!v) return '—';
  return new Date(v).toLocaleString();
}

function ChangeCard({ req, onReviewed }) {
  const [reviewNote, setReviewNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(decision) {
    setBusy(true);
    setError('');
    try {
      await api.put(`/profile/change-requests/${req.id}/review`, { decision, reviewNote });
      onReviewed(req.id, decision);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed');
      setBusy(false);
    }
  }

  const isPending = req.status === 'pending';

  return (
    <article className="card" style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <strong>{req.user?.name || 'Unknown'}</strong>
          <span className="muted-label" style={{ marginLeft: '0.5rem' }}>{req.user?.email}</span>
          <p className="muted-label" style={{ marginTop: '0.25rem', fontSize: '0.8rem' }}>
            Submitted {formatDate(req.createdAt)}
          </p>
          {req.note ? <p style={{ marginTop: '0.25rem', fontStyle: 'italic', fontSize: '0.85rem' }}>Note: {req.note}</p> : null}
        </div>
        <span className={`status-badge status-${req.status}`}>{req.status}</span>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.75rem', fontSize: '0.875rem' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '0.4rem 0.5rem', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontWeight: 500 }}>Field</th>
            <th style={{ textAlign: 'left', padding: '0.4rem 0.5rem', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontWeight: 500 }}>Current value</th>
            <th style={{ textAlign: 'left', padding: '0.4rem 0.5rem', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontWeight: 500 }}>Requested value</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(req.changes || {}).map(([key, val]) => (
            <tr key={key}>
              <td style={{ padding: '0.4rem 0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>{FIELD_LABELS[key] || key}</td>
              <td style={{ padding: '0.4rem 0.5rem', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>{String(req.previousValues?.[key] ?? '—')}</td>
              <td style={{ padding: '0.4rem 0.5rem', borderBottom: '1px solid var(--border-subtle)', fontWeight: 600, color: 'var(--primary)' }}>{String(val)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {!isPending ? (
        <div style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>
          <span className="muted-label">Reviewed by {req.reviewedBy?.name} · {formatDate(req.reviewedAt)}</span>
          {req.reviewNote ? <span className="muted-label"> · Note: {req.reviewNote}</span> : null}
        </div>
      ) : (
        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="field" style={{ flex: 1, minWidth: '200px', margin: 0 }}>
            <span>Review note (optional)</span>
            <input
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder="Reason for rejection, or leave blank to approve"
              disabled={busy}
            />
          </div>
          <button className="primary-button small" onClick={() => submit('approved')} disabled={busy}>Approve</button>
          <button className="danger-button small" onClick={() => submit('rejected')} disabled={busy}>Reject</button>
        </div>
      )}
      {error ? <p className="text-danger" style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>{error}</p> : null}
    </article>
  );
}

export default function ChangeRequestsPage() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const res = await api.get(`/profile/change-requests${params}`);
      setItems(res.data.items || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [filter]);

  function onReviewed(id, decision) {
    setItems((prev) => prev.map((r) => r.id === id ? { ...r, status: decision } : r));
    if (filter === 'pending') {
      setTimeout(() => setItems((prev) => prev.filter((r) => r.id !== id)), 1200);
    }
  }

  const pending = items.filter((r) => r.status === 'pending').length;

  return (
    <AppLayout title="Profile Change Requests" description="Review and action employee self-service update requests.">
      {error ? <div className="alert alert-error">{error}</div> : null}

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
        {['pending', 'approved', 'rejected', 'all'].map((f) => (
          <button
            key={f}
            className={filter === f ? 'primary-button small' : 'secondary-button small'}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'pending' && pending > 0 ? ` (${pending})` : ''}
          </button>
        ))}
        <button className="secondary-button small" onClick={load} style={{ marginLeft: 'auto' }}>Refresh</button>
      </div>

      {loading ? (
        <div className="empty-state">Loading...</div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          {filter === 'pending' ? 'No pending change requests.' : `No ${filter} requests found.`}
        </div>
      ) : (
        items.map((req) => (
          <ChangeCard key={req.id} req={req} onReviewed={onReviewed} />
        ))
      )}
    </AppLayout>
  );
}
