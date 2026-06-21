import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/', label: 'Dashboard', icon: '◫', module: 'dashboard', action: 'view', hint: 'Overview and KPIs' },
  { to: '/profile', label: 'My Profile', icon: '🧑', always: true, hint: 'Your profile & documents' },
  { to: '/employees', label: 'Employees', icon: '👥', module: 'employee', action: 'view', hint: 'Profiles and org chart' },
  { to: '/profile/change-requests', label: 'Change Requests', icon: '✏', module: 'change-requests', action: 'view', hint: 'Review employee profile update requests' },
  { to: '/attendance', label: 'Attendance', icon: '⏱', module: 'attendance', action: 'view', hint: 'Check-in and regularization' },
  { to: '/leaves', label: 'Leave', icon: '🗓', module: 'leave', action: 'view', hint: 'Balances and approvals' },
  { to: '/advances/request', label: 'Request Advance', icon: '₹', module: 'advance', action: 'create', hint: 'Create advance request' },
  { to: '/advances/my', label: 'My Advances', icon: '📜', module: 'advance', action: 'view', hint: 'Status and history' },
  { to: '/advances/admin', label: 'Advance Workflow', icon: '✔', module: 'advance', action: 'approve', hint: 'Approval and payout queues' },
  { to: '/payroll', label: 'Payroll', icon: '💼', module: 'payroll', action: 'view', hint: 'Salary structures and payslips' },
  { to: '/performance', label: 'Performance', icon: '★', module: 'performance', action: 'view', hint: 'Reviews and goals' },
  { to: '/reports', label: 'Reports', icon: '📈', module: 'reports', action: 'view', hint: 'Exports and analytics' },
  { to: '/settings', label: 'Settings', icon: '⚙', module: 'settings', action: 'view', hint: 'Company and masters' },
  { to: '/permissions', label: 'Permissions', icon: '🔐', module: 'permissions', action: 'view', hint: 'Roles and sidebar control' }
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, canSeeModule, hasPermission } = useAuth();

  const visibleLinks = links.filter((link) => {
    if (link.always) {
      return true;
    }

    if (link.to === '/advances/admin') {
      return (
        canSeeModule('advance', 'view') &&
        (hasPermission('advance', 'approve') || hasPermission('advance', 'pay'))
      );
    }

    return canSeeModule(link.module, link.action) || (link.to === '/' && hasPermission('dashboard', 'view'));
  });

  return (
    <>
      <div className={`sidebar-backdrop ${isOpen ? 'show' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <img src="/mslogo.png" alt="MS HRMS Logo" className="brand-logo" />
          <div>
            <strong>MS HRMS</strong>
          </div>
        </div>

        <div className="sidebar-section-label">Workspace</div>
        <nav className="sidebar-nav">
          {visibleLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={({ isActive }) => `nav-link nav-link-rich ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon" aria-hidden="true">
                {link.icon}
              </span>
              <span className="nav-copy">
                <strong>{link.label}</strong>
                <small>{link.hint}</small>
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className={`role-badge role-${user?.role}`}>{user?.role}</span>
          <small>{user?.email}</small>
          <Link to="/change-password" onClick={onClose} className="sidebar-footer-link">
            Change Password
          </Link>
        </div>
      </aside>
    </>
  );
}
