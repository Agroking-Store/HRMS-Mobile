import apiClient from './apiClient';
import { AppNotification } from '../types/notification';

interface ApiEnvelope<T> {
  success?: boolean;
  data?: T;
}

const extractValue = <T>(payload: T | ApiEnvelope<T>): T => {
  if (payload && typeof payload === 'object' && 'data' in (payload as ApiEnvelope<T>)) {
    const envelope = payload as ApiEnvelope<T>;
    if (envelope.data !== undefined) {
      return envelope.data;
    }
  }
  return payload as T;
};

export const getMyNotifications = async (): Promise<AppNotification[]> => {
  const response = await apiClient.get<
    { items: Array<Record<string, unknown>>; total: number } |
    ApiEnvelope<{ items: Array<Record<string, unknown>>; total: number }>
  >('/notifications');
  const payload = extractValue(response.data);
  return (payload.items ?? []).map(item => {
    const type = String(item.type ?? 'info').toLowerCase();
    const normalizedType: AppNotification['type'] =
      type === 'success' || type === 'error' || type === 'warning' ? type : 'info';
    const rawId = String(item._id ?? item.id ?? '');
    return {
      id: rawId,
      _id: rawId,
      title: String(item.title ?? ''),
      message: String(item.message ?? item.body ?? ''),
      type: normalizedType,
      isRead: Boolean(item.isRead ?? item.readAt),
      createdAt: String(item.createdAt ?? new Date().toISOString()),
      deepLink: typeof item.deepLink === 'string' ? item.deepLink : undefined,
      targetScreen: typeof item.targetScreen === 'string' ? item.targetScreen : undefined,
      metadata: (item.metadata ?? undefined) as Record<string, unknown> | undefined,
    };
  });
};

export const markAsRead = async (notificationId: string): Promise<void> => {
  await apiClient.patch(`/notifications/${notificationId}/read`);
};

export const markAllAsRead = async (): Promise<void> => {
  const notifications = await getMyNotifications();
  const unread = notifications.filter(item => !item.isRead);
  for (const item of unread) {
    await markAsRead(item._id);
  }
};
