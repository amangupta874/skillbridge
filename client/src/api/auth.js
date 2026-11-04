import { api } from './client.js';

export async function getCurrentUser() {
  try {
    const res = await api.get('/auth/me');
    return res.data.data;
  } catch (error) {
    if (error.status === 401) {
      return null;
    }
    throw error;
  }
}

export async function login({ email, password }) {
  const res = await api.post('/auth/login', { email, password });
  return res.data.data;
}

export async function register({ fullName, email, password }) {
  const res = await api.post('/auth/register', { fullName, email, password });
  return res.data.data;
}

export async function logout() {
  await api.post('/auth/logout');
}

