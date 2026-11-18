import { api } from './client.js';

export async function getNotifications(filters = {}) {
  const response = await api.get('/notifications', { params: filters });
  return { items: response.data.data, meta: response.data.meta };
}

export async function getUnreadCount() {
  const response = await api.get('/notifications/unread-count');
  return response.data.data;
}

export async function markNotificationRead(id) {
  const response = await api.patch(`/notifications/${id}/read`);
  return response.data.data;
}

export async function markAllNotificationsRead() {
  const response = await api.patch('/notifications/read-all');
  return response.data.data;
}
