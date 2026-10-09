import { useMemo, useState } from 'react';
import {
  Bell,
  CheckCheck,
  Trash2,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { notificationApi } from '../api/resources.api.js';
import { useAsync } from '../hooks/useAsync.js';
import { useToast } from '../context/ToastContext.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  PageHeader,
  Spinner,
} from '../components/common/index.jsx';
import { notificationIcon } from '../components/notifications/notificationMeta.jsx';
import { formatDateTime } from '../utils/format.js';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
];

export default function NotificationsPage() {
  const toast = useToast();
  const { refresh } = useNotifications();
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);

  const params = useMemo(
    () => ({ page, limit: 20, ...(filter === 'unread' ? { unread: true } : {}) }),
    [page, filter]
  );

  const { data, loading, reload, setData } = useAsync(
    () => notificationApi.list(params),
    [JSON.stringify(params)]
  );

  const notifications = data?.notifications || [];
  const pagination = data?.pagination;

  function applyFilter(value) {
    setFilter(value);
    setPage(1);
  }

  async function markRead(notification) {
    if (notification.read) return;
    try {
      await notificationApi.markRead(notification._id);
      setData((prev) =>
        prev
          ? {
              ...prev,
              notifications: prev.notifications.map((n) =>
                n._id === notification._id ? { ...n, read: true } : n
              ),
            }
          : prev
      );
      refresh();
    } catch (err) {
      toast.error(err.message || 'Could not update notification');
    }
  }

  async function markAllRead() {
    try {
      await notificationApi.markAllRead();
      toast.success('All notifications marked as read');
      reload();
      refresh();
    } catch (err) {
      toast.error(err.message || 'Could not update notifications');
    }
  }

  async function remove(notification) {
    try {
      await notificationApi.remove(notification._id);
      toast.success('Notification deleted');
      reload();
      refresh();
    } catch (err) {
      toast.error(err.message || 'Could not delete notification');
    }
  }

  async function clearAll() {
    setClearing(true);
    try {
      await notificationApi.clearAll();
      toast.success('Notifications cleared');
      setConfirmClear(false);
      setPage(1);
      reload();
      refresh();
    } catch (err) {
      toast.error(err.message || 'Could not clear notifications');
    } finally {
      setClearing(false);
    }
  }

  const unreadCount = data?.unreadCount || 0;

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Budget alerts, goal milestones, large expenses and monthly summaries."
        actions={
          <>
            {unreadCount > 0 ? (
              <Button variant="ghost" icon={CheckCheck} onClick={markAllRead}>
                Mark all read
              </Button>
            ) : null}
            {notifications.length > 0 ? (
              <Button variant="ghost" icon={Trash2} onClick={() => setConfirmClear(true)}>
                Clear all
              </Button>
            ) : null}
          </>
        }
      />

      <Card>
        <div className="card__header">
          <div className="chip-row">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                className={`chip ${filter === f.value ? 'active' : ''}`}
                onClick={() => applyFilter(f.value)}
              >
                {f.label}
                {f.value === 'unread' && unreadCount > 0 ? ` (${unreadCount})` : ''}
              </button>
            ))}
          </div>
        </div>

        <div className="card__body" style={{ paddingTop: 8 }}>
          {loading && !data ? (
            <Spinner center />
          ) : notifications.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No notifications"
              message={
                filter === 'unread'
                  ? 'You have read everything. Nice work!'
                  : 'Alerts about budgets, goals and big expenses will appear here.'
              }
            />
          ) : (
            <div className="notif-list">
              {notifications.map((n) => {
                const Icon = notificationIcon(n.type);
                return (
                  <div
                    key={n._id}
                    className={`notif-row ${n.read ? '' : 'notif-row--unread'}`}
                  >
                    <span className={`notif-row__icon notif-item__icon--${n.level}`}>
                      <Icon size={17} />
                    </span>
                    <div className="notif-row__main">
                      <div className="notif-row__title">{n.title}</div>
                      <div className="notif-row__msg">{n.message}</div>
                      <div className="notif-row__time">{formatDateTime(n.createdAt)}</div>
                    </div>
                    <div className="notif-row__actions">
                      {!n.read ? (
                        <button
                          type="button"
                          className="icon-btn"
                          title="Mark as read"
                          aria-label="Mark as read"
                          onClick={() => markRead(n)}
                        >
                          <Check size={15} />
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="icon-btn"
                        title="Delete"
                        aria-label="Delete"
                        onClick={() => remove(n)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {pagination && pagination.total > 0 ? (
            <div className="pagination">
              <span>
                Page {pagination.page} of {pagination.totalPages} · {pagination.total} notification
                {pagination.total === 1 ? '' : 's'}
              </span>
              <div className="pagination__controls">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={ChevronLeft}
                  disabled={!pagination.hasPrevPage}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  iconRight={ChevronRight}
                  disabled={!pagination.hasNextPage}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </Card>

      <ConfirmDialog
        open={confirmClear}
        title="Clear all notifications"
        message="This permanently removes all your notifications. Continue?"
        onConfirm={clearAll}
        onCancel={() => setConfirmClear(false)}
        busy={clearing}
      />
    </>
  );
}
