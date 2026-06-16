import api from './index';

export const getFormulations = async () => {
  return await api.get('/formulations');
};

export const getFormulation = async (id) => {
  return await api.get(`/formulations/${id}`);
};

export const createFormulation = async (data) => {
  return await api.post('/formulations', data);
};

export const updateFormulation = async (id, data) => {
  return await api.put(`/formulations/${id}`, data);
};

export const deleteFormulation = async (id) => {
  return await api.delete(`/formulations/${id}`);
};
