import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { getMyNotifications } from '../services/notificationService';

interface NotificationContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
  decrementUnreadCount: () => void;
  clearUnreadCount: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  refreshUnreadCount: async () => {},
  decrementUnreadCount: () => {},
  clearUnreadCount: () => {},
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const notifications = await getMyNotifications();
      const unread = notifications.filter(item => !item.isRead).length;
      setUnreadCount(unread);
    } catch {
      setUnreadCount(0);
    }
  }, []);

  const decrementUnreadCount = useCallback(() => {
    setUnreadCount(prev => (prev > 0 ? prev - 1 : 0));
  }, []);

  const clearUnreadCount = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const contextValue = useMemo(
    () => ({
      unreadCount,
      refreshUnreadCount,
      decrementUnreadCount,
      clearUnreadCount,
    }),
    [clearUnreadCount, decrementUnreadCount, refreshUnreadCount, unreadCount],
  );

  return <NotificationContext.Provider value={contextValue}>{children}</NotificationContext.Provider>;
}

export const useNotification = () => useContext(NotificationContext);
