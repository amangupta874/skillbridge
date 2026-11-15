import { api } from './client.js';

export async function getProjects(filters = {}) {
  const response = await api.get('/projects', { params: filters });
  return { items: response.data.data, meta: response.data.meta };
}

export async function getProject(id) {
  const response = await api.get(`/projects/${id}`);
  return response.data.data;
}
