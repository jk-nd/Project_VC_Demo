import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Divider,
  Typography,
  useTheme,
} from '@mui/material';
import {
  AccountBalance as IOUIcon,
  DirectionsCar as CarIcon,
  SwapHoriz as SettleIcon,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';

export default function Menu() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [openIOU, setOpenIOU] = useState(false);
  const [openCar, setOpenCar] = useState(false);
  const [openSettle, setOpenSettle] = useState(false);

  const handleIOUClick = () => {
    setOpenIOU(!openIOU);
  };

  const handleCarClick = () => {
    setOpenCar(!openCar);
  };

  const handleSettleClick = () => {
    setOpenSettle(!openSettle);
  };

  return (
    <Box sx={{ width: 250, bgcolor: 'background.paper' }}>
      <Typography 
        variant="h6" 
        sx={{ 
          p: 2,
          color: theme.palette.primary.main,
          fontWeight: 600,
        }}
      >
        Menu
      </Typography>
      <Divider />
      <List component="nav">
        {/* IOU Section */}
        <ListItemButton onClick={handleIOUClick}>
          <ListItemIcon>
            <IOUIcon />
          </ListItemIcon>
          <ListItemText primary="IOUs" />
          {openIOU ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={openIOU} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton 
              sx={{ pl: 4 }}
              onClick={() => navigate('/ious')}
            >
              <ListItemText primary="List IOUs" />
            </ListItemButton>
            <ListItemButton 
              sx={{ pl: 4 }}
              onClick={() => navigate('/ious/create')}
            >
              <ListItemText primary="Create IOU" />
            </ListItemButton>
            <ListItemButton 
              sx={{ pl: 4 }}
              onClick={() => navigate('/ious/pay')}
            >
              <ListItemText primary="Make Payment" />
            </ListItemButton>
            <ListItemButton 
              sx={{ pl: 4 }}
              onClick={() => navigate('/ious/forgive')}
            >
              <ListItemText primary="Forgive IOU" />
            </ListItemButton>
          </List>
        </Collapse>

        {/* Car Section */}
        <ListItemButton onClick={handleCarClick}>
          <ListItemIcon>
            <CarIcon />
          </ListItemIcon>
          <ListItemText primary="Cars" />
          {openCar ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={openCar} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton 
              sx={{ pl: 4 }}
              onClick={() => navigate('/cars')}
            >
              <ListItemText primary="List Cars" />
            </ListItemButton>
            <ListItemButton 
              sx={{ pl: 4 }}
              onClick={() => navigate('/cars/create')}
            >
              <ListItemText primary="Register Car" />
            </ListItemButton>
            <ListItemButton 
              sx={{ pl: 4 }}
              onClick={() => navigate('/cars/transfer')}
            >
              <ListItemText primary="Transfer Car" />
            </ListItemButton>
          </List>
        </Collapse>

        {/* Settlement Section */}
        <ListItemButton onClick={handleSettleClick}>
          <ListItemIcon>
            <SettleIcon />
          </ListItemIcon>
          <ListItemText primary="Settlements" />
          {openSettle ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={openSettle} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton 
              sx={{ pl: 4 }}
              onClick={() => navigate('/settlements')}
            >
              <ListItemText primary="List Settlements" />
            </ListItemButton>
            <ListItemButton 
              sx={{ pl: 4 }}
              onClick={() => navigate('/settlements/create')}
            >
              <ListItemText primary="Create Settlement" />
            </ListItemButton>
            <ListItemButton 
              sx={{ pl: 4 }}
              onClick={() => navigate('/settlements/execute')}
            >
              <ListItemText primary="Execute Settlement" />
            </ListItemButton>
          </List>
        </Collapse>
      </List>
    </Box>
  );
} 