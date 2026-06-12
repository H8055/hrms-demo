import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export default function NotificationBell() {
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  async function loadNotifications() {
    setLoading(true);
    try {
      const { data } = await api.get('/notifications?limit=8');
      setItems(data.items || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      setItems([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
    const intervalId = window.setInterval(loadNotifications, 20000);
    return () => window.clearInterval(intervalId);
  }, [location.pathname]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadLabel = useMemo(() => {
    if (!unreadCount) return 'No unread alerts';
    if (unreadCount === 1) return '1 unread alert';
    return `${unreadCount} unread alerts`;
  }, [unreadCount]);

  async function openLink(notification) {
    if (!notification.isRead) {
      try {
        await api.put(`/notifications/${notification.id}/read`);
      } catch {
        // no-op; navigation should still work
      }
    }

    setItems((prev) =>
      prev.map((item) => (item.id === notification.id ? { ...item, isRead: true, readAt: new Date().toISOString() } : item))
    );
    setUnreadCount((prev) => Math.max(prev - (notification.isRead ? 0 : 1), 0));
    setIsOpen(false);

    if (notification.link) {
      navigate(notification.link);
    }
  }

  async function markAllRead() {
    await api.put('/notifications/read-all');
    setItems((prev) => prev.map((item) => ({ ...item, isRead: true, readAt: item.readAt || new Date().toISOString() })));
    setUnreadCount(0);
  }

  return (
    <div className="notification-container" ref={containerRef}>
      <button
        className="notification-trigger"
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open notifications"
      >
        <span aria-hidden="true">🔔</span>
        <span className="notification-trigger-text">Alerts</span>
        {unreadCount ? <span className="notification-count">{unreadCount}</span> : null}
      </button>

      {isOpen ? (
        <div className="notification-dropdown card">
          <div className="notification-header">
            <div>
              <strong>Advance alerts</strong>
              <p>{unreadLabel}</p>
            </div>
            <button className="secondary-button small" type="button" onClick={markAllRead} disabled={!unreadCount}>
              Mark all read
            </button>
          </div>

          {loading ? <div className="empty-state">Loading notifications...</div> : null}

          {!loading && items.length === 0 ? (
            <div className="empty-state">No notifications yet.</div>
          ) : (
            <div className="notification-list">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`notification-item ${item.isRead ? '' : 'unread'}`}
                  onClick={() => openLink(item)}
                >
                  <div className="notification-item-head">
                    <strong>{item.title}</strong>
                    {!item.isRead ? <span className="status-dot" /> : null}
                  </div>
                  <p>{item.message}</p>
                  <small>{new Date(item.createdAt).toLocaleString()}</small>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
