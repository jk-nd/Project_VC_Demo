import React, { useEffect, useState, useMemo } from 'react';
import { Box, Button, Typography, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Paper, TextField, InputAdornment } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useAuth } from '../../auth/KeycloakContext';
import SearchIcon from '@mui/icons-material/Search';
import Autocomplete from '@mui/material/Autocomplete';

// Define the structure of an IOU as it comes from the API
interface IOUResponse {
  '@id': string;
  '@actions': string[] | { [key: string]: string };
  '@parties': {
    issuer: {
      entity: { 
        email: string[];
        name?: string;
      };
      access: any;
    };
    payee: {
      entity: { 
        email: string[];
        name?: string;
      };
      access: any;
    };
  };
  forAmount: number;
  '@state'?: string;
  '@created'?: string;
}

const ForgiveIOUScreen: React.FC = () => {
  const { tokenParsed, getToken } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState<boolean>(false);
  const [transformedIous, setTransformedIous] = useState<any[]>([]);
  const [filteredIous, setFilteredIous] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedIou, setSelectedIou] = useState<IOUResponse | null>(null);
  const [openConfirmDialog, setOpenConfirmDialog] = useState<boolean>(false);
  const [forgivingIou, setForgivingIou] = useState<boolean>(false);
  const [forgiveError, setForgiveError] = useState<string | null>(null);

  useEffect(() => {
    fetchIOUs();
  }, []);

  // Set filteredIous to match transformedIous when they change
  useEffect(() => {
    setFilteredIous(transformedIous);
  }, [transformedIous]);

  // Filter IOUs based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredIous(transformedIous);
      return;
    }

    const searchValue = searchTerm.toLowerCase();
    
    const filtered = transformedIous.filter(iou => {
      return (
        (iou.issuerName && iou.issuerName.toLowerCase().includes(searchValue)) ||
        (iou.issuerEmail && iou.issuerEmail.toLowerCase().includes(searchValue)) ||
        (iou.amount && iou.amount.toString().includes(searchValue)) ||
        (iou.date && iou.date.toLowerCase().includes(searchValue)) ||
        (iou.status && iou.status.toLowerCase().includes(searchValue))
      );
    });
    
    setFilteredIous(filtered);
  }, [searchTerm, transformedIous]);

  // Generate search suggestions
  const searchSuggestions = useMemo(() => {
    const suggestions = new Set<string>();
    
    transformedIous.forEach(iou => {
      if (iou.issuerName) suggestions.add(iou.issuerName);
      if (iou.issuerEmail) suggestions.add(iou.issuerEmail);
      if (iou.status) suggestions.add(iou.status);
    });
    
    return Array.from(suggestions);
  }, [transformedIous]);

  const fetchIOUs = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching IOUs where user is the payee...');
      const token = await getToken();
      
      // Use the api service instead of fetch and correct endpoint
      const response = await api.get('/backend/npl/objects/iou/Iou/', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          pageSize: 100,
          includeCount: true
        }
      });
      
      console.log('API response:', response.data);
      
      // Process the response data
      let iouList: IOUResponse[] = [];
      
      if (Array.isArray(response.data)) {
        iouList = response.data;
      } else if (response.data && typeof response.data === 'object') {
        if (Array.isArray(response.data.items)) {
          iouList = response.data.items;
        } else if (Array.isArray(response.data.content)) {
          iouList = response.data.content;
        }
      }
      
      // Filter to only get IOUs where the current user is the payee (recipient)
      const userEmail = tokenParsed?.email || '';
      console.log('Current user email:', userEmail);
      
      const filteredIouList = iouList.filter((iou: IOUResponse) => {
        const isPaidOrForgiven = iou['@state'] === 'paid' || iou['@state'] === 'forgiven';
        const isPayee = iou['@parties']?.payee?.entity?.email?.includes(userEmail);
        
        // Consider only unpaid IOUs where current user is the payee
        return isPayee && !isPaidOrForgiven;
      });
      
      console.log('Filtered IOUs where user is payee:', filteredIouList);
      
      // Transform IOUs for DataGrid
      const mappedIous = filteredIouList.map((iou: IOUResponse) => {
        return {
          id: iou['@id'],
          amount: iou.forAmount,
          issuerName: iou['@parties']?.issuer?.entity?.name || 'Unknown',
          issuerEmail: iou['@parties']?.issuer?.entity?.email?.[0] || 'Unknown',
          date: formatDate(iou['@created']),
          status: iou['@state'],
          originalIou: iou
        };
      });
      
      console.log('Transformed IOUs for DataGrid:', mappedIous);
      setTransformedIous(mappedIous);
      
      if (filteredIouList.length === 0) {
        console.log('No IOUs found where user is the payee');
      }
    } catch (error) {
      console.error('Error fetching IOUs:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
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
      field: 'issuerName', 
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
      field: 'date',
      headerName: 'Created Date',
      width: 200,
    },
    {
      field: 'status',
      headerName: 'Status',
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

      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Search IOUs
        </Typography>
        <Autocomplete
          freeSolo
          options={searchSuggestions}
          inputValue={searchTerm}
          onInputChange={(_, newValue) => setSearchTerm(newValue || '')}
          renderInput={(params) => (
            <TextField
              {...params}
              variant="outlined"
              placeholder="Search by issuer, amount, date, or status..."
              fullWidth
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                    {params.InputProps.startAdornment}
                  </>
                )
              }}
            />
          )}
        />
        {searchTerm && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {filteredIous.length} {filteredIous.length === 1 ? 'result' : 'results'} found
            </Typography>
            <Button 
              size="small" 
              onClick={() => setSearchTerm('')}
              sx={{ textTransform: 'none' }}
            >
              Clear search
            </Button>
          </Box>
        )}
      </Paper>

      <Box sx={{ flexGrow: 1 }}>
        {/* Debug info - only shown when debug is enabled */}
        {showDebug && transformedIous.length > 0 && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'lightyellow', borderRadius: 1 }}>
            <Typography variant="subtitle2">First row debug:</Typography>
            <pre style={{ overflow: 'auto', maxHeight: '100px' }}>
              {JSON.stringify(transformedIous[0], null, 2)}
            </pre>
          </Box>
        )}
        
        <DataGrid
          rows={filteredIous}
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