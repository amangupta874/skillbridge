import { api } from './client.js';

export async function getProjects(filters = {}) {
  const response = await api.get('/projects', { params: filters });
  return { items: response.data.data, meta: response.data.meta };
}

export async function getProject(id) {
  const response = await api.get(`/projects/${id}`);
  return response.data.data;
}

export async function createProject(body) {
  const response = await api.post('/projects', body);
  return response.data.data;
}

export async function updateProject(id, body) {
  const response = await api.patch(`/projects/${id}`, body);
  return response.data.data;
}
