import { api } from './client.js';

export async function getProjectMatches(projectId, limit) {
  const response = await api.get(`/projects/${projectId}/matches`, { params: { limit } });
  return response.data.data;
}
