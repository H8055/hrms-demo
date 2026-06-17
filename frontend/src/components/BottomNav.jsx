import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const primaryLinks = [
  { to: '/', label: 'Home', icon: '◫', module: 'dashboard', action: 'view' },
  { to: '/employees', label: 'Team', icon: '👥', module: 'employee', action: 'view' },
  { to: '/attendance', label: 'Attend', icon: '⏱', module: 'attendance', action: 'view' },
  { to: '/leaves', label: 'Leave', icon: '🗓', module: 'leave', action: 'view' },
];

const moreLinks = [
  { to: '/advances/my', label: 'My Advances', icon: '📜', module: 'advance', action: 'view' },
  { to: '/advances/request', label: 'Request Advance', icon: '₹', module: 'advance', action: 'create' },
  { to: '/advances/admin', label: 'Advance Workflow', icon: '✔', module: 'advance', action: 'approve' },
  { to: '/payroll', label: 'Payroll', icon: '💼', module: 'payroll', action: 'view' },
  { to: '/performance', label: 'Performance', icon: '★', module: 'performance', action: 'view' },
  { to: '/reports', label: 'Reports', icon: '📈', module: 'reports', action: 'view' },
  { to: '/settings', label: 'Settings', icon: '⚙', module: 'settings', action: 'view' },
  { to: '/permissions', label: 'Permissions', icon: '🔐', module: 'permissions', action: 'view' },
];

export default function BottomNav() {
  const { canSeeModule, hasPermission, logout } = useAuth();
  const [showMore, setShowMore] = useState(false);
  const navigate = useNavigate();

  const visiblePrimary = primaryLinks.filter((l) =>
    l.to === '/' ? hasPermission('dashboard', 'view') : canSeeModule(l.module, l.action)
  );

  const visibleMore = moreLinks.filter((l) => {
    if (l.to === '/advances/admin') {
      return (
        canSeeModule('advance', 'view') &&
        (hasPermission('advance', 'approve') || hasPermission('advance', 'pay'))
      );
    }
    return canSeeModule(l.module, l.action);
  });

  const slots = visiblePrimary.slice(0, 4);

  return (
    <>
      {showMore && (
        <div className="bottom-sheet-backdrop" onClick={() => setShowMore(false)} />
      )}
      {showMore && (
        <div className="bottom-sheet">
          <div className="bottom-sheet-handle" />
          <div className="bottom-sheet-grid">
            {visibleMore.map((link) => (
              <button
                key={link.to}
                className="bottom-sheet-item"
                onClick={() => { setShowMore(false); navigate(link.to); }}
              >
                <span className="bottom-sheet-icon">{link.icon}</span>
                <span>{link.label}</span>
              </button>
            ))}
            {/* Logout always visible in More sheet on mobile */}
            <button
              className="bottom-sheet-item"
              style={{ borderColor: '#fca5a5', color: '#dc2626' }}
              onClick={() => { setShowMore(false); logout(); }}
            >
              <span className="bottom-sheet-icon">🚪</span>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
      <nav className="bottom-nav">
        {slots.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="bottom-nav-icon">{link.icon}</span>
            <span className="bottom-nav-label">{link.label}</span>
          </NavLink>
        ))}
        <button
          className={`bottom-nav-item ${showMore ? 'active' : ''}`}
          onClick={() => setShowMore((p) => !p)}
        >
          <span className="bottom-nav-icon">⋯</span>
          <span className="bottom-nav-label">More</span>
        </button>
      </nav>
    </>
  );
}
