import axios from 'axios';
import keycloakInstance from '../auth/keycloak';

const api = axios.create({
  baseURL: '/api/npl/objects/iou',
  headers: {
    'accept': 'application/json'
  }
});

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
  async (config) => {
    const keycloak = keycloakInstance();
    if (keycloak.token) {
      config.headers.Authorization = `Bearer ${keycloak.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, try to refresh
      const keycloak = keycloakInstance();
      keycloak.updateToken(70).catch(() => {
        // If refresh fails, redirect to login
        keycloak.login();
      });
    }
    return Promise.reject(error);
  }
);

export const createIOU = async (data: any) => {
  return api.post('/Iou', data);
};

export const getIOUs = async () => {
  return api.get('/Iou', {
    params: {
      pageSize: 25,
      includeCount: false
    }
  });
};

export const getIOU = async (id: string) => {
  return api.get(`/Iou/${id}`);
};

export const payIOU = async (iouId: string, data: { amount: number }) => {
  const response = await api.post(`/Iou/${iouId}/pay`, data);
  return response.data;
};

export const forgiveIOU = async (iouId: string) => {
  const response = await api.post(`/Iou/${iouId}/forgive`);
  return response.data;
};

export default api; 