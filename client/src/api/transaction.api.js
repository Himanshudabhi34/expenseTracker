import { api, buildQuery } from './apiClient.js';

export const transactionApi = {
  list: (params = {}) => api.get(`/transactions${buildQuery(params)}`),
  get: (id) => api.get(`/transactions/${id}`),
  create: (payload) => api.post('/transactions', payload),
  update: (id, payload) => api.patch(`/transactions/${id}`, payload),
  remove: (id) => api.delete(`/transactions/${id}`),
};

export default transactionApi;
