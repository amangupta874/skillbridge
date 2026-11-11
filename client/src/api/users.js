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

export async function updateProfile(data) {
  try {
    const res = await api.patch('/users/me', data);
    return res.data.data;
  } catch (err) {
    // Fallback updates sample user 1
    if (sampleUsers[0]) {
      Object.assign(sampleUsers[0], data);
      return sampleUsers[0];
    }
    throw err;
  }
}

export async function updateSkills(skills) {
  try {
    const res = await api.put('/users/me/skills', { skills });
    return res.data.data;
  } catch (err) {
    if (sampleUsers[0]) {
      sampleUsers[0].skills = skills;
      return sampleUsers[0];
    }
    throw err;
  }
}

export async function updateLearningGoals(skillIds) {
  try {
    const res = await api.put('/users/me/learning-goals', { skillIds });
    return res.data.data;
  } catch (err) {
    if (sampleUsers[0]) {
      sampleUsers[0].learningGoals = skillIds.map((id) => ({ id, name: `Skill ${id}` }));
      return sampleUsers[0];
    }
    throw err;
  }
}
