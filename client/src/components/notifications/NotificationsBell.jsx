import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { notificationApi } from '../../api/resources.api.js';
import { useNotifications } from '../../context/NotificationContext.jsx';
import { notificationIcon } from './notificationMeta.jsx';
import { formatDateTime } from '../../utils/format.js';

export default function NotificationsBell() {
  const { unreadCount, refresh } = useNotifications();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await notificationApi.list({ limit: 8 });
      setItems(data?.notifications || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  useEffect(() => {
    function onPointerDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  async function openItem(notification) {
    if (!notification.read) {
      try {
        await notificationApi.markRead(notification._id);
      } catch {
        // ignore
      }
      refresh();
    }
    setOpen(false);
    navigate('/notifications');
  }

  async function markAllRead() {
    try {
      await notificationApi.markAllRead();
    } catch {
      // ignore
    }
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    refresh();
  }

  return (
    <div className="notif-bell" ref={containerRef}>
      <button
        type="button"
        className="icon-btn notif-bell__btn"
        onClick={() => setOpen((s) => !s)}
        aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}
        title="Notifications"
        aria-expanded={open}
      >
        <Bell size={17} />
        {unreadCount > 0 ? (
          <span className="notif-bell__badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        ) : null}
      </button>

      {open ? (
        <div className="notif-dropdown" role="dialog" aria-label="Notifications">
          <div className="notif-dropdown__header">
            <strong>Notifications</strong>
            {unreadCount > 0 ? (
              <button type="button" className="link-btn flex" onClick={markAllRead}>
                <CheckCheck size={14} /> Mark all read
              </button>
            ) : null}
          </div>

          <div className="notif-dropdown__body">
            {loading && items.length === 0 ? (
              <div className="notif-empty">Loading…</div>
            ) : items.length === 0 ? (
              <div className="notif-empty">You&apos;re all caught up.</div>
            ) : (
              items.map((n) => {
                const Icon = notificationIcon(n.type);
                return (
                  <button
                    key={n._id}
                    type="button"
                    className={`notif-item ${n.read ? '' : 'notif-item--unread'}`}
                    onClick={() => openItem(n)}
                  >
                    <span className={`notif-item__icon notif-item__icon--${n.level}`}>
                      <Icon size={16} />
                    </span>
                    <span className="notif-item__content">
                      <span className="notif-item__title">{n.title}</span>
                      <span className="notif-item__msg">{n.message}</span>
                      <span className="notif-item__time">{formatDateTime(n.createdAt)}</span>
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <div className="notif-dropdown__footer">
            <Link to="/notifications" className="link-btn" onClick={() => setOpen(false)}>
              View all notifications
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
