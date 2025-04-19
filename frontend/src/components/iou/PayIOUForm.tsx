import React, { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField, 
  Typography, 
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import { IOU } from '../../types/IOU';
import { payIOU } from '../../services/iouService';

interface PayIOUFormProps {
  iou: IOU;
  open: boolean;
  onClose: () => void;
}

const PayIOUForm: React.FC<PayIOUFormProps> = ({ iou, open, onClose }) => {
  const [amount, setAmount] = useState<string>(iou.forAmount.toString());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const amountNum = parseFloat(amount);
      
      if (isNaN(amountNum)) {
        throw new Error('Please enter a valid amount');
      }

      if (amountNum <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      if (amountNum > iou.forAmount) {
        throw new Error(`Amount cannot exceed the total owed: $${iou.forAmount.toFixed(2)}`);
      }

      await payIOU(iou['@id'], amountNum);
      setSuccess(true);
      
      // Close the dialog after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (err: any) {
      console.error('Error paying IOU:', err);
      setError(err.message || 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Pay IOU</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" gutterBottom>
            <strong>Recipient:</strong> {iou.recipientEmail}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>Total Amount:</strong> ${iou.forAmount.toFixed(2)} USD
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>Status:</strong> {iou.status}
          </Typography>
        </Box>

        {success ? (
          <Alert severity="success">Payment processed successfully!</Alert>
        ) : (
          <form onSubmit={handleSubmit}>
            <TextField
              label="Payment Amount"
              type="number"
              value={amount}
              onChange={handleAmountChange}
              fullWidth
              required
              InputProps={{
                startAdornment: <Box component="span" sx={{ mr: 1 }}>$</Box>,
                endAdornment: <Box component="span" sx={{ ml: 1 }}>USD</Box>
              }}
              sx={{ mb: 2 }}
              disabled={loading}
            />
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          </form>
        )}
      </DialogContent>
      <DialogActions>
        {!success && (
          <>
            <Button onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleSubmit}
              disabled={loading || success}
            >
              {loading ? <CircularProgress size={24} /> : 'Pay'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default PayIOUForm; 