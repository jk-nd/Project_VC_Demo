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
  SelectChangeEvent
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import iouService from '../../services/iouService';

const CreateIOU = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    to: '',
    amount: '',
    currency: 'USD'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await iouService.createIOU({
        to: formData.to,
        amount: Number(formData.amount),
        currency: formData.currency,
        from: '' // Will be set by backend based on token
      });
      navigate('/list');
    } catch (error) {
      console.error('Failed to create IOU:', error);
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

  return (
    <Box component={Paper} sx={{ p: 3, maxWidth: 500, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Create New IOU
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="To (Username)"
          name="to"
          value={formData.to}
          onChange={handleTextChange}
          margin="normal"
          required
          helperText="Enter the username (e.g., alice, bob, charlie)"
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
    </Box>
  );
};

export default CreateIOU; 