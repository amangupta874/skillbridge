import { api } from './client.js';

export async function createExchange(body) {
  const response = await api.post('/exchanges', body);
  return response.data.data;
}

export async function getExchanges(filters = {}) {
  const response = await api.get('/exchanges', { params: filters });
  return { items: response.data.data, meta: response.data.meta };
}

export async function updateExchangeStatus(id, status) {
  const response = await api.patch(`/exchanges/${id}`, { status });
  return response.data.data;
}
