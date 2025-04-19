import { AxiosError } from 'axios';
import { IOU } from '../types/IOU';
import { createIOU as apiCreateIOU, getIOUs as apiGetIOUs, getIOU as apiGetIOU, payIOU as apiPayIOU, forgiveIOU as apiForgiveIOU } from './api';

interface CreateIOURequest {
    forAmount: number;
    '@parties': {
        issuer: {
            entity: {
                iss: string[];
                organization: string[];
            };
            access: {
                preferred_email: string[];
            };
        };
        payee: {
            entity: {
                iss: string[];
                organization: string[];
            };
            access: {
                preferred_email: string[];
            };
        };
    };
}

interface IOUResponse {
    '@id': string;
    '@actions': {
        pay?: string;
        getAmountOwed?: string;
    };
    '@parties': {
        issuer: {
            entity: {
                email: string[];
            };
            access: Record<string, never>;
        };
        payee: {
            entity: {
                email: string[];
            };
            access: Record<string, never>;
        };
    };
    '@state': string;
    forAmount: number;
}

interface IOUListResponse {
    items: IOUResponse[];
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

export const iouService = {
    createIOU: async (iou: CreateIOURequest) => {
        const response = await apiCreateIOU(iou);
        return response.data;
    },

    getMyIOUs: async () => {
        const response = await apiGetIOUs();
        return response.data.items;
    },

    getIOU: async (id: string) => {
        const response = await apiGetIOU(id);
        return response.data;
    },

    acceptIOU: async (id: string) => {
        const response = await apiPayIOU(id, { amount: 0 });
        return response.data;
    },

    rejectIOU: async (id: string) => {
        const response = await apiForgiveIOU(id);
        return response.data;
    }
};

export const createIOU = async (payeeEmail: string, amount: number): Promise<IOUResponse> => {
    try {
        const response = await apiCreateIOU({
            forAmount: amount,
            '@parties': {
                issuer: {
                    entity: {
                        email: [localStorage.getItem('userEmail') || '']
                    },
                    access: {}
                },
                payee: {
                    entity: {
                        email: [payeeEmail]
                    },
                    access: {}
                }
            }
        });

        if (response.status === 200) {
            return response.data;
        } else {
            throw new Error('Failed to create IOU');
        }
    } catch (error: any) {
        if (error.response) {
            switch (error.response.status) {
                case 400:
                    throw new Error('Invalid IOU request');
                case 401:
                    throw new Error('Unauthorized - Please log in again');
                case 500:
                    throw new Error('Server error - Please try again later');
                default:
                    throw new Error('Failed to create IOU');
            }
        }
        throw error;
    }
};

export const fetchUserIOUs = async (): Promise<IOUResponse[]> => {
    try {
        const response = await apiGetIOUs();
        return response.data.items;
    } catch (error: any) {
        if (error.response) {
            switch (error.response.status) {
                case 401:
                    throw new Error('Unauthorized - Please log in again');
                case 500:
                    throw new Error('Server error - Please try again later');
                default:
                    throw new Error('Failed to fetch IOUs');
            }
        }
        throw error;
    }
}; 