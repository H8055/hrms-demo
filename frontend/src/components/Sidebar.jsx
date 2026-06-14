import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/', label: 'Dashboard', module: 'dashboard', action: 'view' },
  { to: '/employees', label: 'Employees', module: 'employee', action: 'view' },
  { to: '/attendance', label: 'Attendance', module: 'attendance', action: 'view' },
  { to: '/leaves', label: 'Leave', module: 'leave', action: 'view' },
  { to: '/advances/request', label: 'Request Advance', module: 'advance', action: 'create' },
  { to: '/advances/my', label: 'My Advances', module: 'advance', action: 'view' },
  { to: '/advances/admin', label: 'Advance Admin', module: 'advance', action: 'approve' },
  { to: '/payroll', label: 'Payroll', module: 'payroll', action: 'view' },
  { to: '/performance', label: 'Performance', module: 'performance', action: 'view' },
  { to: '/reports', label: 'Reports', module: 'reports', action: 'view' },
  { to: '/settings', label: 'Settings', module: 'settings', action: 'view' },
  { to: '/permissions', label: 'Permissions', module: 'permissions', action: 'view' }
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, canSeeModule, hasPermission } = useAuth();

  const visibleLinks = links.filter((link) => {
    if (link.to === '/advances/admin') {
      return canSeeModule(link.module, link.action) && hasPermission(link.module, link.action);
    }

    return canSeeModule(link.module, link.action) || (link.to === '/' && hasPermission('dashboard', 'view'));
  });

  return (
    <>
      <div className={`sidebar-backdrop ${isOpen ? 'show' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <img src="/mslogo.png" alt="MS HRMS Logo" className="brand-mark" />
          <div>
            <strong>MS HRMS</strong>
          </div>
        </div>

        <nav className="sidebar-nav">
          {visibleLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className={`role-badge role-${user?.role}`}>{user?.role}</span>
          <small>{user?.email}</small>
        </div>
      </aside>
    </>
  );
}
