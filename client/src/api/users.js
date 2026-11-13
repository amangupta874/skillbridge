import { api } from './client.js';

export async function getUserById(id) {
  const response = await api.get(`/users/${id}`);
  return response.data.data;
}

export async function getUsers(params = {}) {
  const response = await api.get('/users', { params });
  return response.data;
}

export async function updateProfile(data) {
  const response = await api.patch('/users/me', data);
  return response.data.data;
}

export async function updateSkills(skills) {
  const response = await api.put('/users/me/skills', { skills });
  return response.data.data;
}

export async function updateLearningGoals(skillIds) {
  const response = await api.put('/users/me/learning-goals', { skillIds });
  return response.data.data;
}
