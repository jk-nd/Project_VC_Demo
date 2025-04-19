import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Box, Button, Typography, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Paper, TextField, InputAdornment, Chip } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import api from '../../services/api';
//import { formatCurrency, formatDate } from '../../utils/formatters';
import { useAuth } from '../../auth/KeycloakContext';
import SearchIcon from '@mui/icons-material/Search';
import Autocomplete from '@mui/material/Autocomplete';
import { IOU } from '../../types/IOU';
import { formatCurrency } from '../../utils/formatters';

const ForgiveIOUScreen: React.FC = () => {
  const { tokenParsed, getToken } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState<boolean>(false);
  const [transformedIous, setTransformedIous] = useState<any[]>([]);
  const [filteredIous, setFilteredIous] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchTerms, setSearchTerms] = useState<string[]>([]);
  const [selectedIou, setSelectedIou] = useState<IOU | null>(null);
  const [openConfirmDialog, setOpenConfirmDialog] = useState<boolean>(false);
  const [forgivingIou, setForgivingIou] = useState<boolean>(false);
  const [forgiveError, setForgiveError] = useState<string | null>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchIOUs();
  }, []);

  // Set filteredIous to match transformedIous when they change
  useEffect(() => {
    setFilteredIous(transformedIous);
  }, [transformedIous]);

  // Filter IOUs based on multiple search terms
  useEffect(() => {
    if (searchTerms.length === 0) {
      setFilteredIous(transformedIous);
      return;
    }

    const filtered = transformedIous.filter(iou => {
      // The IOU must match ALL search terms to be included
      return searchTerms.every(term => {
        // Check if search term has a type prefix (like "issuer:" or "status:")
        let searchType = '';
        let searchValue = term.toLowerCase();
        
        if (term.includes(':')) {
          const [type, value] = term.split(':');
          searchType = type.toLowerCase();
          searchValue = value.toLowerCase();
        }
        
        // If we have a type prefix, filter by that specific field
        if (searchType) {
          switch (searchType) {
            case 'issuer':
            case 'from':
              return (iou.issuerName && iou.issuerName.toLowerCase().includes(searchValue)) ||
                     (iou.issuerEmail && iou.issuerEmail.toLowerCase().includes(searchValue));
            case 'amount':
              return iou.amount && iou.amount.toString().includes(searchValue);
            case 'date':
              return iou.date && iou.date.toLowerCase().includes(searchValue);
            case 'status':
            case 'state':
              return iou.status && iou.status.toLowerCase().includes(searchValue);
            case 'id':
              return iou.id && iou.id.toLowerCase().includes(searchValue);
            default:
              return false;
          }
        }
        
        // If no type prefix, search across all fields
        return (
          (iou.issuerName && iou.issuerName.toLowerCase().includes(searchValue)) ||
          (iou.issuerEmail && iou.issuerEmail.toLowerCase().includes(searchValue)) ||
          (iou.amount && iou.amount.toString().includes(searchValue)) ||
          (iou.date && iou.date.toLowerCase().includes(searchValue)) ||
          (iou.status && iou.status.toLowerCase().includes(searchValue)) ||
          (iou.id && iou.id.toLowerCase().includes(searchValue))
        );
      });
    });
    
    setFilteredIous(filtered);
  }, [searchTerms, transformedIous]);

  // Handle adding a search term
  const handleAddSearchTerm = (term: string) => {
    if (!term || searchTerms.includes(term)) return;
    setSearchTerms([...searchTerms, term]);
    setSearchTerm(''); // Clear the input after adding
    
    // Focus the search input after a short delay to ensure state updates have completed
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 50);
  };

  // Handle removing a search term
  const handleRemoveSearchTerm = (termToRemove: string) => {
    setSearchTerms(searchTerms.filter(term => term !== termToRemove));
  };

  // Clear all search terms
  const handleClearAllSearchTerms = () => {
    setSearchTerms([]);
    setSearchTerm('');
  };

  // Generate search suggestions from the data
  const searchSuggestions = useMemo(() => {
    const suggestions = new Set<string>();
    
    // Add all issuers, dates, status and amounts to suggestions
    transformedIous.forEach(iou => {
      if (iou.issuerName) suggestions.add(`issuer:${iou.issuerName}`);
      if (iou.issuerEmail) suggestions.add(`from:${iou.issuerEmail}`);
      if (iou.status) suggestions.add(`status:${iou.status}`);
      if (iou.date) suggestions.add(`date:${iou.date}`);
      if (iou.id) suggestions.add(`id:${iou.id.substring(0, 8)}`);
      if (iou.amount) suggestions.add(`amount:${formatCurrency(iou.amount)}`);
    });
    
    return Array.from(suggestions);
  }, [transformedIous]);

  const fetchIOUs = useCallback(async () => {
    setLoading(true);
    try {
      if (!tokenParsed || !tokenParsed.email) {
        throw new Error('User email not available in token');
      }
      const userEmail = tokenParsed.email;
      console.log("User email:", userEmail);
      
      // Get a fresh token
      const token = await getToken();
      
      // Update to use the correct endpoint pattern with trailing slash, auth token, and pagination
      const response = await api.get<any>('/npl/objects/iou/Iou/', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          pageSize: 100,
          includeCount: true
        }
      });
      
      // Extract IOU list from response, ensuring it's an array
      const responseData = response.data;
      const iouList = Array.isArray(responseData) ? responseData : 
                     (responseData && responseData.items ? responseData.items : []);
      
      console.log("Total IOUs:", iouList.length);
      console.log("Response structure:", JSON.stringify(responseData).substring(0, 200));
      
      // Log the first IOU to inspect its structure and available actions
      if (iouList && iouList.length > 0) {
        console.log("First IOU structure:", iouList[0]);
        console.log("First IOU actions:", iouList[0]['@actions']);
        console.log("First IOU state:", iouList[0]['@state']);
      }
      
      const filteredIOUs = iouList.filter((iou: IOU) => 
        (iou['@parties']?.payee?.entity?.email?.includes(userEmail)) && 
        iou['@state'] !== 'paid' && 
        iou['@state'] !== 'forgiven' &&
        (Array.isArray(iou['@actions']) ? 
          iou['@actions'].includes('forgive') : 
          iou['@actions'] && 'forgive' in iou['@actions'])
      );
      console.log("Filtered IOUs (user is payee with forgive action):", filteredIOUs.length);
      
      const transformedIOUs = filteredIOUs.map((iou: IOU) => ({
        id: iou['@id'],
        issuerEmail: iou['@parties']?.issuer?.entity?.email?.[0] || 'Unknown',
        issuerName: iou['@parties']?.issuer?.entity?.email?.[0] || 'Unknown',
        amount: iou.forAmount || 0,
        date: iou.createdAt ? new Date(iou.createdAt).toLocaleDateString() : 'Unknown',
        status: iou['@state'] || 'Unknown',
        originalIou: iou
      }));
      
      setTransformedIous(transformedIOUs);
      setFilteredIous(transformedIOUs);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching IOUs:', error);
      setError('Failed to fetch IOUs');
      setLoading(false);
    }
  }, [tokenParsed, getToken]);

  const handleForgiveClick = (iou: IOU) => {
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
      
      let forgiveUrl;
      if (typeof selectedIou['@actions'] === 'object' && 'forgive' in selectedIou['@actions']) {
        const actionUrl = (selectedIou['@actions'] as { [key: string]: string })['forgive'];
        console.log('Using forgive action URL from IOU:', actionUrl);
        
        if (actionUrl) {
          if (actionUrl.startsWith('http')) {
            try {
              const urlObj = new URL(actionUrl);
              forgiveUrl = urlObj.pathname;
            } catch (e) {
              console.error('Failed to parse URL, using as-is:', actionUrl);
              forgiveUrl = actionUrl;
            }
          } else {
            forgiveUrl = actionUrl;
          }
        }
      }
      
      if (!forgiveUrl) {
        forgiveUrl = `/npl/objects/iou/Iou/${iouId}/forgive`;
        console.log('Using default forgive URL:', forgiveUrl);
      }
      
      console.log('Sending forgive request to:', forgiveUrl);
      try {
        await api.post(forgiveUrl, {}, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        console.log('Forgive request successful');
      } catch (error: any) {
        if (error.response && error.response.status === 405) {
          console.log('Received Method Not Allowed error, trying GET request instead');
          await api.get(forgiveUrl, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          console.log('Forgive GET request successful');
        } else {
          throw error;
        }
      }
      
      setOpenConfirmDialog(false);
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
      field: 'issuerEmail', 
      headerName: 'From', 
      width: 200,
      valueGetter: (params: any) => {
        return params.row?.issuerEmail || 'Unknown';
      }
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
      valueGetter: (params: any) => {
        return params.row?.date || 'Unknown';
      }
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      valueGetter: (params: any) => {
        return params.row?.status ? params.row.status.toUpperCase() : 'UNKNOWN';
      }
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
              inputRef={searchInputRef}
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
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchTerm) {
                  handleAddSearchTerm(searchTerm);
                  e.preventDefault();
                }
              }}
            />
          )}
          renderOption={(props, option) => {
            // Parse the option to display it nicely
            let [type, value] = ['', ''];
            if (typeof option === 'string' && option.includes(':')) {
              [type, value] = option.split(':');
            } else if (typeof option === 'string') {
              value = option;
            }
            
            // Extract the key prop to pass it directly to the JSX element
            const { key, ...otherProps } = props;
            
            return (
              <li key={key} {...otherProps}>
                {type && (
                  <Chip 
                    label={type} 
                    size="small" 
                    sx={{ mr: 1, textTransform: 'capitalize' }}
                  />
                )}
                {value}
              </li>
            );
          }}
          
          // Handle option selection
          onChange={(_, newValue) => {
            if (newValue && typeof newValue === 'string') {
              handleAddSearchTerm(newValue);
            }
          }}
        />
        
        {/* Display active search terms as chips */}
        {searchTerms.length > 0 && (
          <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {searchTerms.map((term, index) => {
              let label = term;
              let color: "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" = "default";
              
              // Style chips differently based on search type
              if (term.includes(':')) {
                const type = term.split(':')[0];
                switch (type.toLowerCase()) {
                  case 'issuer':
                  case 'from':
                    color = "primary";
                    break;
                  case 'amount':
                    color = "success";
                    break;
                  case 'date':
                    color = "warning";
                    break;
                  case 'status':
                  case 'state':
                    color = "info";
                    break;
                  case 'id':
                    color = "secondary";
                    break;
                }
              }
              
              return (
                <Chip
                  key={index}
                  label={label}
                  color={color}
                  onDelete={() => handleRemoveSearchTerm(term)}
                  size="medium"
                />
              );
            })}
            
            <Button 
              size="small" 
              onClick={handleClearAllSearchTerms}
              sx={{ ml: 1, textTransform: 'none' }}
            >
              Clear all
            </Button>
          </Box>
        )}
        
        {searchTerms.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {filteredIous.length} {filteredIous.length === 1 ? 'result' : 'results'} found
            </Typography>
          </Box>
        )}
      </Paper>

      <Box sx={{ flexGrow: 1 }}>
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