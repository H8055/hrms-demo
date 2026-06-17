import { useEffect, useMemo, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

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
  location: '',
  currentSalary: '',
  joiningDate: '',
  manager: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  employmentStatus: 'active'
};

const initialImport = `name,email,role,department,designation,employeeCode,phone,joiningDate,employmentStatus\n`;
const apiOrigin = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

function getInitials(name = '') {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}
function avatarClass(name = '') {
  return `emp-avatar emp-avatar-${name.charCodeAt(0) % 10}`;
}
function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function formatSalary(n) {
  if (!n) return '—';
  return `$${Number(n).toLocaleString()}`;
}

const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const FilterIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
);
const ExportIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const PlusIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

export default function EmployeesPage() {
  const { user, hasPermission } = useAuth();
  const [items, setItems] = useState([]);
  const [orgChart, setOrgChart] = useState([]);
  const [profile, setProfile] = useState(null);
  const [supportData, setSupportData] = useState({ roles: [], masterData: {} });
  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState(initialForm);
  const [importText, setImportText] = useState(initialImport);
  const [documentForm, setDocumentForm] = useState({ category: '', file: null });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const canViewDirectory = user.role !== 'employee';
  const canManage = hasPermission('employee', 'create') || hasPermission('employee', 'edit');
  const canDeactivate = hasPermission('employee', 'delete');
  const canExport = hasPermission('employee', 'export');

  async function loadSupportData() {
    try {
      const { data } = await api.get('/settings/form-options');
      setSupportData({ roles: data.roles || [], masterData: data.masterData || {} });
    } catch {
      setSupportData({ roles: [], masterData: {} });
    }
  }

  async function loadDocuments(employeeId) {
    if (!employeeId) { setDocuments([]); return; }
    try {
      const { data } = await api.get(`/employees/${employeeId}/documents`);
      setDocuments(data.items || []);
    } catch { setDocuments([]); }
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
        if (selectedId && !nextItems.some((item) => item.id === selectedId)) {
          setSelectedId('');
          setForm(initialForm);
          setDocuments([]);
        }
      } else {
        const { data } = await api.get('/employees/me');
        setProfile(data.employee);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load employees');
    }
  }

  useEffect(() => { loadSupportData(); }, []);
  useEffect(() => {
    const timeoutId = window.setTimeout(loadData, 200);
    return () => window.clearTimeout(timeoutId);
  }, [search, canViewDirectory]);
  useEffect(() => { if (selectedId) loadDocuments(selectedId); }, [selectedId]);

  function selectEmployee(employee) {
    setSelectedId(employee.id);
    setShowAddDrawer(true);
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
      location: employee.location || '',
      currentSalary: employee.currentSalary || '',
      joiningDate: employee.joiningDate ? new Date(employee.joiningDate).toISOString().slice(0, 10) : '',
      manager: employee.manager?.id || '',
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
  const documentTypes = masterData['document-types'] || [];
  const managers = useMemo(() => items.filter((item) => item.id !== selectedId), [items, selectedId]);

  async function submitForm(event) {
    event.preventDefault();
    setError(''); setMessage('');
    try {
      const payload = { ...form, manager: form.manager || null, joiningDate: form.joiningDate || null, currentSalary: form.currentSalary ? Number(form.currentSalary) : 0 };
      if (selectedId) {
        await api.put(`/employees/${selectedId}`, payload);
        setMessage('Employee updated successfully.');
      } else {
        await api.post('/employees', payload);
        setMessage('Employee created successfully.');
      }
      await loadData();
      if (!selectedId) { setForm({ ...initialForm, role: roles[0]?.key || 'employee' }); }
    } catch (err) { setError(err.response?.data?.message || 'Failed to save employee'); }
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
      setShowAddDrawer(false);
      await loadData();
    } catch (err) { setError(err.response?.data?.message || 'Failed to deactivate employee'); }
  }

  async function importCsv() {
    setError(''); setMessage('');
    try {
      const { data } = await api.post('/employees/import-csv', { csvText: importText });
      setMessage(`CSV import completed. Created: ${data.createdCount}, skipped: ${data.skipped.length}`);
      await loadData();
    } catch (err) { setError(err.response?.data?.message || 'Failed to import CSV'); }
  }

  function exportCsv() {
    window.open(`${apiOrigin}/api/employees/export/csv`, '_blank', 'noopener,noreferrer');
  }

  async function uploadDocument(event) {
    event.preventDefault();
    if (!selectedId || !documentForm.file) return;
    const formData = new FormData();
    formData.append('file', documentForm.file);
    formData.append('category', documentForm.category || 'general');
    try {
      await api.post(`/employees/${selectedId}/documents`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMessage('Document uploaded successfully.');
      setError('');
      setDocumentForm({ category: documentTypes[0]?.key || '', file: null });
      await loadDocuments(selectedId);
    } catch (err) { setError(err.response?.data?.message || 'Failed to upload document'); }
  }

  async function deleteDocument(documentId) {
    if (!selectedId || !window.confirm('Delete this document?')) return;
    try {
      await api.delete(`/employees/${selectedId}/documents/${documentId}`);
      setMessage('Document deleted successfully.');
      setError('');
      await loadDocuments(selectedId);
    } catch (err) { setError(err.response?.data?.message || 'Failed to delete document'); }
  }

  /* ── Employee self-profile view ─────────────────────────── */
  if (!canViewDirectory) {
    return (
      <AppLayout title="My Profile">
        <div className="single-column-layout">
          <article className="card">
            {error && <div className="alert alert-error">{error}</div>}
            {!profile ? (
              <div className="empty-state">Loading profile…</div>
            ) : (
              <>
                {/* Profile header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--panel-border)' }}>
                  <div className={avatarClass(profile.name)} style={{ width: 56, height: 56, fontSize: '1.1rem' }}>
                    {getInitials(profile.name)}
                  </div>
                  <div>
                    <strong style={{ fontSize: '1.2rem', fontWeight: 700 }}>{profile.name}</strong>
                    <p style={{ margin: '0.2rem 0 0', color: 'var(--muted)', fontSize: '0.875rem' }}>
                      {profile.designation || profile.role} · {profile.department || '—'}
                    </p>
                  </div>
                  <span className={`status-chip ${profile.employmentStatus === 'active' ? 'active' : 'pending'}`} style={{ marginLeft: 'auto' }}>
                    {profile.employmentStatus}
                  </span>
                </div>

                <div className="detail-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
                  {[
                    ['Employee Code', profile.employeeCode],
                    ['Department', profile.department],
                    ['Designation', profile.designation],
                    ['Phone', profile.phone],
                    ['Location', profile.location || profile.address],
                    ['Manager', profile.manager?.name],
                    ['Joining Date', formatDate(profile.joiningDate)],
                    ['Emergency Contact', profile.emergencyContactName]
                  ].map(([label, val]) => (
                    <div key={label}>
                      <span className="muted-label">{label}</span>
                      <strong style={{ display: 'block', marginTop: '0.2rem' }}>{val || '—'}</strong>
                    </div>
                  ))}
                </div>

                {/* Leave balances */}
                <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--panel-border)' }}>
                  <h4 style={{ margin: '0 0 0.85rem', fontWeight: 700, fontSize: '0.9rem' }}>Leave Balances</h4>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {Object.entries(profile.leaveBalances || {}).map(([type, days]) => (
                      <div key={type} style={{ padding: '0.65rem 1rem', background: 'var(--panel-soft)', borderRadius: '10px', border: '1px solid var(--panel-border)', minWidth: 80, textAlign: 'center' }}>
                        <strong style={{ display: 'block', fontSize: '1.3rem', fontWeight: 800 }}>{days}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'capitalize' }}>{type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </article>
        </div>
      </AppLayout>
    );
  }

  /* ── Admin/HR directory view ────────────────────────────── */
  const selectedEmployee = items.find((i) => i.id === selectedId);

  return (
    <AppLayout title="Employees">
      {/* Toolbar */}
      <div className="emp-toolbar">
        <div className="emp-search-wrap">
          <span className="emp-search-icon"><SearchIcon /></span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employees…"
          />
        </div>
        <div className="emp-toolbar-right">
          <button className="secondary-button" type="button">
            <FilterIcon /> Filter
          </button>
          {canExport && (
            <button className="secondary-button" type="button" onClick={exportCsv}>
              <ExportIcon /> Export
            </button>
          )}
          {canManage && (
            <button
              className="primary-button"
              type="button"
              onClick={() => {
                setSelectedId('');
                setForm({ ...initialForm, role: roles[0]?.key || 'employee' });
                setDocuments([]);
                setShowAddDrawer(true);
              }}
            >
              <PlusIcon /> Add Employee
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      {/* Main layout: table + optional detail drawer */}
      <div style={{ display: 'grid', gridTemplateColumns: showAddDrawer ? '1fr 400px' : '1fr', gap: '1rem', alignItems: 'start' }}>

        {/* Employee Table */}
        <article className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="employee-table-wrap">
            <table className="employee-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Location</th>
                  <th>Joined</th>
                  <th>Salary</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
                      No employees found.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const status = item.employmentStatus || 'active';
                    const statusCls = status === 'active' ? 'emp-status-active' : status === 'on-leave' ? 'emp-status-on-leave' : 'emp-status-exited';
                    const statusLabel = status === 'active' ? 'Active' : status === 'on-leave' ? 'On Leave' : 'Exited';
                    return (
                      <tr key={item.id} onClick={() => selectEmployee(item)} style={{ background: selectedId === item.id ? 'var(--primary-light)' : undefined }}>
                        <td>
                          <div className="emp-cell-name">
                            <div className={avatarClass(item.name)}>{getInitials(item.name)}</div>
                            <div className="emp-name-col">
                              <strong>{item.name}</strong>
                              <span>{item.email}</span>
                            </div>
                          </div>
                        </td>
                        <td style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
                          {item.designation || item.role}
                        </td>
                        <td>
                          {item.department ? <span className="dept-badge">{item.department}</span> : '—'}
                        </td>
                        <td style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
                          {item.location || (item.address ? item.address.split(',')[0] : '—')}
                        </td>
                        <td style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
                          {formatDate(item.joiningDate)}
                        </td>
                        <td style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                          {formatSalary(item.currentSalary)}
                        </td>
                        <td>
                          <span className={`status-chip ${statusCls}`}>{statusLabel}</span>
                        </td>
                        <td>
                          <button className="emp-actions-menu" type="button" onClick={(e) => { e.stopPropagation(); selectEmployee(item); }}>
                            ···
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* CSV Import (collapsible, shown only to admins) */}
          {canManage && (
            <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--panel-border)', background: 'var(--panel-soft)' }}>
              <details>
                <summary style={{ cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', userSelect: 'none' }}>
                  Bulk CSV import
                </summary>
                <div style={{ marginTop: '0.75rem', display: 'grid', gap: '0.65rem' }}>
                  <label className="field">
                    <span>Paste CSV</span>
                    <textarea rows="5" value={importText} onChange={(e) => setImportText(e.target.value)} />
                  </label>
                  <button className="secondary-button small" type="button" onClick={importCsv} style={{ width: 'fit-content' }}>
                    Import CSV
                  </button>
                </div>
              </details>
            </div>
          )}
        </article>

        {/* Detail / Add Drawer */}
        {showAddDrawer && (
          <article className="card detail-card">
            <div className="section-header" style={{ marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0 }}>{selectedId ? (selectedEmployee?.name || 'Edit Employee') : 'Add Employee'}</h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--muted)' }}>
                  {selectedId ? `${selectedEmployee?.designation || ''} · ${selectedEmployee?.department || ''}` : 'Fill in the employee details below'}
                </p>
              </div>
              <button
                className="chip-button small"
                type="button"
                onClick={() => { setShowAddDrawer(false); setSelectedId(''); setDocuments([]); }}
                style={{ flexShrink: 0 }}
              >
                ✕
              </button>
            </div>

            {canManage ? (
              <form className="detail-stack" onSubmit={submitForm}>
                <div className="detail-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <label className="field"><span>Full Name</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
                  <label className="field"><span>Email</span><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required disabled={Boolean(selectedId)} /></label>
                  {!selectedId && <label className="field"><span>Temp. Password</span><input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>}
                  <label className="field"><span>Role</span><select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>{roles.map((r) => <option key={r.id} value={r.key}>{r.label}</option>)}</select></label>
                  <label className="field"><span>Department</span><select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}><option value="">Select…</option>{departments.map((d) => <option key={d.id} value={d.label}>{d.label}</option>)}</select></label>
                  <label className="field"><span>Designation</span><select value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })}><option value="">Select…</option>{designations.map((d) => <option key={d.id} value={d.label}>{d.label}</option>)}</select></label>
                  <label className="field"><span>Employment Status</span><select value={form.employmentStatus} onChange={(e) => setForm({ ...form, employmentStatus: e.target.value })}>{employmentStatuses.map((s) => <option key={s.id} value={s.key}>{s.label}</option>)}</select></label>
                  <label className="field"><span>Employee Code</span><input value={form.employeeCode} onChange={(e) => setForm({ ...form, employeeCode: e.target.value })} /></label>
                  <label className="field"><span>Joining Date</span><input type="date" value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} /></label>
                  <label className="field"><span>Phone</span><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
                  <label className="field"><span>Location / City</span><input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Lagos" /></label>
                  <label className="field"><span>Current Salary ($)</span><input type="number" value={form.currentSalary} onChange={(e) => setForm({ ...form, currentSalary: e.target.value })} placeholder="0" /></label>
                  <label className="field"><span>Manager</span><select value={form.manager} onChange={(e) => setForm({ ...form, manager: e.target.value })}><option value="">No manager</option>{managers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
                  <label className="field"><span>Emergency Contact</span><input value={form.emergencyContactName} onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })} /></label>
                  <label className="field"><span>Emergency Phone</span><input value={form.emergencyContactPhone} onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })} /></label>
                </div>
                <label className="field"><span>Address</span><textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows="2" /></label>
                <div className="action-row" style={{ marginTop: 0 }}>
                  <button className="primary-button" type="submit">{selectedId ? 'Save Changes' : 'Create Employee'}</button>
                  {selectedId && canDeactivate && (
                    <button className="danger-button" type="button" onClick={deactivateEmployee}>Mark Exited</button>
                  )}
                </div>
              </form>
            ) : (
              selectedEmployee && (
                <div className="detail-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {[
                    ['Name', selectedEmployee.name],
                    ['Email', selectedEmployee.email],
                    ['Department', selectedEmployee.department],
                    ['Designation', selectedEmployee.designation],
                    ['Phone', selectedEmployee.phone],
                    ['Location', selectedEmployee.location || selectedEmployee.address],
                    ['Joined', formatDate(selectedEmployee.joiningDate)],
                    ['Status', selectedEmployee.employmentStatus]
                  ].map(([label, val]) => (
                    <div key={label}>
                      <span className="muted-label">{label}</span>
                      <strong style={{ display: 'block', marginTop: '0.2rem', fontSize: '0.875rem' }}>{val || '—'}</strong>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Documents */}
            {selectedId && (
              <div className="detail-section" style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--panel-border)' }}>
                <h4>Documents</h4>
                {canManage && (
                  <form className="detail-stack" onSubmit={uploadDocument} style={{ marginBottom: '0.85rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                      <label className="field"><span>Type</span><select value={documentForm.category} onChange={(e) => setDocumentForm((p) => ({ ...p, category: e.target.value }))}><option value="">General</option>{documentTypes.map((d) => <option key={d.id} value={d.key}>{d.label}</option>)}</select></label>
                      <label className="field"><span>File</span><input type="file" onChange={(e) => setDocumentForm((p) => ({ ...p, file: e.target.files?.[0] || null }))} /></label>
                    </div>
                    <button className="secondary-button small" type="submit" disabled={!documentForm.file} style={{ width: 'fit-content' }}>Upload</button>
                  </form>
                )}
                <div className="mini-history-list">
                  {documents.length === 0 ? (
                    <div className="empty-state" style={{ padding: '0.75rem' }}>No documents uploaded yet.</div>
                  ) : (
                    documents.map((doc) => (
                      <div className="mini-history-item" key={doc.id}>
                        <div>
                          <strong style={{ fontSize: '0.875rem' }}>{doc.originalName}</strong>
                          <p>{doc.category} · {(doc.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <a className="secondary-button small" href={`${apiOrigin}${doc.downloadUrl}`} target="_blank" rel="noreferrer">Open</a>
                          {canDeactivate && <button className="danger-button small" type="button" onClick={() => deleteDocument(doc.id)}>Delete</button>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </article>
        )}
      </div>
    </AppLayout>
  );
}
