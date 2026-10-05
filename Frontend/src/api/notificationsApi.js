// src/api/notificationsApi.js
import { getAuthHeaders } from './client';

const API_BASE_URL = 'http://localhost:8082';

export async function getNotifications() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/notifications`, {
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) return [];
    const json = await res.json();
    const rawList = json.data || [];
    return rawList.map((n) => ({
      id: n.id,
      title: n.title,
      text: n.message || n.text || n.title,
      message: n.message || n.text,
      unread: !n.isRead && !n.read,
      isRead: n.isRead ?? n.read ?? false,
      time: n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
      createdAt: n.createdAt,
      type: n.type,
      route: n.referenceType === 'DOCUMENT' ? (n.referenceId ? `/user/documents/${n.referenceId}` : '/user/search') : '/user'
    }));
  } catch (err) {
    console.warn('Notifications service unreachable:', err?.message || err);
    return [];
  }
}

export async function getUnreadNotificationCount() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/notifications/unread-count`, {
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) return 0;
    const json = await res.json();
    return json.data || 0;
  } catch (err) {
    return 0;
  }
}

export async function markAsRead(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    return [];
  }
}

export async function markAllAsRead() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    return [];
  }
}