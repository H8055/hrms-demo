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
  emergencyContactPhone: ''
};

export default function EmployeesPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [orgChart, setOrgChart] = useState([]);
  const [profile, setProfile] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const isElevated = ['admin', 'hr', 'manager'].includes(user.role);
  const canManage = ['admin', 'hr'].includes(user.role);

  async function loadData() {
    setError('');
    try {
      if (isElevated) {
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
    const timeoutId = window.setTimeout(loadData, 200);
    return () => window.clearTimeout(timeoutId);
  }, [search, isElevated]);

  function selectEmployee(employee) {
    setSelectedId(employee.id);
    setForm({
      name: employee.name || '',
      email: employee.email || '',
      password: 'Password@123',
      role: employee.role || 'employee',
      department: employee.department || '',
      designation: employee.designation || '',
      employeeCode: employee.employeeCode || '',
      phone: employee.phone || '',
      address: employee.address || '',
      joiningDate: employee.joiningDate ? new Date(employee.joiningDate).toISOString().slice(0, 10) : '',
      manager: employee.manager?.id || '',
      emergencyContactName: employee.emergencyContactName || '',
      emergencyContactPhone: employee.emergencyContactPhone || ''
    });
  }

  const managers = useMemo(
    () => items.filter((item) => ['admin', 'hr', 'manager'].includes(item.role) || item.id !== selectedId),
    [items, selectedId]
  );

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
        setForm(initialForm);
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
      setForm(initialForm);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to deactivate employee');
    }
  }

  if (!isElevated) {
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
    <AppLayout title="Employee Management" description="Sprint 2 foundation: employee directory, profile maintenance, and org chart.">
      <section className="split-layout">
        <article className="card">
          <div className="section-header wrap-on-mobile">
            <div>
              <h3>Employee directory</h3>
              <p>Search, review, and maintain employee records.</p>
            </div>
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
        </article>

        <article className="card detail-card">
          <div className="section-header wrap-on-mobile">
            <div>
              <h3>{selectedId ? 'Edit employee' : 'Add employee'}</h3>
              <p>Responsive form for onboarding and profile updates.</p>
            </div>
            {canManage ? (
              <button className="secondary-button" type="button" onClick={() => { setSelectedId(''); setForm(initialForm); }}>
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
                <label className="field"><span>Role</span><select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="employee">Employee</option><option value="manager">Manager</option><option value="hr">HR</option><option value="admin">Admin</option></select></label>
                <label className="field"><span>Department</span><input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></label>
                <label className="field"><span>Designation</span><input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} /></label>
                <label className="field"><span>Employee code</span><input value={form.employeeCode} onChange={(e) => setForm({ ...form, employeeCode: e.target.value })} /></label>
                <label className="field"><span>Joining date</span><input type="date" value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} /></label>
                <label className="field"><span>Phone</span><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
                <label className="field"><span>Manager</span><select value={form.manager} onChange={(e) => setForm({ ...form, manager: e.target.value })}><option value="">No manager</option>{managers.filter((item) => item.id !== selectedId).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
                <label className="field"><span>Emergency contact name</span><input value={form.emergencyContactName} onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })} /></label>
                <label className="field"><span>Emergency contact phone</span><input value={form.emergencyContactPhone} onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })} /></label>
              </div>
              <label className="field"><span>Address</span><textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows="3" /></label>
              <div className="action-row">
                <button className="primary-button" type="submit">{selectedId ? 'Save changes' : 'Create employee'}</button>
                {selectedId ? <button className="danger-button" type="button" onClick={deactivateEmployee}>Mark exited</button> : null}
              </div>
            </form>
          ) : (
            <div className="empty-state">Managers can review employees here. Only Admin/HR can edit records.</div>
          )}

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
