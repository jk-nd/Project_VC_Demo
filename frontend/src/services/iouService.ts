import axios from 'axios';
import keycloakInstance from '../auth/keycloak';

const API_URL = 'http://localhost:12000';

const axiosInstance = axios.create({
  baseURL: API_URL,
});

// Add token to requests
axiosInstance.interceptors.request.use(
  (config) => {
    if (keycloakInstance.token) {
      config.headers.Authorization = `Bearer ${keycloakInstance.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export interface IOU {
  id?: string;
  from: string;
  to: string;
  amount: number;
  currency: string;
  status?: string;
}

export const iouService = {
  createIOU: async (iou: Omit<IOU, 'id' | 'status'>) => {
    const response = await axiosInstance.post('/api/iou', iou);
    return response.data;
  },

  getMyIOUs: async () => {
    const response = await axiosInstance.get('/api/iou/my');
    return response.data;
  },

  getIOU: async (id: string) => {
    const response = await axiosInstance.get(`/api/iou/${id}`);
    return response.data;
  },

  acceptIOU: async (id: string) => {
    const response = await axiosInstance.post(`/api/iou/${id}/accept`);
    return response.data;
  },

  rejectIOU: async (id: string) => {
    const response = await axiosInstance.post(`/api/iou/${id}/reject`);
    return response.data;
  }
};

export default iouService; 