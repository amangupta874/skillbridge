import { api } from './client.js';
import { sampleLookups } from './sampleData.js';

export async function getLookups() {
  try {
    const res = await api.get('/lookups');
    return res.data.data;
  } catch {
    return sampleLookups;
  }
}
