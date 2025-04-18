import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createIOU } from '../../services/api';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Grid,
} from '@mui/material';

export default function IOUCreate() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    amount: '',
    debtor: '',
    creditor: '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createIOU({
        ...formData,
        amount: parseFloat(formData.amount),
      });
      navigate('/ious');
    } catch (err) {
      setError('Failed to create IOU');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Create IOU
      </Typography>
      <Paper elevation={2} sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'grid', gap: 2 }}>
            <TextField
              fullWidth
              label="Amount"
              name="amount"
              type="number"
              value={formData.amount}
              onChange={handleChange}
              required
            />
            <TextField
              fullWidth
              label="Debtor"
              name="debtor"
              value={formData.debtor}
              onChange={handleChange}
              required
            />
            <TextField
              fullWidth
              label="Creditor"
              name="creditor"
              value={formData.creditor}
              onChange={handleChange}
              required
            />
            {error && (
              <Typography color="error">{error}</Typography>
            )}
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
      </Paper>
    </Box>
  );
} 