export type NotificationType = 'info' | 'warning' | 'success' | 'error';

export interface AppNotification {
  _id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}
