import api from './axios';

export const storesApi = {
  // Store CRUD — Super Admin only
  getAll: (params) => api.get('/stores', { params }),
  getById: (id) => api.get(`/stores/${id}`),
  create: (data) => api.post('/stores', data),
  update: (id, data) => api.put(`/stores/${id}`, data),
  delete: (id) => api.delete(`/stores/${id}`),

  // Store User Management — Super Admin OR Store Admin
  getStoreUsers: (storeId) => api.get(`/stores/${storeId}/users`),
  addUserToStore: (storeId, data) => api.post(`/stores/${storeId}/users`, data),
  removeUserFromStore: (storeId, userId) => api.delete(`/stores/${storeId}/users/${userId}`),
};