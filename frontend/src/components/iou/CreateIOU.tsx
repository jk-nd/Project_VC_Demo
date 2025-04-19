import { useState } from 'react';
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
  Snackbar
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
  const [showError, setShowError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      // Add @tech.nd email suffix if not included
      const payeeEmail = formData.to.includes('@') 
        ? formData.to 
        : `${formData.to}@tech.nd`;
        
      await createIOU(
        payeeEmail,
        Number(formData.amount)
      );
      navigate('/list');
    } catch (error: any) {
      console.error('Failed to create IOU:', error);
      setError(error.message || 'Failed to create IOU');
      setShowError(true);
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
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="To (Username or Email)"
          name="to"
          value={formData.to}
          onChange={handleTextChange}
          margin="normal"
          required
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
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>Currency</InputLabel>
          <Select
            name="currency"
            value={formData.currency}
            onChange={handleSelectChange}
            label="Currency"
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
          >
            Create IOU
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