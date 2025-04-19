import { useState, useEffect } from 'react';
import { Box, TextField, Button, Alert, Autocomplete } from '@mui/material';
import { createIOU } from '../../services/iouService';
import { getUserSuggestions, User } from '../../services/userService';
import { useNavigate } from 'react-router-dom';

export default function CreateIOUForm({ onIOUCreated }: { onIOUCreated?: () => void }) {
    const navigate = useNavigate();
    const [payeeEmail, setPayeeEmail] = useState('');
    const [amount, setAmount] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [userOptions, setUserOptions] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch user suggestions when component mounts
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const users = await getUserSuggestions();
                setUserOptions(users);
            } catch (err) {
                console.error('Failed to fetch users:', err);
            }
        };
        
        fetchUsers();
    }, []);

    // Update user suggestions when search term changes
    useEffect(() => {
        const fetchFilteredUsers = async () => {
            if (searchTerm) {
                try {
                    const users = await getUserSuggestions(searchTerm);
                    setUserOptions(users);
                } catch (err) {
                    console.error('Failed to fetch filtered users:', err);
                }
            }
        };
        
        fetchFilteredUsers();
    }, [searchTerm]);

    // Effect to handle successful IOU creation
    useEffect(() => {
        if (success) {
            // After 1.5 seconds of showing success message, either:
            // 1. Call the callback function (if in a dialog)
            // 2. Navigate to overview (if standalone)
            const timer = setTimeout(() => {
                if (onIOUCreated) {
                    onIOUCreated();
                } else {
                    navigate('/');
                }
            }, 1500);
            
            return () => clearTimeout(timer);
        }
    }, [success, onIOUCreated, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        try {
            if (!payeeEmail || !amount) {
                setError('Please fill in all fields');
                setIsLoading(false);
                return;
            }

            const amountNumber = parseFloat(amount);
            if (isNaN(amountNumber) || amountNumber <= 0) {
                setError('Please enter a valid amount');
                setIsLoading(false);
                return;
            }

            await createIOU(payeeEmail, amountNumber);
            setSuccess('IOU created successfully!');
            
            // Reset form values
            setPayeeEmail('');
            setAmount('');
            setSearchTerm('');
            
            // Refresh the IOU list if callback provided
            if (onIOUCreated) {
                // Will be called after timeout in useEffect
            }
        } catch (err: any) {
            setError(err.message || 'Failed to create IOU');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUserChange = (
        _: React.SyntheticEvent, 
        value: string | User | null
    ) => {
        if (value && typeof value !== 'string' && 'email' in value) {
            setPayeeEmail(value.email);
        } else if (typeof value === 'string') {
            setPayeeEmail(value);
        } else {
            setPayeeEmail('');
        }
    };

    const handleInputChange = (
        _: React.SyntheticEvent, 
        value: string
    ) => {
        setSearchTerm(value);
        // If it's a valid email, set it directly
        if (value.includes('@')) {
            setPayeeEmail(value);
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
            <Autocomplete
                options={userOptions}
                getOptionLabel={(option) => {
                    if (typeof option === 'string') return option;
                    return `${option.username} (${option.email})`;
                }}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Payee"
                        required
                        fullWidth
                    />
                )}
                value={userOptions.find(user => user.email === payeeEmail) || null}
                onChange={handleUserChange}
                onInputChange={handleInputChange}
                isOptionEqualToValue={(option, value) => {
                    if (typeof value === 'string') return option.email === value;
                    return option.email === value.email;
                }}
                freeSolo
                filterOptions={(x) => x} // Disable internal filtering as we do server-side filtering
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
                disabled={isLoading}
            >
                {isLoading ? 'Creating...' : 'Create IOU'}
            </Button>
        </Box>
    );
} 