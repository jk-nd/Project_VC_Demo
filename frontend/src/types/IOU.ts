export interface IOU {
    id: string;
    issuer: string;
    recipient: string;
    amount: number;
    currency: string;
    description: string;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'PAID';
    createdAt: string;
    updatedAt: string;
} 