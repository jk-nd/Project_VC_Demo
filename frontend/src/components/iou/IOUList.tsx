import { useState, useEffect } from 'react';
import { useKeycloak } from '@react-keycloak/web';
import { getIOUs } from '../../services/api';
import { Box, Typography, List, ListItem, ListItemText, Paper, CircularProgress } from '@mui/material';

interface IOU {
  id: string;
  amount: number;
  creditor: string;
  debtor: string;
  status: string;
}

export default function IOUList() {
  const { keycloak, initialized } = useKeycloak();
  const [ious, setIOUs] = useState<IOU[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIOUs = async () => {
      if (!initialized || !keycloak.authenticated) {
        return;
      }

      try {
        const response = await getIOUs();
        setIOUs(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch IOUs');
        setLoading(false);
      }
    };

    fetchIOUs();
  }, [initialized, keycloak.authenticated]);

  if (!initialized) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!keycloak.authenticated) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Please log in to view IOUs.</Typography>
      </Box>
    );
  }

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        IOUs
      </Typography>
      <Paper elevation={2}>
        <List>
          {ious.map((iou) => (
            <ListItem key={iou.id} divider>
              <ListItemText
                primary={`${iou.creditor} owes ${iou.debtor} ${iou.amount}`}
                secondary={`Status: ${iou.status}`}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
} 