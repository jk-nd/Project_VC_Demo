export interface IOU {
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
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'PAID';
    createdAt: string;
    updatedAt: string;
    
    // Derived fields for DataGrid
    issuerEmail: string;
    recipientEmail: string;
} 