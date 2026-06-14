import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();

  return (
    <header className="topbar">
      <button className="menu-button" type="button" onClick={onMenuClick} aria-label="Open menu">
        ☰
      </button>

      <div className="topbar-copy">
        <h1>Welcome back</h1>
        <p>
          {user?.name} · {user?.role}
        </p>
      </div>

      <div className="topbar-actions">
        <NotificationBell />
        <button className="secondary-button" type="button" onClick={logout}>
          Logout
        </button>
      </div>
    </header>
  );
}
