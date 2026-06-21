import { useEffect, useMemo, useState } from 'react';
import AppLayout from '../components/AppLayout';
import ProfileCompletionRing from '../components/ProfileCompletionRing';
import { api } from '../api/client';
import { openDocument } from '../api/download';
import { useAuth } from '../context/AuthContext';
import { DOCUMENT_GROUPS, SUBTYPE_LABELS, CATEGORY_LABELS } from '../constants/documents';

const initialForm = {
  name: '',
  email: '',
  password: 'Password@123',
  role: 'employee',
  department: '',
  designation: '',
  employeeCode: '',
  phone: '',
  address: '',
  joiningDate: '',
  confirmationDate: '',
  probationStatus: 'on_probation',
  manager: '',
  dateOfBirth: '',
  gender: '',
  bloodGroup: '',
  maritalStatus: '',
  location: '',
  photoUrl: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  employmentStatus: 'active'
};

const STATUS_LABEL = { pending: 'Pending', verified: 'Verified', rejected: 'Rejected' };
const initialImport = `name,email,role,department,designation,employeeCode,phone,joiningDate,employmentStatus\n`;
const apiOrigin = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

export default function EmployeesPage() {
  const { user, hasPermission } = useAuth();
  const [items, setItems] = useState([]);
  const [orgChart, setOrgChart] = useState([]);
  const [profile, setProfile] = useState(null);
  const [supportData, setSupportData] = useState({ roles: [], masterData: {} });
  const [documents, setDocuments] = useState([]);
  const [completion, setCompletion] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [changeRequests, setChangeRequests] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState(initialForm);
  const [importText, setImportText] = useState(initialImport);
  const [documentForm, setDocumentForm] = useState({ category: 'kyc', subType: 'aadhaar', documentNumber: '', issueDate: '', expiryDate: '', file: null });
  const [letterForm, setLetterForm] = useState({ templateKey: '', customValues: {} });
  const [emailChangeValue, setEmailChangeValue] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const canViewDirectory = user.role !== 'employee';
  const canManage = hasPermission('employee', 'create') || hasPermission('employee', 'edit');
  const canDeactivate = hasPermission('employee', 'delete');
  const canExport = hasPermission('employee', 'export');
  const canReview = ['hr', 'admin'].includes(user.role);

  async function loadSupportData() {
    try {
      const { data } = await api.get('/settings/form-options');
      setSupportData({ roles: data.roles || [], masterData: data.masterData || {} });
    } catch {
      setSupportData({ roles: [], masterData: {} });
    }
  }

  async function loadTemplates() {
    if (!canManage) return;
    try {
      const { data } = await api.get('/letters/templates');
      setTemplates(data.items || []);
    } catch {
      setTemplates([]);
    }
  }

  async function loadChangeRequests() {
    if (!canReview) return;
    try {
      const { data } = await api.get('/profile/change-requests?status=pending');
      setChangeRequests(data.items || []);
    } catch {
      setChangeRequests([]);
    }
  }

  async function loadDocuments(employeeId) {
    if (!employeeId) {
      setDocuments([]);
      return;
    }
    try {
      const { data } = await api.get(`/employees/${employeeId}/documents`);
      setDocuments(data.items || []);
    } catch {
      setDocuments([]);
    }
  }

  async function loadCompletion(employeeId) {
    if (!employeeId) {
      setCompletion(null);
      return;
    }
    try {
      const { data } = await api.get(`/employees/${employeeId}/completion`);
      setCompletion(data.completion);
    } catch {
      setCompletion(null);
    }
  }

  async function loadData() {
    setError('');
    try {
      if (canViewDirectory) {
        const [employeesRes, orgRes] = await Promise.all([
          api.get(`/employees${search.trim() ? `?q=${encodeURIComponent(search.trim())}` : ''}`),
          api.get('/employees/org-chart')
        ]);
        const nextItems = employeesRes.data.items || [];
        setItems(nextItems);
        setOrgChart(orgRes.data.items || []);
        if (!selectedId && nextItems.length) {
          selectEmployee(nextItems[0]);
        } else if (selectedId && !nextItems.some((item) => item.id === selectedId)) {
          setSelectedId('');
          setForm(initialForm);
          setDocuments([]);
          setCompletion(null);
        }
      } else {
        const { data } = await api.get('/employees/me');
        setProfile(data.employee);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load employees');
    }
  }

  useEffect(() => {
    loadSupportData();
    loadTemplates();
    loadChangeRequests();
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(loadData, 200);
    return () => window.clearTimeout(timeoutId);
  }, [search, canViewDirectory]);

  useEffect(() => {
    if (selectedId) {
      loadDocuments(selectedId);
      loadCompletion(selectedId);
    }
  }, [selectedId]);

  async function changeEmail(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      await api.put(`/employees/${selectedId}/email`, { email: emailChangeValue });
      setMessage('Email updated successfully.');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update email');
    }
  }

  function toDateInput(value) {
    return value ? new Date(value).toISOString().slice(0, 10) : '';
  }

  function selectEmployee(employee) {
    setSelectedId(employee.id);
    setEmailChangeValue(employee.email || '');
    setForm({
      name: employee.name || '',
      email: employee.email || '',
      password: 'Password@123',
      role: employee.role || supportData.roles[0]?.key || 'employee',
      department: employee.department || '',
      designation: employee.designation || '',
      employeeCode: employee.employeeCode || '',
      phone: employee.phone || '',
      address: employee.address || '',
      joiningDate: toDateInput(employee.joiningDate),
      confirmationDate: toDateInput(employee.confirmationDate),
      probationStatus: employee.probationStatus || 'on_probation',
      manager: employee.manager?.id || '',
      dateOfBirth: toDateInput(employee.dateOfBirth),
      gender: employee.gender || '',
      bloodGroup: employee.bloodGroup || '',
      maritalStatus: employee.maritalStatus || '',
      location: employee.location || '',
      photoUrl: employee.photoUrl || '',
      emergencyContactName: employee.emergencyContactName || '',
      emergencyContactPhone: employee.emergencyContactPhone || '',
      employmentStatus: employee.employmentStatus || 'active'
    });
  }

  const roles = supportData.roles || [];
  const masterData = supportData.masterData || {};
  const departments = masterData.departments || [];
  const designations = masterData.designations || [];
  const employmentStatuses = masterData['employment-statuses'] || [];

  const managers = useMemo(() => items.filter((item) => item.id !== selectedId), [items, selectedId]);
  const subTypeOptions = useMemo(() => {
    const group = DOCUMENT_GROUPS.find((item) => item.key === documentForm.category);
    return group ? group.subTypes : [];
  }, [documentForm.category]);
  const selectedTemplate = useMemo(
    () => templates.find((item) => item.key === letterForm.templateKey),
    [templates, letterForm.templateKey]
  );

  async function submitForm(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      const payload = {
        ...form,
        manager: form.manager || null,
        joiningDate: form.joiningDate || null,
        confirmationDate: form.confirmationDate || null,
        dateOfBirth: form.dateOfBirth || null
      };
      if (selectedId) {
        await api.put(`/employees/${selectedId}`, payload);
        setMessage('Employee updated successfully.');
      } else {
        await api.post('/employees', payload);
        setMessage('Employee created successfully.');
      }
      await loadData();
      if (selectedId) await loadCompletion(selectedId);
      if (!selectedId) {
        setForm({ ...initialForm, role: roles[0]?.key || 'employee' });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save employee');
    }
  }

  async function deactivateEmployee() {
    if (!selectedId) return;
    if (!window.confirm('Mark this employee as exited?')) return;
    try {
      await api.put(`/employees/${selectedId}/deactivate`);
      setMessage('Employee marked as exited.');
      setSelectedId('');
      setForm({ ...initialForm, role: roles[0]?.key || 'employee' });
      setDocuments([]);
      setCompletion(null);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to deactivate employee');
    }
  }

  async function importCsv() {
    setError('');
    setMessage('');
    try {
      const { data } = await api.post('/employees/import-csv', { csvText: importText });
      setMessage(`CSV import completed. Created: ${data.createdCount}, skipped: ${data.skipped.length}`);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to import CSV');
    }
  }

  function exportCsv() {
    window.open(`${apiOrigin}/api/employees/export/csv`, '_blank', 'noopener,noreferrer');
  }

  async function uploadDocument(event) {
    event.preventDefault();
    if (!selectedId || !documentForm.file) return;
    const formData = new FormData();
    formData.append('file', documentForm.file);
    formData.append('category', documentForm.category);
    formData.append('subType', documentForm.subType);
    if (documentForm.documentNumber) formData.append('documentNumber', documentForm.documentNumber);
    if (documentForm.issueDate) formData.append('issueDate', documentForm.issueDate);
    if (documentForm.expiryDate) formData.append('expiryDate', documentForm.expiryDate);
    try {
      await api.post(`/employees/${selectedId}/documents`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMessage('Document uploaded successfully.');
      setError('');
      setDocumentForm({ category: 'kyc', subType: 'aadhaar', documentNumber: '', issueDate: '', expiryDate: '', file: null });
      await loadDocuments(selectedId);
      await loadCompletion(selectedId);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload document');
    }
  }

  async function verifyDocument(documentId, status) {
    let remarks = '';
    if (status === 'rejected') {
      remarks = window.prompt('Reason for rejection (optional):') || '';
    }
    try {
      await api.put(`/employees/${selectedId}/documents/${documentId}/verify`, { status, remarks });
      setMessage(`Document ${status}.`);
      await loadDocuments(selectedId);
      await loadCompletion(selectedId);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update document');
    }
  }

  async function deleteDocument(documentId) {
    if (!selectedId) return;
    if (!window.confirm('Delete this document?')) return;
    try {
      await api.delete(`/employees/${selectedId}/documents/${documentId}`);
      setMessage('Document deleted successfully.');
      setError('');
      await loadDocuments(selectedId);
      await loadCompletion(selectedId);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete document');
    }
  }

  async function openDoc(documentId) {
    try {
      await openDocument(documentId, { userId: selectedId });
    } catch {
      setError('Failed to open document');
    }
  }

  async function generateLetter(event) {
    event.preventDefault();
    if (!selectedId || !letterForm.templateKey) return;
    try {
      const { data } = await api.post(`/letters/employees/${selectedId}/generate`, {
        templateKey: letterForm.templateKey,
        customValues: letterForm.customValues
      });
      setMessage(`Letter generated (Ref ${data.referenceNo})${data.fallbackHtml ? ' — Puppeteer not installed, saved as HTML.' : ''}`);
      setLetterForm({ templateKey: '', customValues: {} });
      await loadDocuments(selectedId);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate letter');
    }
  }

  async function reviewChangeRequest(id, decision) {
    let reviewNote = '';
    if (decision === 'rejected') {
      reviewNote = window.prompt('Reason for rejection (optional):') || '';
    }
    try {
      await api.put(`/profile/change-requests/${id}/review`, { decision, reviewNote });
      setMessage(`Change request ${decision}.`);
      await loadChangeRequests();
      await loadData();
      if (selectedId) await loadCompletion(selectedId);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to review change request');
    }
  }

  if (!canViewDirectory) {
    return (
      <AppLayout title="My Profile" description="Self-service profile view.">
        <section className="single-column-layout">
          <article className="card">
            {error ? <div className="alert alert-error">{error}</div> : null}
            {!profile ? (
              <div className="empty-state">Loading profile...</div>
            ) : (
              <div className="detail-stack">
                <div className="detail-grid">
                  <div><span className="muted-label">Name</span><strong>{profile.name}</strong></div>
                  <div><span className="muted-label">Employee code</span><strong>{profile.employeeCode || '—'}</strong></div>
                  <div><span className="muted-label">Department</span><strong>{profile.department || '—'}</strong></div>
                  <div><span className="muted-label">Designation</span><strong>{profile.designation || '—'}</strong></div>
                </div>
              </div>
            )}
          </article>
        </section>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Employee Management" description="Directory, profiles, KYC verification, auto letters, and change-request approvals.">
      <section className="split-layout">
        <article className="card">
          <div className="section-header wrap-on-mobile">
            <div>
              <h3>Employee directory</h3>
              <p>Search, review, and maintain employee records.</p>
            </div>
            {canExport ? (
              <button className="secondary-button" type="button" onClick={exportCsv}>Export CSV</button>
            ) : null}
          </div>
          <div className="filter-toolbar">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, department..." />
          </div>
          {error ? <div className="alert alert-error">{error}</div> : null}
          {message ? <div className="alert alert-success">{message}</div> : null}
          <div className="list-stack selectable-list">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`request-card selectable-card ${selectedId === item.id ? 'selected' : ''}`}
                onClick={() => selectEmployee(item)}
              >
                <div className="request-card-top">
                  <div>
                    <strong>{item.name}</strong>
                    <p>{item.email}</p>
                  </div>
                  <span className={`role-badge role-${item.role}`}>{item.role}</span>
                </div>
                <div className="request-grid request-grid-compact">
                  <div><span className="muted-label">Department</span><strong>{item.department || '—'}</strong></div>
                  <div><span className="muted-label">Profile</span><strong>{item.profileCompletion?.percent ?? 0}%</strong></div>
                </div>
              </button>
            ))}
          </div>

          {canReview && changeRequests.length > 0 ? (
            <div className="detail-section">
              <h4>Pending change requests ({changeRequests.length})</h4>
              <div className="mini-history-list">
                {changeRequests.map((request) => (
                  <div className="mini-history-item column" key={request.id}>
                    <div>
                      <strong>{request.user?.name}</strong>
                      <p>{Object.entries(request.changes).map(([k, v]) => `${k}: ${v}`).join(' · ')}</p>
                      {request.note ? <p className="muted-label">“{request.note}”</p> : null}
                    </div>
                    <div className="action-row compact-wrap">
                      <button className="primary-button small" type="button" onClick={() => reviewChangeRequest(request.id, 'approved')}>Approve</button>
                      <button className="danger-button small" type="button" onClick={() => reviewChangeRequest(request.id, 'rejected')}>Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {canManage ? (
            <div className="detail-section">
              <h4>Bulk CSV import</h4>
              <label className="field"><span>Paste CSV</span><textarea rows="6" value={importText} onChange={(e) => setImportText(e.target.value)} /></label>
              <button className="primary-button" type="button" onClick={importCsv}>Import CSV</button>
            </div>
          ) : null}
        </article>

        <article className="card detail-card">
          <div className="section-header wrap-on-mobile">
            <div>
              <h3>{selectedId ? 'Edit employee' : 'Add employee'}</h3>
              <p>Profile, documents, KYC verification, and auto letters.</p>
            </div>
            {canManage ? (
              <button className="secondary-button" type="button" onClick={() => { setSelectedId(''); setForm({ ...initialForm, role: roles[0]?.key || 'employee' }); setDocuments([]); setCompletion(null); }}>
                New employee
              </button>
            ) : null}
          </div>

          {selectedId && completion ? (
            <div className="profile-completion-inline">
              <ProfileCompletionRing percent={completion.percent} size={96} stroke={9} />
              <div>
                <strong>Profile {completion.percent}% complete</strong>
                {completion.missingFields?.length ? (
                  <p className="muted-label">Missing: {completion.missingFields.map((f) => f.label).join(', ')}</p>
                ) : (
                  <p className="muted-label">All required fields complete.</p>
                )}
              </div>
            </div>
          ) : null}

          {canManage ? (
            <form className="detail-stack" onSubmit={submitForm}>
              <div className="detail-grid">
                <label className="field"><span>Name</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
                <label className="field"><span>Email</span><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required disabled={Boolean(selectedId)} /></label>
                {!selectedId ? <label className="field"><span>Temporary password</span><input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label> : <div />}
                <label className="field"><span>Role</span><select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>{roles.map((role) => <option key={role.id} value={role.key}>{role.label}</option>)}</select></label>
                <label className="field"><span>Department</span><select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}><option value="">Select department</option>{departments.map((item) => <option key={item.id} value={item.label}>{item.label}</option>)}</select></label>
                <label className="field"><span>Designation</span><select value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })}><option value="">Select designation</option>{designations.map((item) => <option key={item.id} value={item.label}>{item.label}</option>)}</select></label>
                <label className="field"><span>Employment status</span><select value={form.employmentStatus} onChange={(e) => setForm({ ...form, employmentStatus: e.target.value })}>{employmentStatuses.map((item) => <option key={item.id} value={item.key}>{item.label}</option>)}</select></label>
                <label className="field"><span>Employee code</span><input value={form.employeeCode} onChange={(e) => setForm({ ...form, employeeCode: e.target.value })} /></label>
                <label className="field"><span>Joining date</span><input type="date" value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} /></label>
                <label className="field"><span>Confirmation date</span><input type="date" value={form.confirmationDate} onChange={(e) => setForm({ ...form, confirmationDate: e.target.value })} /></label>
                <label className="field"><span>Probation status</span><select value={form.probationStatus} onChange={(e) => setForm({ ...form, probationStatus: e.target.value })}><option value="on_probation">On probation</option><option value="confirmed">Confirmed</option></select></label>
                <label className="field"><span>Date of birth</span><input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} /></label>
                <label className="field"><span>Gender</span><select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}><option value="">—</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></label>
                <label className="field"><span>Blood group</span><input value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })} /></label>
                <label className="field"><span>Marital status</span><select value={form.maritalStatus} onChange={(e) => setForm({ ...form, maritalStatus: e.target.value })}><option value="">—</option><option value="single">Single</option><option value="married">Married</option><option value="other">Other</option></select></label>
                <label className="field"><span>Location</span><input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></label>
                <label className="field"><span>Photo URL</span><input value={form.photoUrl} onChange={(e) => setForm({ ...form, photoUrl: e.target.value })} /></label>
                <label className="field"><span>Phone</span><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
                <label className="field"><span>Manager</span><select value={form.manager} onChange={(e) => setForm({ ...form, manager: e.target.value })}><option value="">No manager</option>{managers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
                <label className="field"><span>Emergency contact name</span><input value={form.emergencyContactName} onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })} /></label>
                <label className="field"><span>Emergency contact phone</span><input value={form.emergencyContactPhone} onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })} /></label>
              </div>
              <label className="field"><span>Address</span><textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows="2" /></label>
              <div className="action-row">
                <button className="primary-button" type="submit">{selectedId ? 'Save changes' : 'Create employee'}</button>
                {selectedId && canDeactivate ? <button className="danger-button" type="button" onClick={deactivateEmployee}>Mark exited</button> : null}
              </div>
            </form>
          ) : (
            <div className="empty-state">Create/edit controls appear only when your role permission allows them.</div>
          )}

          {selectedId && user.role === 'admin' ? (
            <div className="detail-section">
              <h4>Change Email Address</h4>
              <form className="detail-stack" onSubmit={changeEmail}>
                <label className="field"><span>New email address</span><input type="email" value={emailChangeValue} onChange={(e) => setEmailChangeValue(e.target.value)} required /></label>
                <div className="action-row"><button className="secondary-button" type="submit">Update Email</button></div>
              </form>
            </div>
          ) : null}

          {selectedId ? (
            <div className="detail-section">
              <h4>Documents & KYC</h4>
              {canManage ? (
                <form className="detail-stack" onSubmit={uploadDocument}>
                  <div className="detail-grid">
                    <label className="field"><span>Category</span>
                      <select value={documentForm.category} onChange={(e) => {
                        const category = e.target.value;
                        const group = DOCUMENT_GROUPS.find((item) => item.key === category);
                        setDocumentForm((prev) => ({ ...prev, category, subType: group?.subTypes[0]?.key || '' }));
                      }}>
                        {DOCUMENT_GROUPS.map((group) => <option key={group.key} value={group.key}>{group.label}</option>)}
                      </select>
                    </label>
                    <label className="field"><span>Document type</span><select value={documentForm.subType} onChange={(e) => setDocumentForm((prev) => ({ ...prev, subType: e.target.value }))}>{subTypeOptions.map((sub) => <option key={sub.key} value={sub.key}>{sub.label}</option>)}</select></label>
                    <label className="field"><span>Document number</span><input value={documentForm.documentNumber} onChange={(e) => setDocumentForm((prev) => ({ ...prev, documentNumber: e.target.value }))} /></label>
                    <label className="field"><span>Issue date</span><input type="date" value={documentForm.issueDate} onChange={(e) => setDocumentForm((prev) => ({ ...prev, issueDate: e.target.value }))} /></label>
                    <label className="field"><span>Expiry date</span><input type="date" value={documentForm.expiryDate} onChange={(e) => setDocumentForm((prev) => ({ ...prev, expiryDate: e.target.value }))} /></label>
                    <label className="field"><span>File</span><input type="file" onChange={(e) => setDocumentForm((prev) => ({ ...prev, file: e.target.files?.[0] || null }))} /></label>
                  </div>
                  <button className="secondary-button" type="submit" disabled={!documentForm.file}>Upload document</button>
                </form>
              ) : null}

              <div className="mini-history-list">
                {documents.length === 0 ? <div className="empty-state">No documents uploaded yet.</div> : documents.map((item) => (
                  <div className="mini-history-item column" key={item.id}>
                    <div>
                      <strong>{SUBTYPE_LABELS[item.subType] || item.originalName}</strong>
                      <p>
                        {CATEGORY_LABELS[item.category] || item.category} · {(item.size / 1024).toFixed(1)} KB
                        {item.documentNumber ? ` · ${item.documentNumber}` : ''}
                        {item.expiryDate ? ` · expires ${new Date(item.expiryDate).toLocaleDateString()}` : ''}
                        {item.version > 1 ? ` · v${item.version}` : ''}
                      </p>
                      {item.remarks ? <p className="muted-label">{item.remarks}</p> : null}
                    </div>
                    <div className="action-row compact-wrap">
                      <span className={`status-badge status-${item.status}`}>{STATUS_LABEL[item.status]}</span>
                      <button className="secondary-button small" type="button" onClick={() => openDoc(item.id)}>Open</button>
                      {canManage && item.status !== 'verified' ? <button className="primary-button small" type="button" onClick={() => verifyDocument(item.id, 'verified')}>Verify</button> : null}
                      {canManage && item.status !== 'rejected' ? <button className="secondary-button small" type="button" onClick={() => verifyDocument(item.id, 'rejected')}>Reject</button> : null}
                      {canDeactivate ? <button className="danger-button small" type="button" onClick={() => deleteDocument(item.id)}>Delete</button> : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {selectedId && canManage ? (
            <div className="detail-section">
              <h4>Generate letter</h4>
              <form className="detail-stack" onSubmit={generateLetter}>
                <label className="field">
                  <span>Letter template</span>
                  <select value={letterForm.templateKey} onChange={(e) => setLetterForm({ templateKey: e.target.value, customValues: {} })}>
                    <option value="">Select a template</option>
                    {templates.map((template) => <option key={template.id} value={template.key}>{template.name}</option>)}
                  </select>
                </label>
                {selectedTemplate?.customFields?.length ? (
                  <div className="detail-grid">
                    {selectedTemplate.customFields.map((field) => (
                      <label className="field" key={field.key}>
                        <span>{field.label}</span>
                        <input
                          value={letterForm.customValues[field.key] || ''}
                          onChange={(e) => setLetterForm((prev) => ({ ...prev, customValues: { ...prev.customValues, [field.key]: e.target.value } }))}
                        />
                      </label>
                    ))}
                  </div>
                ) : null}
                <button className="primary-button" type="submit" disabled={!letterForm.templateKey}>Generate &amp; attach letter</button>
              </form>
            </div>
          ) : null}

          <div className="detail-section">
            <h4>Org chart snapshot</h4>
            <div className="mini-history-list">
              {orgChart.slice(0, 12).map((item) => (
                <div className="mini-history-item" key={item.id}>
                  <div><strong>{item.name}</strong><p>{item.designation || item.role}</p></div>
                  <span>{item.managerName || 'Top level'}</span>
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>
    </AppLayout>
  );
}
