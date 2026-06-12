import { useEffect, useMemo, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

function clonePermissions(input) {
  return JSON.parse(JSON.stringify(input || {}));
}

export default function PermissionsPage() {
  const { hasPermission, refreshProfile } = useAuth();
  const canEdit = hasPermission('permissions', 'edit');
  const [meta, setMeta] = useState({ roles: [], actions: [], modules: [] });
  const [activeRole, setActiveRole] = useState('admin');
  const [permissionsByRole, setPermissionsByRole] = useState({});
  const [savedPermissionsByRole, setSavedPermissionsByRole] = useState({});
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadData() {
    setLoading(true);
    setError('');

    try {
      const { data } = await api.get('/permissions/roles');
      setMeta(data.meta || { roles: [], actions: [], modules: [] });
      setPermissionsByRole(clonePermissions(data.permissionsByRole));
      setSavedPermissionsByRole(clonePermissions(data.permissionsByRole));
      setAuditLogs(data.auditLogs || []);
      setActiveRole((prev) => prev || data.meta?.roles?.[0] || 'admin');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load permission configuration');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const rolePermissions = permissionsByRole[activeRole] || {};
  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(permissionsByRole) !== JSON.stringify(savedPermissionsByRole),
    [permissionsByRole, savedPermissionsByRole]
  );

  function updateRoleModule(moduleKey, updater) {
    setPermissionsByRole((prev) => {
      const next = clonePermissions(prev);
      next[activeRole] = next[activeRole] || {};
      next[activeRole][moduleKey] = updater(next[activeRole][moduleKey] || { enabled: false, showInSidebar: false, actions: [] });
      return next;
    });
  }

  async function saveRole(roleToSave = activeRole) {
    setSaving(true);
    setMessage('');
    setError('');

    try {
      await api.put('/permissions/bulk-update', {
        role: roleToSave,
        permissions: permissionsByRole[roleToSave]
      });
      setSavedPermissionsByRole(clonePermissions(permissionsByRole));
      setMessage(`Permissions saved for ${roleToSave}.`);
      await Promise.all([loadData(), refreshProfile()]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save permissions');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppLayout
      title="Permission Management"
      description="Configure which role can access each module, what actions they can perform, and whether the module appears in the sidebar."
    >
      {error ? <div className="alert alert-error">{error}</div> : null}
      {message ? <div className="alert alert-success">{message}</div> : null}

      {loading ? (
        <div className="empty-state">Loading permission matrix...</div>
      ) : (
        <>
          {hasUnsavedChanges ? (
            <div className="card unsaved-banner">
              <div>
                <strong>Unsaved changes detected</strong>
                <p>Save the active role after reviewing your permission edits.</p>
              </div>
              {canEdit ? (
                <button className="primary-button" type="button" onClick={() => saveRole(activeRole)} disabled={saving || activeRole === 'admin'}>
                  {saving ? 'Saving...' : `Save ${activeRole}`}
                </button>
              ) : null}
            </div>
          ) : null}

          <section className="split-layout permission-layout">
            <article className="card">
              <div className="section-header wrap-on-mobile">
                <div>
                  <h3>Role tabs</h3>
                  <p>Admin is locked. Other roles can be modified by authorized users.</p>
                </div>
              </div>

              <div className="permission-role-tabs">
                {meta.roles.map((role) => (
                  <button
                    key={role}
                    type="button"
                    className={`chip-button ${activeRole === role ? 'active' : ''}`}
                    onClick={() => setActiveRole(role)}
                  >
                    {role}
                    {role === 'admin' ? ' · locked' : ''}
                  </button>
                ))}
              </div>

              <div className="role-note-card">
                <strong>{activeRole.toUpperCase()}</strong>
                <p>
                  {activeRole === 'admin'
                    ? 'Admin always has full access and cannot be restricted from the UI.'
                    : 'This role can be configured by module, action, and sidebar visibility.'}
                </p>
              </div>

              {canEdit && activeRole !== 'admin' ? (
                <button className="primary-button" type="button" onClick={() => saveRole(activeRole)} disabled={saving}>
                  {saving ? 'Saving...' : `Save ${activeRole} permissions`}
                </button>
              ) : null}
            </article>

            <article className="card detail-card">
              <div className="section-header wrap-on-mobile">
                <div>
                  <h3>Permission matrix</h3>
                  <p>Enable modules, control sidebar visibility, and toggle actions role by role.</p>
                </div>
              </div>

              <div className="permission-module-list">
                {meta.modules.map((moduleItem) => {
                  const modulePermission = rolePermissions[moduleItem.key] || { enabled: false, showInSidebar: false, actions: [] };
                  const isLocked = activeRole === 'admin' || !canEdit;

                  return (
                    <div className="permission-module-card" key={moduleItem.key}>
                      <div className="permission-module-head">
                        <div>
                          <strong>{moduleItem.label}</strong>
                          <p>{moduleItem.description}</p>
                        </div>
                        <div className="permission-switch-grid">
                          <label className="inline-switch">
                            <input
                              type="checkbox"
                              checked={Boolean(modulePermission.enabled)}
                              disabled={isLocked}
                              onChange={(event) =>
                                updateRoleModule(moduleItem.key, (current) => ({
                                  ...current,
                                  enabled: event.target.checked,
                                  showInSidebar: event.target.checked ? current.showInSidebar : false,
                                  actions: event.target.checked ? current.actions : []
                                }))
                              }
                            />
                            <span>Enabled</span>
                          </label>
                          <label className="inline-switch">
                            <input
                              type="checkbox"
                              checked={Boolean(modulePermission.showInSidebar)}
                              disabled={isLocked || !modulePermission.enabled}
                              onChange={(event) =>
                                updateRoleModule(moduleItem.key, (current) => ({
                                  ...current,
                                  showInSidebar: event.target.checked
                                }))
                              }
                            />
                            <span>Show in sidebar</span>
                          </label>
                        </div>
                      </div>

                      <div className="permission-actions-grid">
                        {meta.actions.map((action) => {
                          const checked = (modulePermission.actions || []).includes(action);
                          return (
                            <label className="inline-switch action-chip" key={`${moduleItem.key}-${action}`}>
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={isLocked || !modulePermission.enabled}
                                onChange={(event) =>
                                  updateRoleModule(moduleItem.key, (current) => ({
                                    ...current,
                                    actions: event.target.checked
                                      ? [...new Set([...(current.actions || []), action])]
                                      : (current.actions || []).filter((item) => item !== action)
                                  }))
                                }
                              />
                              <span>{action}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          </section>

          <section className="single-column-layout">
            <article className="card">
              <div className="section-header">
                <div>
                  <h3>Permission audit trail</h3>
                  <p>Recent changes to role permissions and sidebar visibility.</p>
                </div>
              </div>
              <div className="list-stack">
                {auditLogs.length === 0 ? (
                  <div className="empty-state">No permission change logs yet.</div>
                ) : (
                  auditLogs.map((item) => (
                    <div className="timeline-card" key={item.id}>
                      <div className="timeline-head">
                        <strong>{item.action}</strong>
                        <span className="status-chip approved">{item.metadata?.role || 'system'}</span>
                      </div>
                      <div className="timeline-meta stacked-meta">
                        <span>Actor: {item.actor?.name || 'System'}{item.actor?.role ? ` · ${item.actor.role}` : ''}</span>
                        <span>Module: {item.metadata?.module || '—'}</span>
                        <span>Changed: {new Date(item.createdAt).toLocaleString()}</span>
                        {item.metadata?.newValue ? <span>New value: {JSON.stringify(item.metadata.newValue)}</span> : null}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </article>
          </section>
        </>
      )}
    </AppLayout>
  );
}
