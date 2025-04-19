import { useState } from 'react';
import { Box, TextField, Button, Typography, Alert } from '@mui/material';
import { createIOU } from '../../services/iouService';

export default function CreateIOUForm({ onIOUCreated }: { onIOUCreated?: () => void }) {
    const [payeeEmail, setPayeeEmail] = useState('');
    const [amount, setAmount] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        try {
            if (!payeeEmail || !amount) {
                setError('Please fill in all fields');
                return;
            }

            const amountNumber = parseFloat(amount);
            if (isNaN(amountNumber) || amountNumber <= 0) {
                setError('Please enter a valid amount');
                return;
            }

            await createIOU(payeeEmail, amountNumber);
            setSuccess('IOU created successfully!');
            setPayeeEmail('');
            setAmount('');
            // Refresh the IOU list
            if (onIOUCreated) {
                onIOUCreated();
            }
        } catch (err: any) {
            setError(err.message || 'Failed to create IOU');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}
            {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {success}
                </Alert>
            )}
            <TextField
                label="Payee Email"
                value={payeeEmail}
                onChange={(e) => setPayeeEmail(e.target.value)}
                fullWidth
                required
                type="email"
            />
            <TextField
                label="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                fullWidth
                required
                type="number"
                inputProps={{ min: "0", step: "0.01" }}
            />
            <Button 
                type="submit" 
                variant="contained" 
                color="primary"
                sx={{ mt: 2 }}
            >
                Create IOU
            </Button>
        </Box>
    );
} 