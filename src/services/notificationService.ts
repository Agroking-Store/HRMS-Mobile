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
  const response = await apiClient.get<AppNotification[] | ApiEnvelope<AppNotification[]>>('/notification');
  return extractValue(response.data);
};

export const markAsRead = async (notificationId: string): Promise<void> => {
  await apiClient.patch(`/notification/${notificationId}/read`);
};

export const markAllAsRead = async (): Promise<void> => {
  await apiClient.patch('/notification/read-all');
};
