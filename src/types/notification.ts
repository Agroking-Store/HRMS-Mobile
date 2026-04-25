export type NotificationType = 'info' | 'warning' | 'success' | 'error';

export interface AppNotification {
  id: string;
  _id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  deepLink?: string;
  targetScreen?: string;
  metadata?: Record<string, unknown>;
}
