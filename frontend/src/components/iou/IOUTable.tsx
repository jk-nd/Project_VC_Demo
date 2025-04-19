import { useState, useEffect } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Box, Typography, Paper } from '@mui/material';
import { IOU } from '../../types/IOU';
import { fetchUserIOUs } from '../../services/iouService';

const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 130 },
    { field: 'issuer', headerName: 'Issuer', width: 130 },
    { field: 'recipient', headerName: 'Recipient', width: 130 },
    {
        field: 'amount',
        headerName: 'Amount',
        type: 'number',
        width: 130,
        renderCell: (params) => (
            <Typography>
                {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: params.row.currency,
                }).format(params.row.amount)}
            </Typography>
        ),
    },
    { field: 'description', headerName: 'Description', width: 200 },
    {
        field: 'status',
        headerName: 'Status',
        width: 130,
        renderCell: (params) => (
            <Typography
                sx={{
                    color: {
                        'PENDING': 'warning.main',
                        'ACCEPTED': 'success.main',
                        'REJECTED': 'error.main',
                        'PAID': 'info.main',
                    }[params.row.status],
                }}
            >
                {params.row.status}
            </Typography>
        ),
    },
    {
        field: 'createdAt',
        headerName: 'Created',
        width: 180,
        valueFormatter: (params) => new Date(params.value).toLocaleString(),
    },
    {
        field: 'updatedAt',
        headerName: 'Last Updated',
        width: 180,
        valueFormatter: (params) => new Date(params.value).toLocaleString(),
    },
];

export default function IOUTable() {
    const [ious, setIous] = useState<IOU[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadIOUs = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await fetchUserIOUs();
                // Transform the data to match what DataGrid expects
                const transformedData = data.map(iou => ({
                    id: iou['@id'],
                    issuer: iou['@parties'].issuer.entity.email[0],
                    recipient: iou['@parties'].payee.entity.email[0],
                    amount: iou.forAmount,
                    currency: 'USD',
                    description: `IOU from ${iou['@parties'].issuer.entity.email[0]} to ${iou['@parties'].payee.entity.email[0]}`,
                    status: mapStateToStatus(iou['@state']),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }));
                setIous(transformedData);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load IOUs');
            } finally {
                setLoading(false);
            }
        };

        loadIOUs();
    }, []);

    if (error) {
        return (
            <Paper sx={{ p: 3, bgcolor: 'error.light' }}>
                <Typography color="error">Error: {error}</Typography>
            </Paper>
        );
    }

    return (
        <Box sx={{ width: '100%', height: 400 }}>
            <DataGrid
                rows={ious}
                columns={columns}
                loading={loading}
                pageSizeOptions={[5, 10, 25]}
                disableRowSelectionOnClick
                autoHeight
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