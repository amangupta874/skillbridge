import { api } from './client.js';

export async function applyToProject(projectId, message) {
  const response = await api.post(`/projects/${projectId}/applications`, { message });
  return response.data.data;
}

export async function getProjectApplications(projectId, filters = {}) {
  const response = await api.get(`/projects/${projectId}/applications`, { params: filters });
  return { items: response.data.data, meta: response.data.meta };
}

export async function getMyApplications(filters = {}) {
  const response = await api.get('/users/me/applications', { params: filters });
  return { items: response.data.data, meta: response.data.meta };
}

export async function updateApplicationStatus(id, status) {
  const response = await api.patch(`/applications/${id}`, { status });
  return response.data.data;
}
