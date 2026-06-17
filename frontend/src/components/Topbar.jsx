import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

function formatDate(d) {
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function getInitials(name = '') {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

export default function Topbar({ onMenuClick, title }) {
  const { user, logout } = useAuth();
  const today = new Date();

  return (
    <header className="topbar">
      {/* Mobile: hamburger + brand */}
      <button className="menu-button desktop-menu-btn" type="button" onClick={onMenuClick} aria-label="Toggle sidebar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      <div className="topbar-brand-mobile">
        <img src="/mslogo.png" alt="MS HRMS" className="topbar-logo" />
        <span className="topbar-page-title">{title || 'MS HRMS'}</span>
      </div>

      {/* Desktop: page title + date */}
      <div className="topbar-left">
        <h1>{title || 'Dashboard'}</h1>
        <p>{formatDate(today)}</p>
      </div>

      {/* Search */}
      <div className="topbar-search">
        <span className="topbar-search-icon"><SearchIcon /></span>
        <input type="search" placeholder="Search..." />
      </div>

      <div className="topbar-actions">
        <NotificationBell />
        {/* User avatar — shows name on desktop */}
        <div className="topbar-avatar" title={`${user?.name} — ${user?.role}`}>
          {getInitials(user?.name)}
        </div>
        <button className="secondary-button small topbar-logout-btn" type="button" onClick={logout}>
          Sign out
        </button>
      </div>
    </header>
  );
}
