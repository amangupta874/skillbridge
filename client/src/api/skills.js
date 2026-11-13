import { api } from './client.js';

export async function getSkills(params = {}) {
  const response = await api.get('/skills', { params });
  return response.data.data;
}
