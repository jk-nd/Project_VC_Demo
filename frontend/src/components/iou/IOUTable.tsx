import { useState, useEffect, useMemo, useRef } from 'react';
import { 
    DataGrid, 
    GridColDef
} from '@mui/x-data-grid';
import { Box, Typography, Paper, Button, Stack, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress, InputAdornment, Chip } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import Autocomplete from '@mui/material/Autocomplete';
import { IOU } from '../../types/IOU';
import { fetchUserIOUs, payIOU } from '../../services/iouService';
import { useAuth } from '../../auth/KeycloakContext';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import CreateIOUForm from './CreateIOUForm';

// Remove unused type
// Define generic parameter types for handlers that need them
// type GridParams = {
//     row?: any;
//     value?: any;
// };

export default function IOUTable() {
    const { tokenParsed, getToken } = useAuth();
    const [ious, setIous] = useState<IOU[]>([]);
    const [filteredIous, setFilteredIous] = useState<IOU[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchTerms, setSearchTerms] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showDebug, setShowDebug] = useState(false);
    const [rawData, setRawData] = useState<any>(null);
    
    // Add state for transformed IOUs with amount owed
    const [transformedIous, setTransformedIous] = useState<any[]>([]);
    
    // Payment dialog state
    const [payDialogOpen, setPayDialogOpen] = useState(false);
    const [selectedIou, setSelectedIou] = useState<IOU | null>(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    const [paymentError, setPaymentError] = useState<string | null>(null);
    
    // Forgive dialog state
    const [forgiveDialogOpen, setForgiveDialogOpen] = useState(false);
    const [forgiveProcessing, setForgiveProcessing] = useState(false);
    const [forgiveError, setForgiveError] = useState<string | null>(null);

    // Create IOU dialog state
    const [createDialogOpen, setCreateDialogOpen] = useState(false);

    const searchInputRef = useRef<HTMLInputElement>(null);

        const loadIOUs = async () => {
            try {
                setLoading(true);
                setError(null);
        
        // Clear existing data first to avoid showing stale data
        setIous([]);
        setFilteredIous([]);
        setTransformedIous([]);
        setRawData(null);
        
        console.log('IOUTable: Loading IOUs...');
                const data = await fetchUserIOUs();
        
        console.log('IOUTable: Received data from service:', 
                    JSON.stringify(data, null, 2));
        
        // Store raw data for debugging
        setRawData(data);
        
        if (Array.isArray(data) && data.length > 0) {
            // Debug first item to see structure
            const firstItem = data[0];
            console.log('First IOU details:',
                '\n - ID:', firstItem['@id'],
                '\n - Amount:', firstItem.forAmount,
                '\n - Issuer:', firstItem.issuerEmail,
                '\n - Recipient:', firstItem.recipientEmail,
                '\n - Created:', firstItem.createdAt, 
                '\n - Updated:', firstItem.updatedAt,
                '\n - Actions:', firstItem['@actions']);
            
            // Make sure data is in the right format for the DataGrid
            setIous(data);
            setFilteredIous(data);

            // Transform the IOUs to include amountOwed
            try {
                const token = await getToken();
                const transformedIouPromises = data.map(async (iou) => {
                    let amountOwed = iou.forAmount; // Default to total amount

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
                                
                                // Add cache-busting parameter to prevent caching
                                const cacheBuster = `nocache=${Date.now()}`;
                                const pathWithCacheBuster = amountOwedPath.includes('?') 
                                    ? `${amountOwedPath}&${cacheBuster}` 
                                    : `${amountOwedPath}?${cacheBuster}`;
                                
                                try {
                                    // Try POST request first with cache-busting headers
                                    const amountOwedResponse = await api.post(pathWithCacheBuster, {}, {
                                        headers: {
                                            Authorization: `Bearer ${token}`,
                                            'Cache-Control': 'no-cache, no-store, must-revalidate',
                                            'Pragma': 'no-cache',
                                            'Expires': '0'
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
                                            // Try GET request with cache-busting headers
                                            const getResponse = await api.get(pathWithCacheBuster, {
                                                headers: {
                                                    Authorization: `Bearer ${token}`,
                                                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                                                    'Pragma': 'no-cache',
                                                    'Expires': '0'
                                                }
                                            });
                                            console.log(`GET Amount owed response for ${iou['@id']}:`, getResponse.data);
                                            
                                            if (typeof getResponse.data === 'number') {
                                                amountOwed = getResponse.data;
                                            }
                                        } catch (getError) {
                                            console.error(`GET request for amount owed also failed for IOU ${iou['@id']}:`, getError);
                                            // Use default amount
                                        }
                                    }
                                }
                            }
                        }
                    } catch (error) {
                        console.error(`Error processing IOU ${iou['@id']}:`, error);
                        // Use default amount
                    }
                    
                    return {
                        ...iou,
                        amountOwed
                    };
                });
                
                // Wait for all the amountOwed API calls to complete
                const transformed = await Promise.all(transformedIouPromises);
                console.log('Transformed IOUs with amount owed:', transformed);
                setTransformedIous(transformed);
            } catch (transformError) {
                console.error('Error transforming IOUs with amount owed:', transformError);
                // Still set the transformed IOUs with default values
                setTransformedIous(data.map(iou => ({
                    ...iou,
                    amountOwed: iou.forAmount
                })));
            }
        } else {
            console.log('No IOUs found or data is not an array');
            setIous([]);
            setFilteredIous([]);
            setTransformedIous([]);
        }
            } catch (err) {
        console.error('Error loading IOUs:', err);
                setError(err instanceof Error ? err.message : 'Failed to load IOUs');
        // Clear any partial data
        setIous([]);
        setFilteredIous([]);
        setTransformedIous([]);
            } finally {
                setLoading(false);
            }
        };

    useEffect(() => {
        loadIOUs();
    }, []);

    // Filter IOUs based on multiple search terms
    useEffect(() => {
        if (searchTerms.length === 0) {
            setFilteredIous(ious);
            return;
        }

        const filtered = ious.filter(iou => {
            // The IOU must match ALL search terms to be included
            return searchTerms.every(term => {
                // Check if search term has a type prefix (like "issuer:" or "state:")
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
                            return iou.issuerEmail && iou.issuerEmail.toLowerCase().includes(searchValue);
                        case 'payee':
                            return iou.recipientEmail && iou.recipientEmail.toLowerCase().includes(searchValue);
                        case 'state':
                            return iou['@state'] && iou['@state'].toLowerCase().includes(searchValue);
                        case 'id':
                            return iou['@id'] && iou['@id'].toLowerCase().includes(searchValue);
                        case 'amount':
                            return iou.forAmount && iou.forAmount.toString().includes(searchValue);
                        case 'owed':
                            // For amount owed, we need to check in the transformedIous array
                            const transformedIou = transformedIous.find(item => item['@id'] === iou['@id']);
                            return transformedIou && transformedIou.amountOwed && 
                                   transformedIou.amountOwed.toString().includes(searchValue);
                        default:
                            return false;
                    }
                }
                
                // If no type prefix, search across all fields
                return (
                    (iou.issuerEmail && iou.issuerEmail.toLowerCase().includes(searchValue)) ||
                    (iou.recipientEmail && iou.recipientEmail.toLowerCase().includes(searchValue)) ||
                    (iou['@state'] && iou['@state'].toLowerCase().includes(searchValue)) ||
                    (iou['@id'] && iou['@id'].toLowerCase().includes(searchValue)) ||
                    (iou.forAmount && iou.forAmount.toString().includes(searchValue))
                );
            });
        });
        
        setFilteredIous(filtered);
    }, [searchTerms, ious, transformedIous]);

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
        
        // Add all issuers, payees, states and protocol IDs to suggestions
        ious.forEach(iou => {
            if (iou.issuerEmail) suggestions.add(`issuer:${iou.issuerEmail}`);
            if (iou.recipientEmail) suggestions.add(`payee:${iou.recipientEmail}`);
            if (iou['@state']) suggestions.add(`state:${iou['@state']}`);
            if (iou['@id']) suggestions.add(`id:${iou['@id'].substring(0, 8)}`);
            suggestions.add(`amount:${iou.forAmount}`);
        });
        
        // Add amount owed suggestions if available
        transformedIous.forEach(iou => {
            if (iou.amountOwed !== undefined) {
                suggestions.add(`owed:${iou.amountOwed}`);
            }
        });
        
        return Array.from(suggestions);
    }, [ious, transformedIous]);

    // Check if the current user is the issuer of the IOU
    const userIsIssuer = (iou: IOU) => {
        const userEmail = tokenParsed?.email;
        return userEmail && iou.issuerEmail.toLowerCase() === userEmail.toLowerCase();
    };

    // Check if the current user is the payee of the IOU
    const userIsPayee = (iou: IOU) => {
        const userEmail = tokenParsed?.email;
        return userEmail && iou.recipientEmail.toLowerCase() === userEmail.toLowerCase();
    };

    // Check if Pay action is available for this IOU
    const canPayIOU = (iou: IOU) => {
        // User must be the issuer and the IOU must be unpaid
        return (
            userIsIssuer(iou) && 
            iou['@state'] === 'unpaid' && 
            (typeof iou['@actions'] === 'object' && 'pay' in iou['@actions'])
        );
    };

    // Check if Forgive action is available for this IOU
    const canForgiveIOU = (iou: IOU) => {
        // User must be the payee and the IOU must be unpaid
        return (
            userIsPayee(iou) && 
            iou['@state'] === 'unpaid' && 
            (typeof iou['@actions'] === 'object' && 'forgive' in iou['@actions'])
        );
    };

    const handleCreateIOU = () => {
        setCreateDialogOpen(true);
    };

    const handleCreateIOUClose = () => {
        setCreateDialogOpen(false);
    };

    const handleIOUCreated = () => {
        loadIOUs();
        setCreateDialogOpen(false);
    };

    // Open pay dialog
    const handlePayClick = (iou: IOU) => {
        // Find the transformed IOU to get the actual amount owed
        const transformedIou = transformedIous.find(item => item['@id'] === iou['@id']);
        const amountOwed = transformedIou?.amountOwed || iou.forAmount;
        
        setSelectedIou(iou);
        setPaymentAmount(amountOwed.toString()); // Pre-fill with max amount
        setPaymentError(null);
        setPayDialogOpen(true);
    };

    // Handle payment amount input change
    const handlePaymentAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Only allow numeric input with one decimal point
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            setPaymentAmount(value);
        }
    };

    // Submit payment
    const handlePaymentSubmit = async () => {
        if (!selectedIou) return;
        
        // Validate payment amount
        const amount = parseFloat(paymentAmount);
        if (isNaN(amount) || amount <= 0) {
            setPaymentError('Please enter a valid amount greater than 0');
            return;
        }
        
        // Find the transformed IOU to get the actual amount owed
        const transformedIou = transformedIous.find(iou => iou['@id'] === selectedIou['@id']);
        const amountOwed = transformedIou?.amountOwed || selectedIou.forAmount;
        
        // Validate payment amount doesn't exceed amount owed
        if (amount > amountOwed) {
            setPaymentError(`Amount may not exceed amount owed (${formatCurrency(amountOwed)})`);
            return;
        }
        
        setPaymentProcessing(true);
        setPaymentError(null);
        
        try {
            // Call the pay API
            await payIOU(selectedIou['@id'], amount);
            
            // Close dialog
            setPayDialogOpen(false);
            
            // Reset state
            setSelectedIou(null);
            setPaymentAmount('');
            
            // Refresh IOUs after successful payment
            await loadIOUs();
        } catch (error: any) {
            console.error('Error processing payment:', error);
            setPaymentError(error.message || 'Failed to process payment');
            
            // Still refresh IOUs even if payment failed
            await loadIOUs();
        } finally {
            setPaymentProcessing(false);
        }
    };

    // Open forgive dialog
    const handleForgiveClick = (iou: IOU) => {
        setSelectedIou(iou);
        setForgiveError(null);
        setForgiveDialogOpen(true);
    };

    // Submit forgiveness
    const handleForgiveSubmit = async () => {
        if (!selectedIou) return;
        
        setForgiveProcessing(true);
        setForgiveError(null);
        
        try {
            const token = await getToken();
            const iouId = selectedIou['@id'];
            
            // Use the action URL if available
            let forgiveUrl;
            if (typeof selectedIou['@actions'] === 'object' && 'forgive' in selectedIou['@actions']) {
                const actionUrl = (selectedIou['@actions'] as { [key: string]: string })['forgive'];
                
                if (actionUrl) {
                    // If it's a full URL, extract just the path
                    if (actionUrl.startsWith('http')) {
                        try {
                            const urlObj = new URL(actionUrl);
                            forgiveUrl = urlObj.pathname;
                        } catch (e) {
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
            }
            
            try {
                // First try a POST request
                await api.post(forgiveUrl, {}, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
            } catch (error: any) {
                // If we get a 405 Method Not Allowed, try a GET request
                if (error.response && error.response.status === 405) {
                    await api.get(forgiveUrl, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });
                } else {
                    // Other error, rethrow it
                    throw error;
                }
            }
            
            // Close dialog
            setForgiveDialogOpen(false);
            
            // Reset state
            setSelectedIou(null);
            
            // Refresh IOUs after successful forgiveness
            await loadIOUs();
        } catch (error: any) {
            console.error('Error forgiving IOU:', error);
            setForgiveError(error.message || 'Failed to forgive IOU');
        } finally {
            setForgiveProcessing(false);
        }
    };

    const columns: GridColDef[] = [
        { 
            field: '@id', 
            headerName: 'ID', 
            width: 200,
            renderCell: (params) => {
                const id = params.row['@id'] || '';
                return <Typography>{id.substring(0, 8)}...</Typography>;
            }
        },
        { 
            field: 'issuerEmail', 
            headerName: 'Issuer', 
            width: 150,
            renderCell: (params) => {
                return <Typography>{params.row.issuerEmail || 'Unknown'}</Typography>;
            }
        },
        { 
            field: 'recipientEmail', 
            headerName: 'Recipient', 
            width: 150,
            renderCell: (params) => {
                return <Typography>{params.row.recipientEmail || 'Unknown'}</Typography>;
            }
        },
        {
            field: 'forAmount',
            headerName: 'Total Amount',
            type: 'number',
            width: 130,
            renderCell: (params) => {
                const amount = Number(params.row.forAmount) || 0;
                return (
                    <Typography>
                        {formatCurrency(amount)}
                    </Typography>
                );
            }
        },
        {
            field: 'amountOwed',
            headerName: 'Amount Owed',
            type: 'number',
            width: 130,
            renderCell: (params) => {
                const amountOwed = params.row.amountOwed !== undefined ? Number(params.row.amountOwed) : Number(params.row.forAmount) || 0;
                return (
                    <Typography>
                        {formatCurrency(amountOwed)}
                    </Typography>
                );
            }
        },
        {
            field: '@state',
            headerName: 'Status',
            width: 130,
            renderCell: (params) => {
                const status = params.row['@state'] || 'unknown';
                const colorMap: Record<string, string> = {
                    'unpaid': 'warning.main',
                    'paid': 'success.main',
                    'rejected': 'error.main',
                    'accepted': 'info.main',
                    'forgiven': 'info.main',
                };
                return (
                    <Typography
                        sx={{
                            color: colorMap[status] || 'text.primary',
                        }}
                    >
                        {status.toUpperCase()}
                    </Typography>
                );
            },
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 200,
            sortable: false,
            filterable: false,
            renderCell: (params) => {
                const iou = params.row as IOU;
                
                return (
                    <Stack direction="row" spacing={1}>
                        {canPayIOU(iou) && (
                            <Button 
                                variant="contained" 
                                size="small"
                                color="primary"
                                onClick={() => handlePayClick(iou)}
                            >
                                Pay
                            </Button>
                        )}
                        
                        {canForgiveIOU(iou) && (
                            <Button 
                                variant="contained" 
                                size="small"
                                color="secondary"
                                onClick={() => handleForgiveClick(iou)}
                            >
                                Forgive
                            </Button>
                        )}
                    </Stack>
                );
            }
        }
    ];

    if (error) {
        return (
            <Paper sx={{ p: 3, bgcolor: 'error.light' }}>
                <Typography color="error">Error: {error}</Typography>
            </Paper>
        );
    }

    return (
        <Box sx={{ width: '100%' }}>
            <Stack direction="row" justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
                <Button 
                    variant="outlined" 
                    color="info" 
                    onClick={() => setShowDebug(!showDebug)}
                >
                    {showDebug ? "Hide Debug" : "Show Debug"}
                </Button>
                
                <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={handleCreateIOU}
                >
                    Create New IOU
                </Button>
            </Stack>
            
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
                            placeholder="Search by issuer, payee, state, amount, or ID..."
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
                                        color = "primary";
                                        break;
                                    case 'payee':
                                        color = "secondary";
                                        break;
                                    case 'state':
                                        color = "info";
                                        break;
                                    case 'amount':
                                    case 'owed':
                                        color = "success";
                                        break;
                                    case 'id':
                                        color = "warning";
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
            
            {/* Debug Info */}
            {showDebug && (
                <Paper sx={{ p: 2, mb: 2, overflow: 'auto', maxHeight: '300px' }}>
                    <Typography variant="h6" gutterBottom>Data Debug</Typography>
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle1">Raw Data Structure:</Typography>
                        {rawData && (
                            <Box component="pre" sx={{ fontSize: '0.75rem', overflow: 'auto' }}>
                                {JSON.stringify(rawData, null, 2)}
                            </Box>
                        )}
                    </Box>
                    <Box>
                        <Typography variant="subtitle1">IOU Table Props:</Typography>
                        <Box component="pre" sx={{ fontSize: '0.75rem' }}>
                            {`ious.length: ${ious.length}`}
                            {ious.length > 0 && `\nFirst IOU ID: ${ious[0]['@id']}`}
                            {ious.length > 0 && `\nFirst IOU Amount: ${ious[0].forAmount}`}
                            {`\nFiltered IOUs: ${filteredIous.length}`}
                            {`\nSearch Terms: ${searchTerms.join(', ')}`}
                        </Box>
                    </Box>
                </Paper>
            )}
            
            <Box sx={{ height: 400, width: '100%' }}>
                <DataGrid
                    rows={transformedIous.length > 0 ? transformedIous.filter(iou => 
                        // Apply the same filtering logic as for filteredIous
                        !searchTerms.length || 
                        searchTerms.every(term => {
                            // Check if search term has a type prefix (like "issuer:" or "state:")
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
                                        return iou.issuerEmail && iou.issuerEmail.toLowerCase().includes(searchValue);
                                    case 'payee':
                                        return iou.recipientEmail && iou.recipientEmail.toLowerCase().includes(searchValue);
                                    case 'state':
                                        return iou['@state'] && iou['@state'].toLowerCase().includes(searchValue);
                                    case 'id':
                                        return iou['@id'] && iou['@id'].toLowerCase().includes(searchValue);
                                    case 'amount':
                                        return iou.forAmount && iou.forAmount.toString().includes(searchValue);
                                    case 'owed':
                                        return iou.amountOwed && iou.amountOwed.toString().includes(searchValue);
                                    default:
                                        return false;
                                }
                            }
                            
                            // If no type prefix, search across all fields
                            return (
                                (iou.issuerEmail && iou.issuerEmail.toLowerCase().includes(searchValue)) ||
                                (iou.recipientEmail && iou.recipientEmail.toLowerCase().includes(searchValue)) ||
                                (iou['@state'] && iou['@state'].toLowerCase().includes(searchValue)) ||
                                (iou['@id'] && iou['@id'].toLowerCase().includes(searchValue)) ||
                                (iou.forAmount && iou.forAmount.toString().includes(searchValue)) ||
                                (iou.amountOwed && iou.amountOwed.toString().includes(searchValue))
                            );
                        })
                    ) : filteredIous}
                    columns={columns}
                    getRowId={(row) => row['@id']}
                    loading={loading}
                    initialState={{
                        pagination: {
                            paginationModel: { pageSize: 5, page: 0 },
                        },
                    }}
                    pageSizeOptions={[5, 10, 25]}
                    disableRowSelectionOnClick
                />
            </Box>

            {/* Payment Dialog */}
            <Dialog open={payDialogOpen} onClose={() => setPayDialogOpen(false)}>
                <DialogTitle>Make Payment</DialogTitle>
                <DialogContent>
                    {selectedIou && (
                        <>
                            <Typography paragraph>
                                You owe {formatCurrency(selectedIou.forAmount)} to {selectedIou.recipientEmail}.
                            </Typography>
                            
                            {/* Show current amount owed */}
                            {transformedIous.length > 0 && (
                                <Typography paragraph color="primary.main" fontWeight="bold">
                                    Current amount owed: {formatCurrency(
                                        transformedIous.find(iou => iou['@id'] === selectedIou['@id'])?.amountOwed || 
                                        selectedIou.forAmount
                                    )}
                                </Typography>
                            )}
                            
                            <TextField
                                label="Payment Amount"
                                type="text"
                                fullWidth
                                margin="normal"
                                variant="outlined"
                                value={paymentAmount}
                                onChange={handlePaymentAmountChange}
                                disabled={paymentProcessing}
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
                    <Button onClick={() => setPayDialogOpen(false)} disabled={paymentProcessing}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handlePaymentSubmit} 
                        color="primary" 
                        disabled={paymentProcessing || !paymentAmount}
                        startIcon={paymentProcessing ? <CircularProgress size={20} /> : null}
                    >
                        {paymentProcessing ? 'Processing...' : 'Pay'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Forgive Dialog */}
            <Dialog open={forgiveDialogOpen} onClose={() => setForgiveDialogOpen(false)}>
                <DialogTitle>Confirm Forgiveness</DialogTitle>
                <DialogContent>
                    {selectedIou && (
                        <Typography>
                            Are you sure you want to forgive the IOU of {formatCurrency(selectedIou.forAmount)} from {selectedIou.issuerEmail}?
                        </Typography>
                    )}
                    {forgiveError && (
                        <Typography color="error" sx={{ mt: 2 }}>
                            {forgiveError}
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setForgiveDialogOpen(false)} disabled={forgiveProcessing}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleForgiveSubmit} 
                        color="primary" 
                        disabled={forgiveProcessing}
                        startIcon={forgiveProcessing ? <CircularProgress size={20} /> : null}
                    >
                        {forgiveProcessing ? 'Forgiving...' : 'Forgive'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Create IOU Dialog */}
            <Dialog 
                open={createDialogOpen} 
                onClose={handleCreateIOUClose}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Create New IOU</DialogTitle>
                <DialogContent>
                    <CreateIOUForm onIOUCreated={handleIOUCreated} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCreateIOUClose}>
                        Cancel
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}