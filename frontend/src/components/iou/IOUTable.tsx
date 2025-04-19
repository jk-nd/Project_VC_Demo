import { useState, useEffect } from 'react';
import { 
    DataGrid, 
    GridColDef
} from '@mui/x-data-grid';
import { Box, Typography, Paper, Button, Stack } from '@mui/material';
import { IOU } from '../../types/IOU';
import { fetchUserIOUs, createIOU } from '../../services/iouService';

interface IOUResponse {
    '@id': string;
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

// Define generic parameter types for handlers that need them
type GridParams = {
    row?: any;
    value?: any;
};

const columns: GridColDef[] = [
    { 
        field: '@id', 
        headerName: 'ID', 
        width: 200,
        renderCell: (params) => {
            const id = params.row['@id'] || '';
            return <Typography>{id.substring(0, 8)}...</Typography>;
        }
    },
    { 
        field: 'issuerEmail', 
        headerName: 'Issuer', 
        width: 150,
        renderCell: (params) => {
            return <Typography>{params.row.issuerEmail || 'Unknown'}</Typography>;
        }
    },
    { 
        field: 'recipientEmail', 
        headerName: 'Recipient', 
        width: 150,
        renderCell: (params) => {
            return <Typography>{params.row.recipientEmail || 'Unknown'}</Typography>;
        }
    },
    {
        field: 'forAmount',
        headerName: 'Amount',
        type: 'number',
        width: 130,
        renderCell: (params) => {
            const amount = Number(params.row.forAmount) || 0;
            return (
                <Typography>
                    {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                    }).format(amount)}
                </Typography>
            );
        }
    },
    {
        field: '@state',
        headerName: 'Status',
        width: 130,
        renderCell: (params) => {
            const status = params.row['@state'] || 'unknown';
            const colorMap: Record<string, string> = {
                'unpaid': 'warning.main',
                'paid': 'success.main',
                'rejected': 'error.main',
                'accepted': 'info.main',
            };
            return (
                <Typography
                    sx={{
                        color: colorMap[status] || 'text.primary',
                    }}
                >
                    {status.toUpperCase()}
                </Typography>
            );
        },
    },
    {
        field: 'createdAt',
        headerName: 'Created',
        width: 180,
        renderCell: (params) => {
            try {
                const dateStr = params.row.createdAt;
                if (!dateStr) return <Typography>-</Typography>;
                
                const date = new Date(dateStr);
                return <Typography>{date.toLocaleString()}</Typography>;
            } catch (e) {
                return <Typography>-</Typography>;
            }
        }
    },
    {
        field: 'updatedAt',
        headerName: 'Last Updated',
        width: 180,
        renderCell: (params) => {
            try {
                const dateStr = params.row.updatedAt;
                if (!dateStr) return <Typography>-</Typography>;
                
                const date = new Date(dateStr);
                return <Typography>{date.toLocaleString()}</Typography>;
            } catch (e) {
                return <Typography>-</Typography>;
            }
        }
    },
    {
        field: 'actions',
        headerName: 'Actions',
        width: 150,
        sortable: false,
        filterable: false,
        renderCell: (params) => {
            const state = params.row['@state'];
            if (state === 'unpaid') {
                return (
                    <Button 
                        variant="contained" 
                        size="small"
                        color="primary"
                        onClick={() => console.log('Pay IOU:', params.row['@id'])}
                    >
                        Pay
                    </Button>
                );
            }
            return null;
        }
    }
];

export default function IOUTable() {
    const [ious, setIous] = useState<IOU[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showDebug, setShowDebug] = useState(false);
    const [rawData, setRawData] = useState<any>(null);

    const loadIOUs = async () => {
        try {
            setLoading(true);
            setError(null);
            
            console.log('IOUTable: Loading IOUs...');
            const data = await fetchUserIOUs();
            
            console.log('IOUTable: Received data from service:', 
                        JSON.stringify(data, null, 2));
            
            // Store raw data for debugging
            setRawData(data);
            
            if (Array.isArray(data) && data.length > 0) {
                // Debug first item to see structure
                const firstItem = data[0];
                console.log('First IOU details:',
                    '\n - ID:', firstItem['@id'],
                    '\n - Amount:', firstItem.forAmount,
                    '\n - Issuer:', firstItem.issuerEmail,
                    '\n - Recipient:', firstItem.recipientEmail,
                    '\n - Created:', firstItem.createdAt, 
                    '\n - Updated:', firstItem.updatedAt);
                
                // Make sure data is in the right format for the DataGrid
                setIous(data);
            } else {
                console.log('No IOUs found or data is not an array');
                setIous([]);
            }
        } catch (err) {
            console.error('Error loading IOUs:', err);
            setError(err instanceof Error ? err.message : 'Failed to load IOUs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadIOUs();
    }, []);

    const handleCreateIOU = async () => {
        try {
            const userEmail = localStorage.getItem('userEmail') || 'alice@tech.nd';
            
            // Generate a random amount between 50 and 1000
            const amount = Math.floor(Math.random() * 950) + 50;
            
            // Choose random recipient (bob or charlie)
            const recipients = ['bob@tech.nd', 'charlie@tech.nd', 'dave@tech.nd'];
            const recipient = recipients[Math.floor(Math.random() * recipients.length)];
            
            console.log(`Creating new IOU: ${userEmail} owes ${recipient} $${amount}`);
            
            const response = await createIOU(recipient, amount);
            console.log('Created IOU:', response);
            loadIOUs(); // Reload the table
        } catch (error) {
            console.error('Error creating IOU:', error);
            setError(error instanceof Error ? error.message : 'Failed to create IOU');
        }
    };

    if (error) {
        return (
            <Paper sx={{ p: 3, bgcolor: 'error.light' }}>
                <Typography color="error">Error: {error}</Typography>
            </Paper>
        );
    }

    return (
        <Box sx={{ width: '100%' }}>
            <Stack direction="row" justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
                <Button 
                    variant="outlined" 
                    color="info" 
                    onClick={() => setShowDebug(!showDebug)}
                >
                    {showDebug ? "Hide Debug" : "Show Debug"}
                </Button>
                
                <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={handleCreateIOU}
                >
                    Create New IOU
                </Button>
            </Stack>
            
            {showDebug && (
                <Paper sx={{ p: 2, mb: 2, overflow: 'auto', maxHeight: '300px' }}>
                    <Typography variant="h6" gutterBottom>Data Debug</Typography>
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle1">Raw Data Structure:</Typography>
                        {rawData && (
                            <Box component="pre" sx={{ fontSize: '0.75rem', overflow: 'auto' }}>
                                {JSON.stringify(rawData, null, 2)}
                            </Box>
                        )}
                    </Box>
                    <Box>
                        <Typography variant="subtitle1">IOU Table Props:</Typography>
                        <Box component="pre" sx={{ fontSize: '0.75rem' }}>
                            {`ious.length: ${ious.length}`}
                            {ious.length > 0 && `\nFirst IOU ID: ${ious[0]['@id']}`}
                            {ious.length > 0 && `\nFirst IOU Amount: ${ious[0].forAmount}`}
                        </Box>
                    </Box>
                </Paper>
            )}
            
            <DataGrid
                rows={ious}
                columns={columns}
                loading={loading}
                pageSizeOptions={[5, 10, 25, 100]}
                initialState={{
                    pagination: {
                        paginationModel: {
                            pageSize: 5,
                        },
                    },
                }}
                disableRowSelectionOnClick
                autoHeight
                getRowId={(row) => row['@id']}
            />
        </Box>
    );
}

// Helper function to map backend states to our IOU status types
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