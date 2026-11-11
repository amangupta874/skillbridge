import { api } from './client.js';
import { sampleSkills } from './sampleData.js';

export async function getSkills(params = {}) {
  try {
    const res = await api.get('/skills', { params });
    return res.data.data;
  } catch {
    const query = (params.query || '').trim().toLowerCase();
    const categoryId = params.categoryId ? Number(params.categoryId) : null;

    let filtered = sampleSkills;
    if (query) {
      filtered = filtered.filter((s) => s.name.toLowerCase().includes(query));
    }
    if (categoryId) {
      filtered = filtered.filter((s) => s.category?.id === categoryId);
    }
    return filtered;
  }
}

