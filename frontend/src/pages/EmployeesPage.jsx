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
  joiningDate: '',
  manager: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  employmentStatus: 'active'
};

const initialImport = `name,email,role,department,designation,employeeCode,phone,joiningDate,employmentStatus\n`;
const apiOrigin = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

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
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(loadData, 200);
    return () => window.clearTimeout(timeoutId);
  }, [search, canViewDirectory]);

  useEffect(() => {
    if (selectedId) {
      loadDocuments(selectedId);
    }
  }, [selectedId]);

  function selectEmployee(employee) {
    setSelectedId(employee.id);
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
    setError('');
    setMessage('');

    try {
      const payload = {
        ...form,
        manager: form.manager || null,
        joiningDate: form.joiningDate || null
      };

      if (selectedId) {
        await api.put(`/employees/${selectedId}`, payload);
        setMessage('Employee updated successfully.');
      } else {
        await api.post('/employees', payload);
        setMessage('Employee created successfully.');
      }

      await loadData();
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
    formData.append('category', documentForm.category || 'general');

    try {
      await api.post(`/employees/${selectedId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage('Document uploaded successfully.');
      setError('');
      setDocumentForm({ category: documentTypes[0]?.key || '', file: null });
      await loadDocuments(selectedId);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload document');
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
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete document');
    }
  }

  if (!canViewDirectory) {
    return (
      <AppLayout title="My Profile" description="Self-service profile view from the employee management sprint.">
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
                  <div><span className="muted-label">Phone</span><strong>{profile.phone || '—'}</strong></div>
                  <div><span className="muted-label">Manager</span><strong>{profile.manager?.name || '—'}</strong></div>
                </div>
                <div className="detail-section">
                  <span className="muted-label">Address</span>
                  <p>{profile.address || 'No address added yet.'}</p>
                </div>
              </div>
            )}
          </article>
        </section>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Employee Management" description="Dynamic employee directory, CSV import/export, document management, and settings-driven masters.">
      <section className="split-layout">
        <article className="card">
          <div className="section-header wrap-on-mobile">
            <div>
              <h3>Employee directory</h3>
              <p>Search, review, and maintain employee records.</p>
            </div>
            {canExport ? (
              <button className="secondary-button" type="button" onClick={exportCsv}>
                Export CSV
              </button>
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
                  <div><span className="muted-label">Status</span><strong>{item.employmentStatus}</strong></div>
                </div>
              </button>
            ))}
          </div>

          {canManage ? (
            <div className="detail-section">
              <h4>Bulk CSV import</h4>
              <label className="field">
                <span>Paste CSV</span>
                <textarea rows="8" value={importText} onChange={(e) => setImportText(e.target.value)} />
              </label>
              <button className="primary-button" type="button" onClick={importCsv}>Import CSV</button>
            </div>
          ) : null}
        </article>

        <article className="card detail-card">
          <div className="section-header wrap-on-mobile">
            <div>
              <h3>{selectedId ? 'Edit employee' : 'Add employee'}</h3>
              <p>Role, department, designation, and employment status all come from dynamic master data.</p>
            </div>
            {canManage ? (
              <button className="secondary-button" type="button" onClick={() => { setSelectedId(''); setForm({ ...initialForm, role: roles[0]?.key || 'employee' }); setDocuments([]); }}>
                New employee
              </button>
            ) : null}
          </div>

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
                <label className="field"><span>Phone</span><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
                <label className="field"><span>Manager</span><select value={form.manager} onChange={(e) => setForm({ ...form, manager: e.target.value })}><option value="">No manager</option>{managers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
                <label className="field"><span>Emergency contact name</span><input value={form.emergencyContactName} onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })} /></label>
                <label className="field"><span>Emergency contact phone</span><input value={form.emergencyContactPhone} onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })} /></label>
              </div>
              <label className="field"><span>Address</span><textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows="3" /></label>
              <div className="action-row">
                <button className="primary-button" type="submit">{selectedId ? 'Save changes' : 'Create employee'}</button>
                {selectedId && canDeactivate ? <button className="danger-button" type="button" onClick={deactivateEmployee}>Mark exited</button> : null}
              </div>
            </form>
          ) : (
            <div className="empty-state">You can review employee details here. Create/edit controls appear only when your role permission allows them.</div>
          )}

          {selectedId ? (
            <div className="detail-section">
              <h4>Employee documents</h4>
              {canManage ? (
                <form className="detail-stack" onSubmit={uploadDocument}>
                  <div className="detail-grid">
                    <label className="field"><span>Document type</span><select value={documentForm.category} onChange={(e) => setDocumentForm((prev) => ({ ...prev, category: e.target.value }))}><option value="">General</option>{documentTypes.map((item) => <option key={item.id} value={item.key}>{item.label}</option>)}</select></label>
                    <label className="field"><span>File</span><input type="file" onChange={(e) => setDocumentForm((prev) => ({ ...prev, file: e.target.files?.[0] || null }))} /></label>
                  </div>
                  <button className="secondary-button" type="submit" disabled={!documentForm.file}>Upload document</button>
                </form>
              ) : null}

              <div className="mini-history-list">
                {documents.length === 0 ? <div className="empty-state">No documents uploaded yet.</div> : documents.map((item) => (
                  <div className="mini-history-item" key={item.id}>
                    <div>
                      <strong>{item.originalName}</strong>
                      <p>{item.category} · {(item.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <div className="action-row compact-wrap">
                      <a className="secondary-button small" href={`${apiOrigin}${item.downloadUrl}`} target="_blank" rel="noreferrer">Open</a>
                      {canDeactivate ? <button className="danger-button small" type="button" onClick={() => deleteDocument(item.id)}>Delete</button> : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="detail-section">
            <h4>Org chart snapshot</h4>
            <div className="mini-history-list">
              {orgChart.slice(0, 12).map((item) => (
                <div className="mini-history-item" key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <p>{item.designation || item.role}</p>
                  </div>
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
