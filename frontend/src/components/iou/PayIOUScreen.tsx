import React, { useEffect, useState } from 'react';
import { Box, Button, Typography, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, TextField } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../auth/KeycloakContext';

// Define the structure of an IOU as it comes from the API
interface IOUResponse {
  '@id': string;
  '@actions': string[] | { [key: string]: string };
  '@parties': {
    issuer: {
      entity: { email: string[] };
      access: any;
    };
    payee: {
      entity: { email: string[] };
      access: any;
    };
  };
  forAmount: number;
  '@state'?: string;
}

// Define parameter type for grid handlers
type GridParams = {
  row: IOUResponse;
  value?: any;
};

const PayIOUScreen: React.FC = () => {
  const { tokenParsed, getToken } = useAuth();
  const [ious, setIous] = useState<IOUResponse[]>([]);
  const [transformedIous, setTransformedIous] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIou, setSelectedIou] = useState<IOUResponse | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [debugData, setDebugData] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>('');

  useEffect(() => {
    fetchIous();
  }, []);

  const fetchIous = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get the current user's email
      const currentUserEmail = tokenParsed?.email;
      console.log('Current user email:', currentUserEmail);
      
      if (!currentUserEmail) {
        setError('User information not available');
        setLoading(false);
        return;
      }

      // Get a fresh token
      const token = await getToken();
      console.log('Fetching IOUs where current user is the issuer...');
      
      // Fetch all IOUs
      const response = await api.get('/npl/objects/iou/Iou/', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          pageSize: 100,
          includeCount: true
        }
      });
      
      console.log('API response:', response.data);
      
      // Add more detailed logging about the structure
      if (response.data) {
        console.log('Response data type:', typeof response.data);
        if (Array.isArray(response.data)) {
          console.log('Data is an array with length:', response.data.length);
        } else if (typeof response.data === 'object') {
          console.log('Data is an object with keys:', Object.keys(response.data));
          if (response.data.items) {
            console.log('Items array length:', response.data.items.length);
            if (response.data.items.length > 0) {
              console.log('First item structure:', Object.keys(response.data.items[0]));
              console.log('First item parties:', response.data.items[0]['@parties']);
              console.log('First item actions:', response.data.items[0]['@actions']);
            }
          }
        }
      }
      
      setDebugData(response.data);
      
      let iouList: IOUResponse[] = [];
      
      // Process the response data
      if (Array.isArray(response.data)) {
        // Filter IOUs where the current user is the issuer and the state is unpaid
        iouList = response.data.filter((iou: IOUResponse) => 
          iou['@parties']?.issuer?.entity?.email?.includes(currentUserEmail) && 
          (iou['@state'] === 'unpaid' || !iou['@state']) &&
          (Array.isArray(iou['@actions']) ? 
            iou['@actions'].includes('pay') : 
            iou['@actions'] && 'pay' in iou['@actions'])
        );
      } else if (response.data && typeof response.data === 'object') {
        if (Array.isArray(response.data.items)) {
          // Filter IOUs from items array
          iouList = response.data.items.filter((iou: IOUResponse) => 
            iou['@parties']?.issuer?.entity?.email?.includes(currentUserEmail) && 
            (iou['@state'] === 'unpaid' || !iou['@state']) &&
            (Array.isArray(iou['@actions']) ? 
              iou['@actions'].includes('pay') : 
              iou['@actions'] && 'pay' in iou['@actions'])
          );
        } else if (Array.isArray(response.data.content)) {
          // Filter IOUs from content array
          iouList = response.data.content.filter((iou: IOUResponse) => 
            iou['@parties']?.issuer?.entity?.email?.includes(currentUserEmail) && 
            (iou['@state'] === 'unpaid' || !iou['@state']) &&
            (Array.isArray(iou['@actions']) ? 
              iou['@actions'].includes('pay') : 
              iou['@actions'] && 'pay' in iou['@actions'])
          );
        }
      }
      
      console.log('Filtered IOUs where user is issuer:', iouList);
      
      // Create a transformed version of the data that's more compatible with DataGrid
      const transformedIouPromises = iouList.map(async (iou) => {
        console.log(`Transforming IOU ${iou['@id']} with forAmount:`, iou.forAmount);
        
        // Get a fresh token for all API calls
        const token = await getToken();
        
        // Parse forAmount to ensure it's a number
        let amount = 0;
        if (iou.forAmount !== undefined && iou.forAmount !== null) {
          // Try to parse as number if it's a string
          if (typeof iou.forAmount === 'string') {
            amount = parseFloat(iou.forAmount);
          } else {
            amount = iou.forAmount;
          }
          // Check if it's a valid number
          if (isNaN(amount)) {
            amount = 0;
            console.warn(`Invalid forAmount for IOU ${iou['@id']}:`, iou.forAmount);
          }
        }
        
        // Try to get the amount owed from the API
        let amountOwed = amount;
        try {
          if (typeof iou['@actions'] === 'object' && 'getAmountOwed' in iou['@actions']) {
            const getAmountOwedUrl = (iou['@actions'] as { [key: string]: string })['getAmountOwed'];
            if (getAmountOwedUrl) {
              console.log(`Fetching amount owed for IOU ${iou['@id']} from: ${getAmountOwedUrl}`);
              // Extract path if it's a full URL
              let amountOwedPath = getAmountOwedUrl;
              if (getAmountOwedUrl.startsWith('http')) {
                try {
                  const urlObj = new URL(getAmountOwedUrl);
                  amountOwedPath = urlObj.pathname;
                } catch (e) {
                  console.error('Failed to parse URL, using as-is:', getAmountOwedUrl);
                }
              }
              
              try {
                // Try POST request first
                const amountOwedResponse = await api.post(amountOwedPath, {}, {
                  headers: {
                    Authorization: `Bearer ${token}`
                  }
                });
                console.log(`Amount owed response for ${iou['@id']}:`, amountOwedResponse.data);
                
                if (typeof amountOwedResponse.data === 'number') {
                  amountOwed = amountOwedResponse.data;
                }
              } catch (error: any) {
                console.error(`Error fetching amount owed for IOU ${iou['@id']}:`, error);
                if (error.response && error.response.status === 405) {
                  console.log('Received Method Not Allowed error, trying GET request instead');
                  try {
                    const getResponse = await api.get(amountOwedPath, {
                      headers: {
                        Authorization: `Bearer ${token}`
                      }
                    });
                    console.log(`GET Amount owed response for ${iou['@id']}:`, getResponse.data);
                    
                    if (typeof getResponse.data === 'number') {
                      amountOwed = getResponse.data;
                    }
                  } catch (getError) {
                    console.error(`GET request for amount owed also failed for IOU ${iou['@id']}:`, getError);
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error(`Error processing IOU ${iou['@id']}:`, error);
        }
        
        // Log the created object for debugging
        const transformedObj = {
          id: iou['@id'],
          protocolId: iou['@id'],
          originalIou: iou,
          issuer: iou['@parties']?.issuer?.entity?.email?.[0] || 'Unknown',
          payee: iou['@parties']?.payee?.entity?.email?.[0] || 'Unknown',
          forAmount: amount,
          amount: amount,
          amountOwed: amountOwed,
          state: iou['@state'] || 'unpaid'
        };
        
        console.log('Created transformed object:', transformedObj);
        return transformedObj;
      });
      
      // Wait for all the amountOwed API calls to complete
      const transformed = await Promise.all(transformedIouPromises);
      
      console.log('Transformed IOUs for DataGrid:', transformed);
      
      setIous(iouList);
      setTransformedIous(transformed);
      
      if (iouList.length === 0) {
        console.log('No IOUs found where user is the issuer');
      }
    } catch (err: any) {
      console.error('Error fetching IOUs:', err);
      setError(err.message || 'Failed to load IOUs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayClick = (iou: any) => {
    // If we get passed a transformed object, extract the original IOU
    const originalIou = iou.originalIou || iou;
    setSelectedIou(originalIou);
    
    // Initialize payment amount with full amount owed
    if (iou.amountOwed) {
      setPaymentAmount(iou.amountOwed.toString());
    } else if (originalIou.forAmount) {
      setPaymentAmount(originalIou.forAmount.toString());
    } else {
      setPaymentAmount('');
    }
    
    setPaymentDialogOpen(true);
    setPaymentError(null);
  };

  const handleClosePaymentDialog = () => {
    setPaymentDialogOpen(false);
    setSelectedIou(null);
    setPaymentAmount('');
  };

  const handlePaymentAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numeric input with one decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setPaymentAmount(value);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!selectedIou) return;
    
    // Validate payment amount
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      setPaymentError('Please enter a valid amount greater than 0');
      return;
    }
    
    setProcessingPayment(true);
    setPaymentError(null);
    
    try {
      // Get a fresh token
      const token = await getToken();
      
      // Get the pay action URL
      const iouId = selectedIou['@id'];
      
      // Use the action URL if available
      let payUrl;
      if (typeof selectedIou['@actions'] === 'object' && 'pay' in selectedIou['@actions']) {
        const actionUrl = (selectedIou['@actions'] as { [key: string]: string })['pay'];
        console.log('Using pay action URL from IOU:', actionUrl);
        
        if (actionUrl) {
          // If it's a full URL, extract just the path
          if (actionUrl.startsWith('http')) {
            try {
              const urlObj = new URL(actionUrl);
              payUrl = urlObj.pathname;
            } catch (e) {
              console.error('Failed to parse URL, using as-is:', actionUrl);
              payUrl = actionUrl;
            }
          } else {
            // It's already a path
            payUrl = actionUrl;
          }
        }
      }
      
      // Default pay URL as fallback
      if (!payUrl) {
        payUrl = `/npl/objects/iou/Iou/${iouId}/pay`;
        console.log('Using default pay URL:', payUrl);
      }
      
      console.log('Sending pay request to:', payUrl, 'with amount:', amount);
      try {
        // First try a POST request with amount parameter
        await api.post(payUrl, { amount }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        console.log('Payment request successful');
      } catch (error: any) {
        // If we get a 405 Method Not Allowed, try a GET request
        if (error.response && error.response.status === 405) {
          console.log('Received Method Not Allowed error, trying GET request instead');
          await api.get(`${payUrl}?amount=${amount}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          console.log('Pay GET request successful');
        } else {
          // Other error, rethrow it
          throw error;
        }
      }
      
      // Refresh the IOUs list
      await fetchIous();
      
      // Close the dialog
      setPaymentDialogOpen(false);
      setSelectedIou(null);
      setPaymentAmount('');
    } catch (err: any) {
      console.error('Error processing payment:', err);
      setPaymentError(err.message || 'Failed to process payment. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const columns: GridColDef[] = [
    { 
      field: 'payee', 
      headerName: 'Recipient', 
      width: 200
    },
    { 
      field: 'amount',
      headerName: 'Amount', 
      width: 150,
      renderCell: (params: GridRenderCellParams) => {
        if (!params.row || params.row.amount === undefined || params.row.amount === null || isNaN(Number(params.row.amount))) {
          return 'N/A';
        }
        return formatCurrency(Number(params.row.amount));
      }
    },
    { 
      field: 'amountOwed', 
      headerName: 'Amount Owed', 
      width: 150,
      renderCell: (params: GridRenderCellParams) => {
        if (!params.row || params.row.amountOwed === undefined || params.row.amountOwed === null || isNaN(Number(params.row.amountOwed))) {
          return 'N/A';
        }
        return formatCurrency(Number(params.row.amountOwed));
      }
    },
    {
      field: 'protocolId',
      headerName: 'Protocol ID',
      width: 300,
    },
    {
      field: 'state',
      headerName: 'State',
      width: 120
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params: GridRenderCellParams) => {
        if (!params.row) return null;
        
        return (
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => handlePayClick(params.row)}
          >
            Pay
          </Button>
        );
      }
    }
  ];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" gutterBottom>
        Pay IOUs
      </Typography>
      
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Box sx={{ mb: 2 }}>
        <Button 
          variant="outlined" 
          size="small" 
          onClick={() => setShowDebug(!showDebug)}
          sx={{ mb: 1 }}
        >
          {showDebug ? 'Hide Debug Info' : 'Show Debug Info'}
        </Button>
      </Box>

      <Box sx={{ flexGrow: 1 }}>
        {/* Debug info for the first row - only shown when debug is enabled */}
        {showDebug && transformedIous.length > 0 && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'lightyellow', borderRadius: 1 }}>
            <Typography variant="subtitle2">First row debug:</Typography>
            <pre style={{ overflow: 'auto', maxHeight: '100px' }}>
              {JSON.stringify(transformedIous[0], null, 2)}
            </pre>
          </Box>
        )}
        
        <DataGrid
          rows={transformedIous}
          columns={columns}
          loading={loading}
          getRowId={(row) => row.id}
          pageSizeOptions={[5, 10, 25, 50, 100]}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10 }
            }
          }}
          disableRowSelectionOnClick
        />
      </Box>

      {/* Debug info - only shown when debug is enabled */}
      {showDebug && process.env.NODE_ENV !== 'production' && debugData && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>Debug data:</Typography>
          <pre style={{ overflow: 'auto', maxHeight: '200px' }}>
            {JSON.stringify(debugData, null, 2)}
          </pre>
        </Box>
      )}
      
      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onClose={handleClosePaymentDialog}>
        <DialogTitle>Make Payment</DialogTitle>
        <DialogContent>
          {selectedIou && (
            <>
              <Typography paragraph>
                You owe {formatCurrency(selectedIou.forAmount)} to {selectedIou['@parties']?.payee?.entity?.email?.[0]}.
              </Typography>
              <TextField
                label="Payment Amount"
                type="text"
                fullWidth
                margin="normal"
                variant="outlined"
                value={paymentAmount}
                onChange={handlePaymentAmountChange}
                disabled={processingPayment}
                InputProps={{
                  startAdornment: <span style={{ marginRight: 8 }}>$</span>,
                }}
                helperText="Enter the amount you want to pay"
                error={!!paymentError}
              />
            </>
          )}
          {paymentError && (
            <Typography color="error" sx={{ mt: 2 }}>
              {paymentError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePaymentDialog} disabled={processingPayment}>
            Cancel
          </Button>
          <Button 
            onClick={handlePaymentSubmit} 
            color="primary" 
            disabled={processingPayment || !paymentAmount}
            startIcon={processingPayment ? <CircularProgress size={20} /> : null}
          >
            {processingPayment ? 'Processing...' : 'Pay'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PayIOUScreen; 