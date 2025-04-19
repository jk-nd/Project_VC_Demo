import { useState, useEffect } from 'react';
import { 
  Paper, 
  TextField, 
  Button, 
  Box, 
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { createIOU } from '../../services/iouService';

const CreateIOU = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    to: '',
    amount: '',
    currency: 'USD'
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Effect to handle successful creation
  useEffect(() => {
    if (success) {
      // After 1.5 seconds, navigate to overview
      const timer = setTimeout(() => {
        navigate('/');
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    
    try {
      // Add @tech.nd email suffix if not included
      const payeeEmail = formData.to.includes('@') 
        ? formData.to 
        : `${formData.to}@tech.nd`;
        
      await createIOU(
        payeeEmail,
        Number(formData.amount)
      );
      
      // Show success message
      setSuccess('IOU created successfully! Redirecting to overview...');
      
      // Reset form
      setFormData({
        to: '',
        amount: '',
        currency: 'USD'
      });
      
      // Navigate will happen via the useEffect
    } catch (error: any) {
      console.error('Failed to create IOU:', error);
      setError(error.message || 'Failed to create IOU');
      setShowError(true);
      setIsLoading(false);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name as string]: value
    }));
  };

  const handleCloseError = () => {
    setShowError(false);
  };

  return (
    <Box component={Paper} sx={{ p: 3, maxWidth: 500, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Create New IOU
      </Typography>
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
      
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="To (Username or Email)"
          name="to"
          value={formData.to}
          onChange={handleTextChange}
          margin="normal"
          required
          disabled={isLoading || !!success}
          helperText="Enter username (e.g., alice) or full email"
        />
        <TextField
          fullWidth
          label="Amount"
          name="amount"
          type="number"
          value={formData.amount}
          onChange={handleTextChange}
          margin="normal"
          required
          disabled={isLoading || !!success}
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>Currency</InputLabel>
          <Select
            name="currency"
            value={formData.currency}
            onChange={handleSelectChange}
            label="Currency"
            disabled={isLoading || !!success}
          >
            <MenuItem value="USD">USD</MenuItem>
            <MenuItem value="EUR">EUR</MenuItem>
            <MenuItem value="GBP">GBP</MenuItem>
          </Select>
        </FormControl>
        <Box sx={{ mt: 2 }}>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            fullWidth
            disabled={isLoading || !!success}
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isLoading ? 'Creating...' : 'Create IOU'}
          </Button>
        </Box>
      </form>
      
      <Snackbar open={showError} autoHideDuration={6000} onClose={handleCloseError}>
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CreateIOU; 