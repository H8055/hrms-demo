import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/', label: 'Dashboard', roles: ['admin', 'hr', 'manager', 'employee'] },
  { to: '/employees', label: 'Employees', roles: ['admin', 'hr', 'manager', 'employee'] },
  { to: '/attendance', label: 'Attendance', roles: ['admin', 'hr', 'manager', 'employee'] },
  { to: '/leaves', label: 'Leave', roles: ['admin', 'hr', 'manager', 'employee'] },
  { to: '/advances/request', label: 'Request Advance', roles: ['admin', 'hr', 'manager', 'employee'] },
  { to: '/advances/my', label: 'My Advances', roles: ['admin', 'hr', 'manager', 'employee'] },
  { to: '/advances/admin', label: 'Advance Admin', roles: ['admin', 'hr', 'manager'] },
  { to: '/payroll', label: 'Payroll', roles: ['admin', 'hr', 'manager', 'employee'] },
  { to: '/performance', label: 'Performance', roles: ['admin', 'hr', 'manager', 'employee'] },
  { to: '/reports', label: 'Reports', roles: ['admin', 'hr', 'manager'] },
  { to: '/settings', label: 'Settings', roles: ['admin', 'hr'] },
  { to: '/audit-logs', label: 'Audit Logs', roles: ['admin', 'hr'] }
];

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();

  return (
    <>
      <div className={`sidebar-backdrop ${isOpen ? 'show' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-mark">HR</div>
          <div>
            <strong>HRMS</strong>
            <p>Responsive Portal</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {links
            .filter((link) => link.roles.includes(user?.role))
            .map((link) => (
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
