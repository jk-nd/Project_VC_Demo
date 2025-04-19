import axios from 'axios';
import { IOU } from '../types/IOU';

const api = axios.create({
  baseURL: '',  // Use relative paths since Vite will proxy the requests
  headers: {
    'accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
      // Token expired or invalid, redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// NPL Protocol API methods
export const createIOU = async (data: any) => {
  return api.post('/backend/npl/objects/iou/Iou/', data);
};

export const getIOUs = async (): Promise<any[]> => {
  try {
    console.log('API getIOUs called');
    const response = await api.get('/backend/npl/objects/iou/Iou/', {
      params: {
        pageSize: 25,
        includeCount: false
      }
    });
    
    console.log('API getIOUs raw response:', response);
    
    // Check if we have items property (collection response) or direct array
    let items = [];
    if (response.data && response.data.items) {
      items = response.data.items || [];
    } else if (Array.isArray(response.data)) {
      items = response.data;
    } else {
      console.warn('Unexpected response format from getIOUs:', response.data);
    }
    
    console.log('API getIOUs processed items:', items);
    return items;
  } catch (error) {
    console.error('Error in API getIOUs:', error);
    return [];
  }
};

export const getIOU = async (id: string) => {
  return api.get(`/backend/npl/objects/iou/Iou/${id}/`);
};

export const payIOU = async (iouId: string, data: { amount: number }) => {
  const response = await api.post(`/backend/npl/objects/iou/Iou/${iouId}/pay`, data);
  return response.data;
};

export const forgiveIOU = async (iouId: string) => {
  const response = await api.post(`/backend/npl/objects/iou/Iou/${iouId}/forgive`);
  return response.data;
};

// Engine API methods
export const getProtocols = async () => {
  return api.get('/backend/api/engine/protocols/');
};

export const getStreams = async () => {
  return api.get('/backend/api/streams');
};

export const getArchivedStates = async () => {
  return api.get('/backend/api/streams/current-archived-states');
};

export const getCommands = async () => {
  return api.get('/backend/api/streams/current-commands');
};

export default api; 