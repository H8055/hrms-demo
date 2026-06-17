import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/* ── SVG Icons ─────────────────────────────────────────────── */
const icons = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  employees: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  attendance: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
      <polyline points="9 16 11 18 15 14"/>
    </svg>
  ),
  leave: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
      <line x1="9" y1="14" x2="15" y2="14"/><line x1="12" y1="11" x2="12" y2="17"/>
    </svg>
  ),
  advance: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  payroll: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2"/>
      <line x1="2" y1="10" x2="22" y2="10"/>
    </svg>
  ),
  performance: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  reports: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  permissions: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  myAdvances: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="11" y2="17"/>
    </svg>
  ),
  advanceWorkflow: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
};

const mainLinks = [
  { to: '/', label: 'Dashboard', icon: 'dashboard', module: 'dashboard', action: 'view' },
  { to: '/employees', label: 'Employees', icon: 'employees', module: 'employee', action: 'view' },
  { to: '/attendance', label: 'Attendance', icon: 'attendance', module: 'attendance', action: 'view' },
  { to: '/leaves', label: 'Leave', icon: 'leave', module: 'leave', action: 'view' },
  { to: '/payroll', label: 'Payroll', icon: 'payroll', module: 'payroll', action: 'view' },
];

const advanceLinks = [
  { to: '/advances/request', label: 'Request Advance', icon: 'advance', module: 'advance', action: 'create' },
  { to: '/advances/my', label: 'My Advances', icon: 'myAdvances', module: 'advance', action: 'view' },
  { to: '/advances/admin', label: 'Advance Workflow', icon: 'advanceWorkflow', module: 'advance', action: 'approve', requiresApprove: true },
];

const adminLinks = [
  { to: '/performance', label: 'Performance', icon: 'performance', module: 'performance', action: 'view' },
  { to: '/reports', label: 'Reports', icon: 'reports', module: 'reports', action: 'view' },
  { to: '/settings', label: 'Settings', icon: 'settings', module: 'settings', action: 'view' },
  { to: '/permissions', label: 'Permissions', icon: 'permissions', module: 'permissions', action: 'view' },
];

function getInitials(name = '') {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

export default function Sidebar({ isOpen, onClose }) {
  const { user, canSeeModule, hasPermission } = useAuth();

  function filterLinks(links) {
    return links.filter((link) => {
      if (link.requiresApprove) {
        return (
          canSeeModule('advance', 'view') &&
          (hasPermission('advance', 'approve') || hasPermission('advance', 'pay'))
        );
      }
      return canSeeModule(link.module, link.action) || (link.to === '/' && hasPermission('dashboard', 'view'));
    });
  }

  const visibleMain = filterLinks(mainLinks);
  const visibleAdvance = filterLinks(advanceLinks);
  const visibleAdmin = filterLinks(adminLinks);

  function NavItem({ link }) {
    return (
      <NavLink
        key={link.to}
        to={link.to}
        end={link.to === '/'}
        onClick={onClose}
        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
      >
        <span className="nav-icon-wrap" aria-hidden="true">{icons[link.icon]}</span>
        <span className="nav-label">{link.label}</span>
      </NavLink>
    );
  }

  return (
    <>
      <div className={`sidebar-backdrop ${isOpen ? 'show' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>

        {/* Brand */}
        <div className="sidebar-brand">
          <img src="/mslogo.png" alt="MS HRMS" className="brand-logo" />
          <div className="sidebar-brand-text">
            <strong>MS HRMS</strong>
            <span>HR Management</span>
          </div>
        </div>

        <div className="sidebar-nav">
          {/* MAIN */}
          {visibleMain.length > 0 && (
            <>
              <div className="sidebar-section-label">Main</div>
              {visibleMain.map((link) => <NavItem key={link.to} link={link} />)}
            </>
          )}

          {/* ADVANCES */}
          {visibleAdvance.length > 0 && (
            <>
              <div className="sidebar-section-label">Advances</div>
              {visibleAdvance.map((link) => <NavItem key={link.to} link={link} />)}
            </>
          )}

          {/* ADMIN */}
          {visibleAdmin.length > 0 && (
            <>
              <div className="sidebar-section-label">Admin</div>
              {visibleAdmin.map((link) => <NavItem key={link.to} link={link} />)}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-footer-avatar">{getInitials(user?.name)}</div>
          <div className="sidebar-footer-info">
            <strong>{user?.name}</strong>
            <small>{user?.designation || user?.role}</small>
          </div>
        </div>
      </aside>
    </>
  );
}
