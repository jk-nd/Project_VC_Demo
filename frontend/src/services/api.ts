import axios from 'axios';
import keycloak from '../auth/keycloak';

const api = axios.create({
  baseURL: 'http://localhost/api',
});

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
  async (config) => {
    if (keycloak.token) {
      config.headers.Authorization = `Bearer ${keycloak.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const createIOU = async (data: any) => {
  return api.post('/iou', data);
};

export const getIOUs = async () => {
  return api.get('/iou');
};

export const getIOU = async (id: string) => {
  return api.get(`/iou/${id}`);
};

export default api; 