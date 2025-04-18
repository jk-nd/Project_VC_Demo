import { AxiosError } from 'axios';
import { IOU } from '../types/IOU';
import api from './api';

interface CreateIOURequest {
    from: string;
    to: string;
    amount: number;
    currency: string;
}

interface IOUResponse {
    items: Array<{
        '@id': string;
        '@actions': {
            pay: string;
            getAmountOwed: string;
        };
        '@parties': {
            issuer: {
                entity: {
                    email: string[];
                };
                access: Record<string, any>;
            };
            payee: {
                entity: {
                    email: string[];
                };
                access: Record<string, any>;
            };
        };
        '@state': string;
        forAmount: number;
    }>;
    page: number;
}

// Map backend states to our IOU status types
const mapStateToStatus = (state: string): IOU['status'] => {
    switch (state.toLowerCase()) {
        case 'unpaid':
            return 'PENDING';
        case 'paid':
            return 'PAID';
        case 'accepted':
            return 'ACCEPTED';
        case 'rejected':
            return 'REJECTED';
        default:
            return 'PENDING';
    }
};

export async function fetchUserIOUs(): Promise<IOU[]> {
    try {
        const response = await api.get<IOUResponse>('/Iou/', {
            params: {
                pageSize: 25,
                includeCount: false
            }
        });
        
        // Transform the response to match our IOU type
        return response.data.items.map(item => ({
            id: item['@id'],
            issuer: item['@parties'].issuer.entity.email[0],
            recipient: item['@parties'].payee.entity.email[0],
            amount: item.forAmount,
            currency: 'USD', // Assuming USD as default
            description: `IOU from ${item['@parties'].issuer.entity.email[0]} to ${item['@parties'].payee.entity.email[0]}`,
            status: mapStateToStatus(item['@state']),
            createdAt: new Date().toISOString(), // These fields might need to be added to the response
            updatedAt: new Date().toISOString()
        }));
    } catch (error) {
        if (error instanceof AxiosError) {
            console.error('Error fetching IOUs:', {
                status: error.response?.status,
                data: error.response?.data,
                headers: error.response?.headers
            });
            
            if (error.response?.status === 401) {
                throw new Error('Authentication failed. Please log in again.');
            }
        }
        throw new Error('Failed to fetch IOUs');
    }
}

export const iouService = {
    createIOU: async (iou: CreateIOURequest) => {
        const response = await api.post('/Iou/', iou);
        return response.data;
    },

    getMyIOUs: async () => {
        const response = await api.get<IOUResponse>('/Iou/', {
            params: {
                pageSize: 25,
                includeCount: false
            }
        });
        return response.data.items;
    },

    getIOU: async (id: string) => {
        const response = await api.get(`/Iou/${id}`);
        return response.data;
    },

    acceptIOU: async (id: string) => {
        const response = await api.post(`/Iou/${id}/accept`);
        return response.data;
    },

    rejectIOU: async (id: string) => {
        const response = await api.post(`/Iou/${id}/reject`);
        return response.data;
    }
}; 