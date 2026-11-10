import { api } from './client.js';
import { sampleUsers } from './sampleData.js';

export async function getUserById(id) {
  try {
    const res = await api.get(`/users/${id}`);
    return res.data.data;
  } catch (err) {
    // If backend endpoint is not yet connected, fallback to matching sample data
    const numericId = Number(id);
    const fallback = sampleUsers.find((u) => u.id === numericId);
    if (fallback) {
      return fallback;
    }
    throw err;
  }
}

export async function getUsers(params = {}) {
  try {
    const res = await api.get('/users', { params });
    return res.data;
  } catch {
    return {
      data: sampleUsers,
      meta: { page: 1, limit: 12, total: sampleUsers.length, totalPages: 1 },
    };
  }
}
