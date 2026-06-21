import { useEffect, useState } from 'react';
import { useToast } from '../context/ToastContext';
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

const CATEGORY_LABELS = { kyc: 'KYC', employment: 'Employment', salary: 'Salary', general: 'General' };
const STATUS_COLORS = { pending: '#f59e0b', verified: '#22c55e', rejected: '#ef4444' };

function formatDate(v) {
  if (!v) return '—';
  return new Date(v).toLocaleString();
}

// ── Profile update change-request card ──────────────────────────────────────
function ChangeCard({ req, onReviewed }) {
  const { error: toastError } = useToast();
  const [reviewNote, setReviewNote] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(decision) {
    setBusy(true);
    try {
      await api.put(`/profile/change-requests/${req.id}/review`, { decision, reviewNote });
      onReviewed(req.id, decision);
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed');
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
    </article>
  );
}

// ── Document verification card ───────────────────────────────────────────────
function DocVerifyCard({ doc, onVerified }) {
  const { error: toastError } = useToast();
  const [remarks, setRemarks] = useState('');
  const [busy, setBusy] = useState(false);
  const [viewing, setViewing] = useState(false);

  const userId = doc.user?.id || doc.user;

  async function viewDocument() {
    setViewing(true);
    try {
      const res = await api.get(`/employees/${userId}/documents/${doc.id}/download`, { responseType: 'blob' });
      // Supabase: backend returns JSON { url } — parse blob as text to check
      const text = await res.data.text();
      let url;
      try {
        const parsed = JSON.parse(text);
        if (parsed.url) {
          url = parsed.url;
        }
      } catch (_) {
        // binary — create a blob URL
        url = URL.createObjectURL(new Blob([res.data], { type: res.headers['content-type'] || doc.mimeType }));
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      toastError(err.response?.data?.message || 'Could not open document');
    } finally {
      setViewing(false);
    }
  }

  async function submit(status) {
    setBusy(true);
    try {
      await api.put(`/employees/${userId}/documents/${doc.id}/verify`, { status, remarks });
      onVerified(doc.id, status);
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed');
      setBusy(false);
    }
  }

  const isPending = doc.status === 'pending';
  const statusColor = STATUS_COLORS[doc.status] || '#888';

  return (
    <article className="card" style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <strong>{doc.user?.name || 'Unknown employee'}</strong>
          <span className="muted-label" style={{ marginLeft: '0.5rem' }}>{doc.user?.email}</span>
          {doc.user?.department ? <span className="muted-label" style={{ marginLeft: '0.5rem' }}>· {doc.user.department}</span> : null}
          <p className="muted-label" style={{ marginTop: '0.25rem', fontSize: '0.8rem' }}>
            Uploaded {formatDate(doc.uploadedAt)} · {doc.originalName} · {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : ''}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            className="secondary-button small"
            onClick={viewDocument}
            disabled={viewing}
            title="Open document in new tab"
          >
            {viewing ? 'Opening…' : '↗ View'}
          </button>
          <span className={`status-badge status-${doc.status}`}>{doc.status}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.6rem', flexWrap: 'wrap', fontSize: '0.875rem' }}>
        <div><span className="muted-label">Category</span> <strong>{CATEGORY_LABELS[doc.category] || doc.category}</strong></div>
        <div><span className="muted-label">Type</span> <strong>{doc.subType || '—'}</strong></div>
        {doc.documentNumber ? <div><span className="muted-label">Doc No.</span> <strong>{doc.documentNumber}</strong></div> : null}
        {doc.expiryDate ? <div><span className="muted-label">Expires</span> <strong>{new Date(doc.expiryDate).toLocaleDateString()}</strong></div> : null}
      </div>

      {!isPending ? (
        <div style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>
          {doc.verifiedBy ? <span className="muted-label">{doc.status === 'verified' ? 'Verified' : 'Rejected'} by {doc.verifiedBy?.name} · {formatDate(doc.verifiedAt)}</span> : null}
          {doc.remarks ? <span className="muted-label"> · Reason: {doc.remarks}</span> : null}
        </div>
      ) : (
        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="field" style={{ flex: 1, minWidth: '200px', margin: 0 }}>
            <span>Remarks (required for rejection)</span>
            <input
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add remarks (e.g. image not clear)"
              disabled={busy}
            />
          </div>
          <button className="primary-button small" onClick={() => submit('verified')} disabled={busy}>Verify</button>
          <button className="danger-button small" onClick={() => submit('rejected')} disabled={busy}>Reject</button>
        </div>
      )}
    </article>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function ChangeRequestsPage() {
  const { error: toastError } = useToast();
  const [activeTab, setActiveTab] = useState('profile');

  // Profile change requests state
  const [crItems, setCrItems] = useState([]);
  const [crFilter, setCrFilter] = useState('pending');
  const [crLoading, setCrLoading] = useState(true);

  // Document verification state
  const [docItems, setDocItems] = useState([]);
  const [docFilter, setDocFilter] = useState('pending');
  const [docLoading, setDocLoading] = useState(true);

  async function loadCR() {
    setCrLoading(true);
    try {
      const params = crFilter !== 'all' ? `?status=${crFilter}` : '';
      const res = await api.get(`/profile/change-requests${params}`);
      setCrItems(res.data.items || []);
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to load requests');
    } finally {
      setCrLoading(false);
    }
  }

  async function loadDocs() {
    setDocLoading(true);
    try {
      const params = docFilter !== 'all' ? `?status=${docFilter}` : '';
      const res = await api.get(`/employees/documents/all${params}`);
      setDocItems(res.data.items || []);
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to load documents');
    } finally {
      setDocLoading(false);
    }
  }

  useEffect(() => { loadCR(); }, [crFilter]);
  useEffect(() => { loadDocs(); }, [docFilter]);

  function onCRReviewed(id, decision) {
    setCrItems((prev) => prev.map((r) => r.id === id ? { ...r, status: decision } : r));
    if (crFilter === 'pending') {
      setTimeout(() => setCrItems((prev) => prev.filter((r) => r.id !== id)), 1000);
    }
  }

  function onDocVerified(id, status) {
    setDocItems((prev) => prev.map((d) => d.id === id ? { ...d, status } : d));
    if (docFilter === 'pending') {
      setTimeout(() => setDocItems((prev) => prev.filter((d) => d.id !== id)), 1000);
    }
  }

  const pendingCR = crItems.filter((r) => r.status === 'pending').length;
  const pendingDocs = docItems.filter((d) => d.status === 'pending').length;

  return (
    <AppLayout title="Change Requests" description="Review profile update requests and verify employee documents.">

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '2px solid var(--border)', paddingBottom: '0' }}>
        {[
          { key: 'profile', label: 'Profile Updates', count: pendingCR },
          { key: 'documents', label: 'Document Verification', count: pendingDocs }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.key ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: '-2px',
              padding: '0.6rem 1rem',
              cursor: 'pointer',
              fontWeight: activeTab === tab.key ? 700 : 400,
              color: activeTab === tab.key ? 'var(--primary)' : 'var(--text-muted)',
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span style={{ background: 'var(--primary)', color: '#fff', borderRadius: '10px', padding: '1px 7px', fontSize: '0.75rem', fontWeight: 700 }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Profile Updates tab ── */}
      {activeTab === 'profile' && (
        <>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {['pending', 'approved', 'rejected', 'all'].map((f) => (
              <button key={f} className={crFilter === f ? 'primary-button small' : 'secondary-button small'} onClick={() => setCrFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f === 'pending' && pendingCR > 0 ? ` (${pendingCR})` : ''}
              </button>
            ))}
            <button className="secondary-button small" onClick={loadCR} style={{ marginLeft: 'auto' }}>Refresh</button>
          </div>
          {crLoading ? (
            <div className="empty-state">Loading...</div>
          ) : crItems.length === 0 ? (
            <div className="empty-state">{crFilter === 'pending' ? 'No pending profile update requests.' : `No ${crFilter} requests.`}</div>
          ) : (
            crItems.map((req) => <ChangeCard key={req.id} req={req} onReviewed={onCRReviewed} />)
          )}
        </>
      )}

      {/* ── Document Verification tab ── */}
      {activeTab === 'documents' && (
        <>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {['pending', 'verified', 'rejected', 'all'].map((f) => (
              <button key={f} className={docFilter === f ? 'primary-button small' : 'secondary-button small'} onClick={() => setDocFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f === 'pending' && pendingDocs > 0 ? ` (${pendingDocs})` : ''}
              </button>
            ))}
            <button className="secondary-button small" onClick={loadDocs} style={{ marginLeft: 'auto' }}>Refresh</button>
          </div>
          {docLoading ? (
            <div className="empty-state">Loading...</div>
          ) : docItems.length === 0 ? (
            <div className="empty-state">{docFilter === 'pending' ? 'No documents pending verification.' : `No ${docFilter} documents.`}</div>
          ) : (
            docItems.map((doc) => <DocVerifyCard key={doc.id} doc={doc} onVerified={onDocVerified} />)
          )}
        </>
      )}

    </AppLayout>
  );
}
