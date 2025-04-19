import React, { useEffect, useState } from 'react';
import { Box, Button, Typography, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress } from '@mui/material';
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

const ForgiveIOUScreen: React.FC = () => {
  const { tokenParsed, getToken } = useAuth();
  const [ious, setIous] = useState<IOUResponse[]>([]);
  const [transformedIous, setTransformedIous] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIou, setSelectedIou] = useState<IOUResponse | null>(null);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [forgivingIou, setForgivingIou] = useState(false);
  const [forgiveError, setForgiveError] = useState<string | null>(null);
  const [debugData, setDebugData] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    fetchIOUs();
  }, []);

  const fetchIOUs = async () => {
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
      console.log('Fetching IOUs where current user is the payee...');
      
      // Fetch IOUs where the current user is the payee
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
      if (response.data && typeof response.data === 'object') {
        console.log('Response data type:', typeof response.data);
        if (Array.isArray(response.data)) {
          console.log('Data is an array with length:', response.data.length);
        } else if (typeof response.data === 'object') {
          console.log('Data is an object with keys:', Object.keys(response.data));
          if (response.data.items) {
            console.log('Items array length:', response.data.items.length);
            if (response.data.items.length > 0) {
              const firstItem = response.data.items[0];
              console.log('First item structure:', Object.keys(firstItem));
              console.log('First item complete data:', JSON.stringify(firstItem, null, 2));
              console.log('First item parties:', firstItem['@parties']);
              console.log('First item actions:', firstItem['@actions']);
              console.log('First item forAmount type:', typeof firstItem.forAmount);
              console.log('First item forAmount value:', firstItem.forAmount);
            }
          }
        }
      }
      
      setDebugData(response.data);
      
      let iouList: IOUResponse[] = [];
      
      // Process the response data
      if (Array.isArray(response.data)) {
        // Filter IOUs where the current user is the payee and the state is unpaid
        iouList = response.data.filter((iou: IOUResponse) => 
          iou['@parties']?.payee?.entity?.email?.includes(currentUserEmail) && 
          iou['@state'] === 'unpaid' &&
          (Array.isArray(iou['@actions']) ? 
            iou['@actions'].includes('forgive') : 
            iou['@actions'] && 'forgive' in iou['@actions'])
        );
      } else if (response.data && typeof response.data === 'object') {
        if (Array.isArray(response.data.items)) {
          // Filter IOUs from items array
          iouList = response.data.items.filter((iou: IOUResponse) => 
            iou['@parties']?.payee?.entity?.email?.includes(currentUserEmail) && 
            (iou['@state'] === 'unpaid' || !iou['@state']) &&
            (Array.isArray(iou['@actions']) ? 
              iou['@actions'].includes('forgive') : 
              iou['@actions'] && 'forgive' in iou['@actions'])
          );
        } else if (Array.isArray(response.data.content)) {
          // Filter IOUs from content array
          iouList = response.data.content.filter((iou: IOUResponse) => 
            iou['@parties']?.payee?.entity?.email?.includes(currentUserEmail) && 
            (iou['@state'] === 'unpaid' || !iou['@state']) &&
            (Array.isArray(iou['@actions']) ? 
              iou['@actions'].includes('forgive') : 
              iou['@actions'] && 'forgive' in iou['@actions'])
          );
        }
      }
      
      console.log('Filtered IOUs where user is payee:', iouList);
      
      // Check the first item to see its structure
      if (iouList.length > 0) {
        console.log('Sample IOU item for debugging:', iouList[0]);
        console.log('IOU item forAmount:', iouList[0].forAmount);
        console.log('IOU item ID:', iouList[0]['@id']);
        console.log('IOU item issuer email:', iouList[0]['@parties']?.issuer?.entity?.email?.[0]);
      }
      
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
          amountOwed: amountOwed, // Add the amount owed from the API call
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
        console.log('No IOUs found where user is the payee');
      }
      
    } catch (err: any) {
      console.error('Error fetching IOUs:', err);
      setError(err.message || 'Failed to load IOUs');
    } finally {
      setLoading(false);
    }
  };

  const handleForgiveClick = (iou: IOUResponse) => {
    setSelectedIou(iou);
    setOpenConfirmDialog(true);
    setForgiveError(null);
  };

  const handleCloseDialog = () => {
    setOpenConfirmDialog(false);
  };

  const handleForgiveConfirm = async () => {
    if (!selectedIou) return;
    
    setForgivingIou(true);
    setForgiveError(null);
    
    try {
      const token = await getToken();
      const iouId = selectedIou['@id'];
      
      // Use the action URL if available
      let forgiveUrl;
      if (typeof selectedIou['@actions'] === 'object' && 'forgive' in selectedIou['@actions']) {
        const actionUrl = (selectedIou['@actions'] as { [key: string]: string })['forgive'];
        console.log('Using forgive action URL from IOU:', actionUrl);
        
        if (actionUrl) {
          // If it's a full URL, extract just the path
          if (actionUrl.startsWith('http')) {
            try {
              const urlObj = new URL(actionUrl);
              forgiveUrl = urlObj.pathname;
            } catch (e) {
              console.error('Failed to parse URL, using as-is:', actionUrl);
              forgiveUrl = actionUrl;
            }
          } else {
            // It's already a path
            forgiveUrl = actionUrl;
          }
        }
      }
      
      // Default forgive URL as fallback
      if (!forgiveUrl) {
        forgiveUrl = `/npl/objects/iou/Iou/${iouId}/forgive`;
        console.log('Using default forgive URL:', forgiveUrl);
      }
      
      console.log('Sending forgive request to:', forgiveUrl);
      try {
        // First try a POST request
        await api.post(forgiveUrl, {}, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        console.log('Forgive request successful');
      } catch (error: any) {
        // If we get a 405 Method Not Allowed, try a GET request
        if (error.response && error.response.status === 405) {
          console.log('Received Method Not Allowed error, trying GET request instead');
          await api.get(forgiveUrl, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          console.log('Forgive GET request successful');
        } else {
          // Other error, rethrow it
          throw error;
        }
      }
      
      setOpenConfirmDialog(false);
      // Refresh the list of IOUs
      fetchIOUs();
    } catch (err: any) {
      console.error('Error forgiving IOU:', err);
      setForgiveError(err.message || 'Failed to forgive IOU');
    } finally {
      setForgivingIou(false);
    }
  };

  const transformedColumns: GridColDef[] = [
    { 
      field: 'issuer', 
      headerName: 'From', 
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
        if (!params.row || !params.row.originalIou) {
          return null;
        }
        const originalIou = params.row.originalIou;
        return (
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => handleForgiveClick(originalIou)}
          >
            Forgive
          </Button>
        );
      }
    }
  ];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" gutterBottom>
        Forgive IOUs
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
          columns={transformedColumns}
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

      {/* Forgive Confirmation Dialog */}
      <Dialog open={openConfirmDialog} onClose={handleCloseDialog}>
        <DialogTitle>Confirm Forgiveness</DialogTitle>
        <DialogContent>
          {selectedIou && (
            <Typography>
              Are you sure you want to forgive the IOU of {formatCurrency(selectedIou.forAmount)} from {selectedIou['@parties']?.issuer?.entity?.email?.[0]}?
            </Typography>
          )}
          {forgiveError && (
            <Typography color="error" sx={{ mt: 2 }}>
              {forgiveError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={forgivingIou}>
            Cancel
          </Button>
          <Button 
            onClick={handleForgiveConfirm} 
            color="primary" 
            disabled={forgivingIou}
            startIcon={forgivingIou ? <CircularProgress size={20} /> : null}
          >
            {forgivingIou ? 'Forgiving...' : 'Forgive'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ForgiveIOUScreen; 