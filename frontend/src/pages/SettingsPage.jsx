import { useEffect, useMemo, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const generalDefaults = {
  companyName: '',
  companyEmail: '',
  companyPhone: '',
  logoUrl: '',
  address: '',
  leaveTypes: 'annual, sick, casual, unpaid',
  holidays: '',
  advanceApprovalDepartments: [],
  advancePayoutDepartments: []
};

const roleDefaults = {
  id: '',
  key: '',
  label: '',
  description: '',
  isActive: true,
  sortOrder: 100
};

const masterDefaults = {
  id: '',
  category: 'departments',
  key: '',
  label: '',
  description: '',
  isActive: true,
  sortOrder: 100,
  metadata: '{}'
};

function prettyMetadata(value) {
  try {
    return JSON.stringify(value || {}, null, 2);
  } catch {
    return '{}';
  }
}

export default function SettingsPage() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('settings', 'edit');
  const [activeTab, setActiveTab] = useState('general');
  const [form, setForm] = useState(generalDefaults);
  const [roles, setRoles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [masterData, setMasterData] = useState({});
  const [roleForm, setRoleForm] = useState(roleDefaults);
  const [masterForm, setMasterForm] = useState(masterDefaults);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadBundle() {
    setLoading(true);
    try {
      const { data } = await api.get('/settings/bundle');
      const settings = data.settings;
      setForm({
        companyName: settings.companyName || '',
        companyEmail: settings.companyEmail || '',
        companyPhone: settings.companyPhone || '',
        logoUrl: settings.logoUrl || '',
        address: settings.address || '',
        leaveTypes: (settings.leaveTypes || []).join(', '),
        holidays: (settings.holidays || []).join('\n'),
        advanceApprovalDepartments: settings.advanceWorkflow?.approvalDepartments || [],
        advancePayoutDepartments: settings.advanceWorkflow?.payoutDepartments || []
      });
      setRoles(data.roles || []);
      setCategories(data.categories || []);
      setMasterData(data.masterData || {});
      if ((data.categories || []).length && !masterForm.category) {
        setMasterForm((prev) => ({ ...prev, category: data.categories[0] }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load settings bundle');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBundle();
  }, []);

  const currentMasterItems = useMemo(
    () => masterData[masterForm.category] || [],
    [masterData, masterForm.category]
  );

  const departmentOptions = masterData.departments || [];

  const stats = useMemo(
    () => ({
      roleCount: roles.length,
      categoryCount: categories.length,
      itemCount: Object.values(masterData).reduce((sum, items) => sum + items.length, 0)
    }),
    [roles, categories, masterData]
  );

  async function submitGeneral(event) {
    event.preventDefault();
    try {
      await api.put('/settings', {
        ...form,
        leaveTypes: form.leaveTypes.split(',').map((item) => item.trim()).filter(Boolean),
        holidays: form.holidays.split('\n').map((item) => item.trim()).filter(Boolean),
        advanceWorkflow: {
          approvalDepartments: form.advanceApprovalDepartments,
          payoutDepartments: form.advancePayoutDepartments
        }
      });
      setMessage('General settings saved successfully.');
      setError('');
      loadBundle();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save settings');
    }
  }

  async function submitRole(event) {
    event.preventDefault();
    try {
      const payload = {
        key: roleForm.key,
        label: roleForm.label,
        description: roleForm.description,
        isActive: roleForm.isActive,
        sortOrder: Number(roleForm.sortOrder || 100)
      };

      if (roleForm.id) {
        await api.put(`/settings/roles/${roleForm.id}`, payload);
        setMessage('Role updated successfully.');
      } else {
        await api.post('/settings/roles', payload);
        setMessage('Role created successfully.');
      }

      setError('');
      setRoleForm(roleDefaults);
      await loadBundle();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save role');
    }
  }

  async function submitMasterItem(event) {
    event.preventDefault();
    try {
      let metadata = {};
      if (masterForm.metadata.trim()) {
        metadata = JSON.parse(masterForm.metadata);
      }

      const payload = {
        category: masterForm.category,
        key: masterForm.key,
        label: masterForm.label,
        description: masterForm.description,
        isActive: masterForm.isActive,
        sortOrder: Number(masterForm.sortOrder || 100),
        metadata
      };

      if (masterForm.id) {
        await api.put(`/settings/masters/${masterForm.id}`, payload);
        setMessage('Master data item updated successfully.');
      } else {
        await api.post('/settings/masters', payload);
        setMessage('Master data item created successfully.');
      }

      setError('');
      setMasterForm((prev) => ({ ...masterDefaults, category: prev.category }));
      await loadBundle();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save master data item');
    }
  }

  function startEditRole(role) {
    setRoleForm({
      id: role.id,
      key: role.key,
      label: role.label,
      description: role.description || '',
      isActive: role.isActive,
      sortOrder: role.sortOrder || 100
    });
    setActiveTab('roles');
  }

  function startEditMaster(item) {
    setMasterForm({
      id: item.id,
      category: item.category,
      key: item.key,
      label: item.label,
      description: item.description || '',
      isActive: item.isActive,
      sortOrder: item.sortOrder || 100,
      metadata: prettyMetadata(item.metadata)
    });
    setActiveTab('masters');
  }

  return (
    <AppLayout
      eyebrow="System governance"
      title="Settings & Master Data"
      description="Manage company settings, dynamic roles, and reusable HRMS master data from one UI. This is the control layer behind forms, permissions, and operational dropdowns."
    >
      {error ? <div className="alert alert-error">{error}</div> : null}
      {message ? <div className="alert alert-success">{message}</div> : null}

      {loading ? (
        <div className="empty-state">Loading settings...</div>
      ) : (
        <>
          <section className="stats-grid compact-grid">
            <div className="stat-card"><p>Configured roles</p><h3>{stats.roleCount}</h3><small>Role catalog managed from settings</small></div>
            <div className="stat-card"><p>Master categories</p><h3>{stats.categoryCount}</h3><small>Reusable data groups across HRMS</small></div>
            <div className="stat-card"><p>Master items</p><h3>{stats.itemCount}</h3><small>Total dynamic values currently available</small></div>
            <div className="stat-card"><p>Edit access</p><h3>{canEdit ? 'Enabled' : 'Read only'}</h3><small>Governed by settings permissions</small></div>
          </section>

          <section className="single-column-layout">
            <article className="card card-elevated">
              <div className="permission-role-tabs">
                <button className={`chip-button ${activeTab === 'general' ? 'active' : ''}`} type="button" onClick={() => setActiveTab('general')}>General</button>
                <button className={`chip-button ${activeTab === 'roles' ? 'active' : ''}`} type="button" onClick={() => setActiveTab('roles')}>Roles</button>
                <button className={`chip-button ${activeTab === 'masters' ? 'active' : ''}`} type="button" onClick={() => setActiveTab('masters')}>Master Data</button>
              </div>
            </article>
          </section>

          {activeTab === 'general' ? (
            <section className="single-column-layout">
              <form className="card detail-stack card-elevated" onSubmit={submitGeneral}>
                <div className="section-header"><div><h3>Company profile</h3><p>Basic identity, contact, and configuration values used across the application.</p></div></div>
                <div className="detail-grid">
                  <label className="field"><span>Company name</span><input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} /></label>
                  <label className="field"><span>Company email</span><input type="email" value={form.companyEmail} onChange={(e) => setForm({ ...form, companyEmail: e.target.value })} /></label>
                  <label className="field"><span>Company phone</span><input value={form.companyPhone} onChange={(e) => setForm({ ...form, companyPhone: e.target.value })} /></label>
                  <label className="field"><span>Logo URL</span><input value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} /></label>
                </div>
                <label className="field"><span>Address</span><textarea rows="3" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label>
                <div className="detail-grid">
                  <label className="field"><span>Leave types (display reference)</span><input value={form.leaveTypes} onChange={(e) => setForm({ ...form, leaveTypes: e.target.value })} /></label>
                  <label className="field"><span>Holiday list (one per line)</span><textarea rows="5" value={form.holidays} onChange={(e) => setForm({ ...form, holidays: e.target.value })} /></label>
                </div>
                <div className="detail-grid">
                  <label className="field">
                    <span>Advance approval departments</span>
                    <select
                      multiple
                      value={form.advanceApprovalDepartments}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          advanceApprovalDepartments: Array.from(e.target.selectedOptions).map((option) => option.value)
                        })
                      }
                    >
                      {departmentOptions.map((item) => <option key={item.id} value={item.label}>{item.label}</option>)}
                    </select>
                  </label>
                  <label className="field">
                    <span>Advance payout departments</span>
                    <select
                      multiple
                      value={form.advancePayoutDepartments}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          advancePayoutDepartments: Array.from(e.target.selectedOptions).map((option) => option.value)
                        })
                      }
                    >
                      {departmentOptions.map((item) => <option key={item.id} value={item.label}>{item.label}</option>)}
                    </select>
                  </label>
                </div>
                <button className="primary-button" type="submit" disabled={!canEdit}>Save general settings</button>
                {!canEdit ? <p className="helper-text">You can view settings, but your current role does not have edit access.</p> : null}
              </form>
            </section>
          ) : null}

          {activeTab === 'roles' ? (
            <section className="split-layout align-start">
              <article className="card card-elevated">
                <div className="section-header"><div><h3>Available roles</h3><p>Roles created here can later be used across users, permissions, and navigation.</p></div></div>
                <div className="list-stack selectable-list">
                  {roles.map((role) => (
                    <button type="button" className="request-card selectable-card" key={role.id} onClick={() => startEditRole(role)}>
                      <div className="request-card-top">
                        <div>
                          <strong>{role.label}</strong>
                          <p>{role.key}</p>
                        </div>
                        <span className={`status-chip ${role.isActive ? 'approved' : 'rejected'}`}>{role.isActive ? 'active' : 'inactive'}</span>
                      </div>
                      <div className="timeline-meta stacked-meta">
                        <span>{role.description || 'No description'}</span>
                        <span>{role.isSystem ? 'System role' : 'Custom role'}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </article>

              <article className="card detail-card card-elevated">
                <div className="section-header"><div><h3>{roleForm.id ? 'Edit role' : 'Create role'}</h3><p>New roles will appear in employee forms and permission management automatically.</p></div></div>
                <form className="detail-stack" onSubmit={submitRole}>
                  <div className="detail-grid">
                    <label className="field"><span>Role key</span><input value={roleForm.key} onChange={(e) => setRoleForm({ ...roleForm, key: e.target.value })} disabled={!canEdit} placeholder="team-lead" /></label>
                    <label className="field"><span>Role label</span><input value={roleForm.label} onChange={(e) => setRoleForm({ ...roleForm, label: e.target.value })} disabled={!canEdit} required /></label>
                    <label className="field"><span>Sort order</span><input type="number" value={roleForm.sortOrder} onChange={(e) => setRoleForm({ ...roleForm, sortOrder: e.target.value })} disabled={!canEdit} /></label>
                    <label className="field"><span>Status</span><select value={String(roleForm.isActive)} onChange={(e) => setRoleForm({ ...roleForm, isActive: e.target.value === 'true' })} disabled={!canEdit}><option value="true">Active</option><option value="false">Inactive</option></select></label>
                  </div>
                  <label className="field"><span>Description</span><textarea rows="4" value={roleForm.description} onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })} disabled={!canEdit} /></label>
                  <div className="action-row">
                    <button className="primary-button" type="submit" disabled={!canEdit}>{roleForm.id ? 'Save role' : 'Create role'}</button>
                    <button className="secondary-button" type="button" onClick={() => setRoleForm(roleDefaults)}>Reset</button>
                  </div>
                </form>
              </article>
            </section>
          ) : null}

          {activeTab === 'masters' ? (
            <section className="split-layout align-start">
              <article className="card card-elevated">
                <div className="section-header wrap-on-mobile">
                  <div><h3>Master data categories</h3><p>These items drive dynamic dropdowns, filters, and workflow values across HRMS.</p></div></div>
                <label className="field">
                  <span>Category</span>
                  <select value={masterForm.category} onChange={(e) => setMasterForm({ ...masterForm, category: e.target.value, id: '', key: '', label: '', description: '', metadata: '{}' })}>
                    {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                  </select>
                </label>
                <div className="list-stack selectable-list">
                  {currentMasterItems.map((item) => (
                    <button type="button" className="request-card selectable-card" key={item.id} onClick={() => startEditMaster(item)}>
                      <div className="request-card-top">
                        <div>
                          <strong>{item.label}</strong>
                          <p>{item.key}</p>
                        </div>
                        <span className={`status-chip ${item.isActive ? 'approved' : 'rejected'}`}>{item.isActive ? 'active' : 'inactive'}</span>
                      </div>
                      <div className="timeline-meta stacked-meta">
                        <span>{item.description || 'No description'}</span>
                        <span>{item.isSystem ? 'System item' : 'Custom item'}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </article>

              <article className="card detail-card card-elevated">
                <div className="section-header"><div><h3>{masterForm.id ? 'Edit master item' : 'Create master item'}</h3><p>Use metadata for advanced values such as holiday dates, shift timings, or default balances.</p></div></div>
                <form className="detail-stack" onSubmit={submitMasterItem}>
                  <div className="detail-grid">
                    <label className="field"><span>Category</span><select value={masterForm.category} onChange={(e) => setMasterForm({ ...masterForm, category: e.target.value })} disabled={!canEdit}>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
                    <label className="field"><span>Key</span><input value={masterForm.key} onChange={(e) => setMasterForm({ ...masterForm, key: e.target.value })} disabled={!canEdit} placeholder="software-engineer" /></label>
                    <label className="field"><span>Label</span><input value={masterForm.label} onChange={(e) => setMasterForm({ ...masterForm, label: e.target.value })} disabled={!canEdit} required /></label>
                    <label className="field"><span>Sort order</span><input type="number" value={masterForm.sortOrder} onChange={(e) => setMasterForm({ ...masterForm, sortOrder: e.target.value })} disabled={!canEdit} /></label>
                    <label className="field"><span>Status</span><select value={String(masterForm.isActive)} onChange={(e) => setMasterForm({ ...masterForm, isActive: e.target.value === 'true' })} disabled={!canEdit}><option value="true">Active</option><option value="false">Inactive</option></select></label>
                  </div>
                  <label className="field"><span>Description</span><textarea rows="3" value={masterForm.description} onChange={(e) => setMasterForm({ ...masterForm, description: e.target.value })} disabled={!canEdit} /></label>
                  <label className="field"><span>Metadata (JSON)</span><textarea rows="8" value={masterForm.metadata} onChange={(e) => setMasterForm({ ...masterForm, metadata: e.target.value })} disabled={!canEdit} /></label>
                  <div className="action-row">
                    <button className="primary-button" type="submit" disabled={!canEdit}>{masterForm.id ? 'Save item' : 'Create item'}</button>
                    <button className="secondary-button" type="button" onClick={() => setMasterForm({ ...masterDefaults, category: masterForm.category })}>Reset</button>
                  </div>
                </form>
              </article>
            </section>
          ) : null}
        </>
      )}
    </AppLayout>
  );
}
