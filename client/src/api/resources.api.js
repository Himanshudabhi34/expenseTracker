import { api, buildQuery } from './apiClient.js';

export const dashboardApi = {
  summary: (period = 'month') => api.get(`/dashboard/summary${buildQuery({ period })}`),
  suggestions: () => api.get('/dashboard/suggestions'),
};

export const budgetApi = {
  list: () => api.get('/budgets'),
  history: (months = 6) => api.get(`/budgets/history${buildQuery({ months })}`),
  create: (payload) => api.post('/budgets', payload),
  update: (id, payload) => api.patch(`/budgets/${id}`, payload),
  remove: (id) => api.delete(`/budgets/${id}`),
};

export const reportApi = {
  spending: (params = {}) => api.get(`/reports/spending${buildQuery(params)}`),
  suggestions: () => api.get('/reports/suggestions'),
  exportUrl: (params = {}) => `${api.baseUrl || ''}/reports/export.csv${buildQuery(params)}`,
  exportCsv: (params = {}) => api.raw(`/reports/export.csv${buildQuery(params)}`),
};

export const categoryApi = {
  list: (type) => api.get(`/categories${buildQuery({ type })}`),
  create: (payload) => api.post('/categories', payload),
};

export const goalApi = {
  list: () => api.get('/goals'),
  create: (payload) => api.post('/goals', payload),
  update: (id, payload) => api.patch(`/goals/${id}`, payload),
  remove: (id) => api.delete(`/goals/${id}`),
};

export const agentApi = {
  send: (payload) => api.post('/agent/message', payload),
};

export const notificationApi = {
  list: (params = {}) => api.get(`/notifications${buildQuery(params)}`),
  unreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
  remove: (id) => api.delete(`/notifications/${id}`),
  clearAll: () => api.delete('/notifications'),
};

export default {
  dashboardApi,
  budgetApi,
  reportApi,
  categoryApi,
  goalApi,
  agentApi,
  notificationApi,
};
