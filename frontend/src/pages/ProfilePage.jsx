import { useEffect, useMemo, useState } from 'react';
import AppLayout from '../components/AppLayout';
import ProfileCompletionRing from '../components/ProfileCompletionRing';
import { api } from '../api/client';
import { openDocument } from '../api/download';
import { DOCUMENT_GROUPS, SUBTYPE_LABELS, CATEGORY_LABELS, SELF_EDITABLE_FIELDS } from '../constants/documents';

const STATUS_LABEL = { pending: 'Pending review', verified: 'Verified', rejected: 'Rejected' };

function readPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [completion, setCompletion] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [uploadForm, setUploadForm] = useState({ category: 'kyc', subType: 'aadhaar', documentNumber: '', issueDate: '', expiryDate: '', file: null });
  const [editValues, setEditValues] = useState({});
  const [editNote, setEditNote] = useState('');

  async function loadAll() {
    setError('');
    try {
      const [profileRes, completionRes, docsRes, requestsRes] = await Promise.all([
        api.get('/employees/me'),
        api.get('/employees/me/completion'),
        api.get('/employees/me/documents'),
        api.get('/profile/change-requests')
      ]);
      setProfile(profileRes.data.employee);
      setCompletion(completionRes.data.completion);
      setDocuments(docsRes.data.items || []);
      setRequests(requestsRes.data.items || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profile');
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const subTypeOptions = useMemo(() => {
    const group = DOCUMENT_GROUPS.find((item) => item.key === uploadForm.category);
    return group ? group.subTypes : [];
  }, [uploadForm.category]);

  const documentsByCategory = useMemo(() => {
    const grouped = {};
    documents.forEach((doc) => {
      grouped[doc.category] = grouped[doc.category] || [];
      grouped[doc.category].push(doc);
    });
    return grouped;
  }, [documents]);

  async function submitUpload(event) {
    event.preventDefault();
    if (!uploadForm.file) return;
    setMessage('');
    setError('');

    const formData = new FormData();
    formData.append('file', uploadForm.file);
    formData.append('category', uploadForm.category);
    formData.append('subType', uploadForm.subType);
    if (uploadForm.documentNumber) formData.append('documentNumber', uploadForm.documentNumber);
    if (uploadForm.issueDate) formData.append('issueDate', uploadForm.issueDate);
    if (uploadForm.expiryDate) formData.append('expiryDate', uploadForm.expiryDate);

    try {
      await api.post('/employees/me/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMessage('Document uploaded. It is pending HR verification.');
      setUploadForm({ category: 'kyc', subType: 'aadhaar', documentNumber: '', issueDate: '', expiryDate: '', file: null });
      await loadAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload document');
    }
  }

  async function deleteOwnDocument(documentId) {
    if (!window.confirm('Delete this document?')) return;
    try {
      await api.delete(`/employees/me/documents/${documentId}`);
      setMessage('Document deleted.');
      await loadAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete document');
    }
  }

  async function submitChangeRequest(event) {
    event.preventDefault();
    setMessage('');
    setError('');
    const changes = {};
    Object.entries(editValues).forEach(([key, value]) => {
      if (value !== '' && value != null) changes[key] = value;
    });
    if (Object.keys(changes).length === 0) {
      setError('Enter at least one field to request a change.');
      return;
    }
    try {
      await api.post('/profile/change-requests', { changes, note: editNote });
      setMessage('Change request submitted for HR approval.');
      setEditValues({});
      setEditNote('');
      await loadAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit change request');
    }
  }

  async function openDoc(documentId) {
    try {
      await openDocument(documentId, { self: true });
    } catch {
      setError('Failed to open document');
    }
  }

  if (!profile) {
    return (
      <AppLayout title="My Profile" description="Self-service profile, documents, and KYC.">
        <section className="single-column-layout">
          <article className="card">
            {error ? <div className="alert alert-error">{error}</div> : <div className="empty-state">Loading profile...</div>}
          </article>
        </section>
      </AppLayout>
    );
  }

  const percent = completion?.percent ?? profile.profileCompletion?.percent ?? 0;
  const missing = completion?.missingFields || [];

  return (
    <AppLayout title="My Profile" description="Self-service profile, documents, and KYC.">
      {error ? <div className="alert alert-error">{error}</div> : null}
      {message ? <div className="alert alert-success">{message}</div> : null}

      <section className="profile-header-card card">
        <div className="profile-identity">
          {profile.photoUrl ? (
            <img src={profile.photoUrl} alt={profile.name} className="profile-photo" />
          ) : (
            <div className="profile-photo placeholder">{profile.name?.[0]?.toUpperCase() || '?'}</div>
          )}
          <div>
            <h2>{profile.name}</h2>
            <p className="muted-label">{profile.designation || '—'} · {profile.department || '—'}</p>
            <p className="muted-label">Employee code: {profile.employeeCode || '—'}</p>
            <span className={`role-badge role-${profile.role}`}>{profile.role}</span>
          </div>
        </div>
        <div className="profile-completion">
          <ProfileCompletionRing percent={percent} />
          {percent < 100 ? (
            <div className="completion-missing">
              <strong>Complete your profile</strong>
              <ul>
                {missing.slice(0, 5).map((field) => (
                  <li key={field.key}>{field.label}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="muted-label">Your profile is fully complete. 🎉</p>
          )}
        </div>
      </section>

      <section className="split-layout">
        <article className="card">
          <div className="section-header"><div><h3>Personal information</h3><p>Read-only. Use the form below to request changes.</p></div></div>
          <div className="detail-grid">
            <div><span className="muted-label">Phone</span><strong>{profile.phone || '—'}</strong></div>
            <div><span className="muted-label">Date of birth</span><strong>{formatDate(profile.dateOfBirth)}</strong></div>
            <div><span className="muted-label">Gender</span><strong>{profile.gender || '—'}</strong></div>
            <div><span className="muted-label">Blood group</span><strong>{profile.bloodGroup || '—'}</strong></div>
            <div><span className="muted-label">Marital status</span><strong>{profile.maritalStatus || '—'}</strong></div>
            <div><span className="muted-label">Manager</span><strong>{profile.manager?.name || '—'}</strong></div>
            <div><span className="muted-label">Emergency contact</span><strong>{profile.emergencyContactName || '—'}</strong></div>
            <div><span className="muted-label">Emergency phone</span><strong>{profile.emergencyContactPhone || '—'}</strong></div>
          </div>
          <div className="detail-section">
            <span className="muted-label">Address</span>
            <p>{profile.address || 'No address added yet.'}</p>
          </div>

          <div className="detail-section">
            <h4>Request a profile update</h4>
            <p className="muted-label" style={{ marginBottom: '0.75rem' }}>Changes are applied after HR approval.</p>
            <form className="detail-stack" onSubmit={submitChangeRequest}>
              <div className="detail-grid">
                {SELF_EDITABLE_FIELDS.map((field) => (
                  <label className="field" key={field.key}>
                    <span>{field.label}</span>
                    <input
                      type={field.type || 'text'}
                      value={editValues[field.key] ?? ''}
                      placeholder={String(readPath(profile, field.key) ?? '')}
                      onChange={(e) => setEditValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    />
                  </label>
                ))}
              </div>
              <label className="field"><span>Note to HR (optional)</span><textarea rows="2" value={editNote} onChange={(e) => setEditNote(e.target.value)} /></label>
              <button className="primary-button" type="submit">Submit change request</button>
            </form>
          </div>

          {requests.length > 0 ? (
            <div className="detail-section">
              <h4>My change requests</h4>
              <div className="mini-history-list">
                {requests.map((request) => (
                  <div className="mini-history-item" key={request.id}>
                    <div>
                      <strong>{Object.keys(request.changes).join(', ')}</strong>
                      <p>{new Date(request.createdAt).toLocaleString()}</p>
                    </div>
                    <span className={`status-badge status-${request.status}`}>{request.status}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </article>

        <article className="card">
          <div className="section-header"><div><h3>My documents</h3><p>Upload KYC and personal documents for HR verification.</p></div></div>

          <form className="detail-stack" onSubmit={submitUpload}>
            <div className="detail-grid">
              <label className="field">
                <span>Category</span>
                <select value={uploadForm.category} onChange={(e) => {
                  const category = e.target.value;
                  const group = DOCUMENT_GROUPS.find((item) => item.key === category);
                  setUploadForm((prev) => ({ ...prev, category, subType: group?.subTypes[0]?.key || '' }));
                }}>
                  {DOCUMENT_GROUPS.filter((g) => g.key !== 'salary').map((group) => (
                    <option key={group.key} value={group.key}>{group.label}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Document type</span>
                <select value={uploadForm.subType} onChange={(e) => setUploadForm((prev) => ({ ...prev, subType: e.target.value }))}>
                  {subTypeOptions.map((sub) => <option key={sub.key} value={sub.key}>{sub.label}</option>)}
                </select>
              </label>
              <label className="field"><span>Document number</span><input value={uploadForm.documentNumber} onChange={(e) => setUploadForm((prev) => ({ ...prev, documentNumber: e.target.value }))} /></label>
              <label className="field"><span>Issue date</span><input type="date" value={uploadForm.issueDate} onChange={(e) => setUploadForm((prev) => ({ ...prev, issueDate: e.target.value }))} /></label>
              <label className="field"><span>Expiry date</span><input type="date" value={uploadForm.expiryDate} onChange={(e) => setUploadForm((prev) => ({ ...prev, expiryDate: e.target.value }))} /></label>
              <label className="field"><span>File</span><input type="file" onChange={(e) => setUploadForm((prev) => ({ ...prev, file: e.target.files?.[0] || null }))} /></label>
            </div>
            <button className="secondary-button" type="submit" disabled={!uploadForm.file}>Upload document</button>
          </form>

          {Object.keys(documentsByCategory).length === 0 ? (
            <div className="empty-state">No documents uploaded yet.</div>
          ) : (
            Object.entries(documentsByCategory).map(([category, docs]) => (
              <div className="detail-section" key={category}>
                <h4>{CATEGORY_LABELS[category] || category}</h4>
                <div className="mini-history-list">
                  {docs.map((doc) => (
                    <div className="mini-history-item" key={doc.id}>
                      <div>
                        <strong>{SUBTYPE_LABELS[doc.subType] || doc.originalName}</strong>
                        <p>
                          {(doc.size / 1024).toFixed(1)} KB
                          {doc.expiryDate ? ` · expires ${formatDate(doc.expiryDate)}` : ''}
                          {doc.documentNumber ? ` · ${doc.documentNumber}` : ''}
                        </p>
                        {doc.status === 'rejected' && doc.remarks ? <p className="text-danger">Rejected: {doc.remarks}</p> : null}
                      </div>
                      <div className="action-row compact-wrap">
                        <span className={`status-badge status-${doc.status}`}>{STATUS_LABEL[doc.status]}</span>
                        <button className="secondary-button small" type="button" onClick={() => openDoc(doc.id)}>Open</button>
                        {doc.status !== 'verified' && !doc.generatedLetter ? (
                          <button className="danger-button small" type="button" onClick={() => deleteOwnDocument(doc.id)}>Delete</button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </article>
      </section>
    </AppLayout>
  );
}
