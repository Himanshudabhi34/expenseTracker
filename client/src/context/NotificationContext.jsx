import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { notificationApi } from '../api/resources.api.js';

const NotificationContext = createContext(null);

const POLL_MS = 60000;

export function NotificationProvider({ children }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();

  const refresh = useCallback(async () => {
    try {
      const data = await notificationApi.unreadCount();
      setUnreadCount(Number(data?.unreadCount) || 0);
    } catch {
      // Notifications are non-critical; ignore transient failures.
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, location.pathname]);

  useEffect(() => {
    const timer = setInterval(refresh, POLL_MS);
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, [refresh]);

  const value = useMemo(
    () => ({ unreadCount, refresh, setUnreadCount }),
    [unreadCount, refresh]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}

export default NotificationContext;
