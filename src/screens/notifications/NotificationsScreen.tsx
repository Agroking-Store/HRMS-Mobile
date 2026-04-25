import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useNotification } from '../../context/NotificationContext';
import {
  getMyNotifications,
  markAllAsRead,
  markAsRead,
} from '../../services/notificationService';
import { AppNotification, NotificationType } from '../../types/notification';

const TYPE_COLORS: Record<NotificationType, string> = {
  success: '#F0FDF4',
  error: '#FEF2F2',
  warning: '#FFFBEB',
  info: '#EFF6FF',
};

const TYPE_TEXT_COLORS: Record<NotificationType, string> = {
  success: '#065F46',
  error: '#991B1B',
  warning: '#92400E',
  info: '#1E3A8A',
};

const formatDateTime = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function NotificationsScreen() {
  const { unreadCount, refreshUnreadCount, decrementUnreadCount, clearUnreadCount } = useNotification();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [markingAll, setMarkingAll] = useState(false);
  const [markingMap, setMarkingMap] = useState<Record<string, boolean>>({});

  const loadNotifications = useCallback(
    async (isRefresh: boolean) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');
      try {
        const response = await getMyNotifications();
        const sorted = [...response].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setNotifications(sorted);
        await refreshUnreadCount();
      } catch {
        setError('Unable to load notifications. Please try again.');
      } finally {
        if (isRefresh) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [refreshUnreadCount],
  );

  useFocusEffect(
    useCallback(() => {
      void loadNotifications(false);
    }, [loadNotifications]),
  );

  const handleMarkOneRead = async (item: AppNotification) => {
    if (item.isRead || markingMap[item._id]) {
      return;
    }
    setMarkingMap(prev => ({ ...prev, [item._id]: true }));
    setNotifications(prev =>
      prev.map(notification =>
        notification._id === item._id ? { ...notification, isRead: true } : notification,
      ),
    );
    decrementUnreadCount();
    try {
      await markAsRead(item._id);
    } catch {
      setNotifications(prev =>
        prev.map(notification =>
          notification._id === item._id ? { ...notification, isRead: false } : notification,
        ),
      );
      await refreshUnreadCount();
    } finally {
      setMarkingMap(prev => ({ ...prev, [item._id]: false }));
    }
  };

  const handleMarkAllRead = async () => {
    if (markingAll || unreadCount === 0) {
      return;
    }
    const previous = notifications;
    setMarkingAll(true);
    setNotifications(prev => prev.map(item => ({ ...item, isRead: true })));
    clearUnreadCount();
    try {
      await markAllAsRead();
    } catch {
      setNotifications(previous);
      await refreshUnreadCount();
    } finally {
      setMarkingAll(false);
    }
  };

  const header = useMemo(
    () => (
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>
            Unread: {unreadCount}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.markAllButton, (markingAll || unreadCount === 0) && styles.disabledButton]}
          onPress={() => void handleMarkAllRead()}
          disabled={markingAll || unreadCount === 0}
        >
          {markingAll ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.markAllText}>Mark All as Read</Text>
          )}
        </TouchableOpacity>
      </View>
    ),
    [markingAll, unreadCount],
  );

  if (loading) {
    return (
      <View style={styles.stateContainer}>
        <ActivityIndicator size="large" color="#01696f" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.stateContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => void loadNotifications(false)}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (notifications.length === 0) {
    return (
      <View style={styles.container}>
        {header}
        <View style={styles.stateContainer}>
          <Text style={styles.emptyText}>No notifications available.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {header}
      <FlatList
        data={notifications}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadNotifications(true)}
            tintColor="#01696f"
          />
        }
        renderItem={({ item }) => {
          const isMarking = markingMap[item._id];
          const cardBackground = item.isRead ? '#FFFFFF' : TYPE_COLORS[item.type];
          return (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: cardBackground }]}
              activeOpacity={0.8}
              onPress={() => void handleMarkOneRead(item)}
              disabled={item.isRead || isMarking}
            >
              <View style={styles.rowBetween}>
                <Text style={styles.title}>{item.title}</Text>
                {!item.isRead ? (
                  <View style={styles.unreadPill}>
                    <Text style={styles.unreadPillText}>Unread</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.message}>{item.message}</Text>
              <View style={styles.footerRow}>
                <Text style={[styles.typeText, { color: TYPE_TEXT_COLORS[item.type] }]}>
                  {item.type.toUpperCase()}
                </Text>
                <Text style={styles.timeText}>{formatDateTime(item.createdAt)}</Text>
              </View>
              {isMarking ? <ActivityIndicator size="small" color="#01696f" style={styles.inlineLoader} /> : null}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  markAllButton: {
    backgroundColor: '#01696f',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.6,
  },
  listContent: {
    padding: 12,
    gap: 10,
    paddingBottom: 24,
  },
  card: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  message: {
    fontSize: 14,
    color: '#374151',
  },
  unreadPill: {
    backgroundColor: '#01696f',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  unreadPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  timeText: {
    fontSize: 12,
    color: '#6B7280',
  },
  inlineLoader: {
    marginTop: 2,
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#01696f',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
