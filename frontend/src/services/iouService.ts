import { AxiosError } from 'axios';
import { IOU } from '../types/IOU';
import { createIOU as apiCreateIOU, getIOUs as apiGetIOUs, getIOU as apiGetIOU, payIOU as apiPayIOU, forgiveIOU as apiForgiveIOU } from './api';
import { useAuth } from '../auth/KeycloakContext';
import api from './api';
import { validateUserEmail } from './userService';

interface CreateIOURequest {
    forAmount: number;
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
        const ious = await apiGetIOUs();
        return ious;
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

export const createIOU = async (payeeEmail: string, amount: number): Promise<IOU> => {
    try {
        console.log('Creating IOU with:', { payeeEmail, amount });
        
        // Get the current user's email from the token
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Not authenticated');
        }
        
        // Parse the token to get user info
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        const userEmail = tokenData.email;
        
        if (!userEmail) {
            throw new Error('User email not found in token');
        }

        // Validate that payee is not the issuer
        if (payeeEmail.toLowerCase() === userEmail.toLowerCase()) {
            throw new Error('You cannot create an IOU to yourself');
        }

        // Validate that payee exists in the system
        const payeeExists = await validateUserEmail(payeeEmail);
        if (!payeeExists) {
            throw new Error('The specified payee is not registered in the system');
        }
        
        const requestData = {
            forAmount: amount,
            '@parties': {
                issuer: {
                    entity: {
                        email: [userEmail]
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
        };
        
        console.log('IOU request data:', requestData);
        const response = await apiCreateIOU(requestData);
        console.log('CreateIOU API Response:', response);
        
        // Return a properly formatted IOU object
        return {
            '@id': response.data['@id'],
            '@actions': response.data['@actions'] || {},
            '@parties': response.data['@parties'],
            '@state': response.data['@state'],
            forAmount: response.data.forAmount,
            status: mapStateToStatus(response.data['@state']),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            issuerEmail: userEmail,
            recipientEmail: payeeEmail
        };
    } catch (error: any) {
        console.error('CreateIOU Error:', error);
        if (error.response) {
            console.error('Error Response:', error.response);
            throw new Error(error.response.data?.message || 'Failed to create IOU');
        }
        throw error;
    }
};

export const fetchUserIOUs = async (): Promise<IOU[]> => {
    try {
        console.log('fetchUserIOUs: Starting API call');
        const response = await apiGetIOUs();
        console.log('fetchUserIOUs: Raw API response:', response);
        
        // Transform the raw data into the expected IOU format
        if (!Array.isArray(response)) {
            console.error('fetchUserIOUs: Expected array response but got:', response);
            return [];
        }
        
        const transformedData: IOU[] = response.map((item: any) => {
            // Debug each item as we process it
            console.log('Processing IOU item:', JSON.stringify(item, null, 2));
            
            // Extract emails for easier display
            const issuerEmail = item['@parties']?.issuer?.entity?.email?.[0] || 'Unknown';
            const recipientEmail = item['@parties']?.payee?.entity?.email?.[0] || 'Unknown';
            
            // Ensure amount is a number
            const amount = typeof item.forAmount === 'number' 
                ? item.forAmount 
                : Number(item.forAmount) || 0;
            
            console.log(`Item ${item['@id']}: issuer=${issuerEmail}, recipient=${recipientEmail}, amount=${amount}`);
            
            // Use current date if missing dates
            const now = new Date().toISOString();
            
            // Build the transformed object
            const transformedItem: IOU = {
                '@id': item['@id'],
                '@actions': item['@actions'] || {},
                '@parties': item['@parties'] || {
                    issuer: { entity: { email: ['unknown'] }, access: {} },
                    payee: { entity: { email: ['unknown'] }, access: {} }
                },
                '@state': item['@state'] || 'unknown',
                forAmount: amount,
                status: mapStateToStatus(item['@state'] || 'unknown'),
                createdAt: now,
                updatedAt: now,
                issuerEmail: issuerEmail,
                recipientEmail: recipientEmail
            };
            
            console.log('Transformed item:', JSON.stringify(transformedItem, null, 2));
            return transformedItem;
        });
        
        console.log('Transformed all IOUs, count:', transformedData.length);
        return transformedData;
    } catch (error: any) {
        console.error('fetchUserIOUs Error:', error);
        if (error.response) {
            console.error('Error Response:', error.response);
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

export const payIOU = async (iouId: string, amount: number): Promise<IOU> => {
    try {
        console.log('Paying IOU:', { iouId, amount });
        
        const response = await api.post(`/backend/npl/objects/iou/Iou/${iouId}/pay`, {
            amount: amount
        });
        
        console.log('Pay IOU Response:', response);
        
        try {
            // Return the updated IOU
            return await getIOU(iouId);
        } catch (getError) {
            console.warn('Could not fetch updated IOU after payment, returning partial data:', getError);
            // Return a partial IOU with the data we have
            return {
                '@id': iouId,
                '@actions': {},
                '@parties': {
                    issuer: { entity: { email: [''] }, access: {} },
                    payee: { entity: { email: [''] }, access: {} }
                },
                '@state': 'paid', // Assume payment succeeded
                forAmount: amount,
                status: 'PAID',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                issuerEmail: '',
                recipientEmail: ''
            };
        }
    } catch (error: any) {
        console.error('Pay IOU Error:', error);
        if (error.response) {
            console.error('Error Response:', error.response);
            throw new Error(error.response.data?.message || 'Failed to pay IOU');
        }
        throw error;
    }
};

export const getIOU = async (iouId: string): Promise<IOU> => {
    try {
        const response = await api.get(`/backend/npl/objects/iou/Iou/${iouId}`);
        const data = response.data;
        
        // Extract issuer and payee emails
        const issuerEmail = data['@parties']?.issuer?.entity?.email?.[0] || '';
        const payeeEmail = data['@parties']?.payee?.entity?.email?.[0] || '';
        
        // Map the response to our IOU type
        return {
            '@id': data['@id'],
            '@actions': data['@actions'] || {},
            '@parties': data['@parties'],
            '@state': data['@state'],
            forAmount: data.forAmount,
            status: mapStateToStatus(data['@state']),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            issuerEmail,
            recipientEmail: payeeEmail
        };
    } catch (error: any) {
        console.error('Get IOU Error:', error);
        throw new Error(error.response?.data?.message || 'Failed to get IOU details');
    }
}; 