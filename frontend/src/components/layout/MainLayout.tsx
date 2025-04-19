import { useState } from 'react';
import { Box, AppBar, Toolbar, Typography, Button, Paper, Avatar, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Accordion, AccordionSummary, AccordionDetails, IconButton } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ListIcon from '@mui/icons-material/List';
import AddIcon from '@mui/icons-material/Add';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import CancelIcon from '@mui/icons-material/Cancel';
import PaymentIcon from '@mui/icons-material/Payment';
import { useAuth } from '../../auth/KeycloakContext';
import { Navigate } from 'react-router-dom';
import IOUTable from '../iou/IOUTable';
import CreateIOU from '../iou/CreateIOU';
import ForgiveIOUScreen from '../iou/ForgiveIOUScreen';
import PayIOUScreen from '../iou/PayIOUScreen';

const drawerWidth = 240;
const collapsedDrawerWidth = 73;

export default function MainLayout() {
    const { logout, tokenParsed, isLoggedIn } = useAuth();
    const [expanded, setExpanded] = useState(false);
    const [selectedItem, setSelectedItem] = useState('overview');
    const [isDrawerOpen, setIsDrawerOpen] = useState(true);

    if (!isLoggedIn) {
        return <Navigate to="/login" replace />;
    }

    if (!tokenParsed) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <Typography>Loading user information...</Typography>
            </Box>
        );
    }

    const menuItems = [
        { text: 'Overview', icon: <ListIcon />, path: 'overview' },
        { text: 'Create IOU', icon: <AddIcon />, path: 'create' },
        { text: 'Pay IOU', icon: <PaymentIcon />, path: 'pay' },
        { text: 'Forgive IOU', icon: <CancelIcon />, path: 'forgive' },
    ];

    const handleDrawerToggle = () => {
        setIsDrawerOpen(!isDrawerOpen);
    };

    // Get initials from username or email
    const getUserInitials = () => {
        if (tokenParsed.preferred_username) {
            return tokenParsed.preferred_username[0]?.toUpperCase() || '?';
        }
        if (tokenParsed.email) {
            return tokenParsed.email[0]?.toUpperCase() || '?';
        }
        return '?';
    };

    // Get display name
    const getDisplayName = () => {
        return tokenParsed.preferred_username || tokenParsed.email || 'Unknown User';
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2 }}
                    >
                        {isDrawerOpen ? <ChevronLeftIcon /> : <MenuIcon />}
                    </IconButton>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        IOU Management System
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'secondary.main' }}>
                            {getUserInitials()}
                        </Avatar>
                        <Typography variant="body1">
                            {getDisplayName()}
                        </Typography>
                        <Button color="inherit" onClick={logout}>
                            Logout
                        </Button>
                    </Box>
                </Toolbar>
            </AppBar>

            <Drawer
                variant="permanent"
                sx={{
                    width: isDrawerOpen ? drawerWidth : collapsedDrawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: isDrawerOpen ? drawerWidth : collapsedDrawerWidth,
                        boxSizing: 'border-box',
                        marginTop: '64px', // Height of AppBar
                        transition: 'width 0.3s ease',
                        overflowX: 'hidden',
                    },
                }}
            >
                <List>
                    {menuItems.map((item) => (
                        <ListItemButton 
                            key={item.path}
                            selected={selectedItem === item.path}
                            onClick={() => setSelectedItem(item.path)}
                            sx={{
                                minHeight: 48,
                                justifyContent: isDrawerOpen ? 'initial' : 'center',
                                px: 2.5,
                            }}
                        >
                            <ListItemIcon
                                sx={{
                                    minWidth: 0,
                                    mr: isDrawerOpen ? 3 : 'auto',
                                    justifyContent: 'center',
                                }}
                            >
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText 
                                primary={item.text} 
                                sx={{ 
                                    opacity: isDrawerOpen ? 1 : 0,
                                    transition: 'opacity 0.3s ease',
                                }} 
                            />
                        </ListItemButton>
                    ))}
                </List>
            </Drawer>

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { sm: `calc(100% - ${isDrawerOpen ? drawerWidth : collapsedDrawerWidth}px)` },
                    marginTop: '64px', // Height of AppBar
                    transition: 'width 0.3s ease',
                }}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h4" component="h1" gutterBottom>
                            Welcome, <span style={{ fontWeight: 'bold' }}>{getDisplayName()}</span>!
                        </Typography>
                        <Typography variant="body1" paragraph>
                            You are logged in as a member of {tokenParsed.organization || 'the system'}.
                        </Typography>
                        <Typography variant="body1" paragraph>
                            Your email: {tokenParsed.email || 'Not provided'}
                        </Typography>
                        <Accordion 
                            sx={{ 
                                mt: 2,
                                '& .MuiAccordionDetails-root': {
                                    p: 0
                                }
                            }}
                        >
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                                aria-controls="claims-content"
                                id="claims-header"
                            >
                                <Typography variant="subtitle2">Your Active Claims</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Paper 
                                    variant="outlined" 
                                    sx={{ 
                                        p: 2,
                                        backgroundColor: 'grey.100',
                                        fontFamily: 'monospace',
                                        fontSize: '0.875rem',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-all'
                                    }}
                                >
                                    {JSON.stringify({
                                        username: tokenParsed.preferred_username,
                                        email: tokenParsed.email,
                                        organization: tokenParsed.organization || 'Not specified',
                                        company: tokenParsed.company || 'Not specified',
                                        department: tokenParsed.department || 'Not specified',
                                        canIssue: tokenParsed.Can_Issue,
                                        roles: tokenParsed.realm_access?.roles || [],
                                        scope: tokenParsed.scope,
                                    }, null, 2)}
                                </Paper>
                            </AccordionDetails>
                        </Accordion>
                        <Accordion 
                            sx={{ 
                                mt: 2,
                                '& .MuiAccordionDetails-root': {
                                    p: 0
                                }
                            }}
                        >
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                                aria-controls="jwt-content"
                                id="jwt-header"
                            >
                                <Typography variant="subtitle2">JWT Token Details</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Paper 
                                    variant="outlined" 
                                    sx={{ 
                                        p: 2,
                                        backgroundColor: 'grey.100',
                                        fontFamily: 'monospace',
                                        fontSize: '0.875rem',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-all'
                                    }}
                                >
                                    {JSON.stringify(tokenParsed, null, 2)}
                                </Paper>
                            </AccordionDetails>
                        </Accordion>
                        {tokenParsed.Can_Issue === "true" && (
                            <Typography variant="body1" color="primary" sx={{ mt: 2 }} paragraph>
                                You have permission to issue IOUs.
                            </Typography>
                        )}
                    </Paper>

                    {selectedItem === 'overview' && (
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h5" gutterBottom>
                                View My IOUs
                            </Typography>
                            <Accordion 
                                expanded={expanded}
                                onChange={(_, isExpanded) => setExpanded(isExpanded)}
                            >
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    aria-controls="ious-content"
                                    id="ious-header"
                                >
                                    <Typography>Overview</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    {expanded && <IOUTable />}
                                </AccordionDetails>
                            </Accordion>
                        </Paper>
                    )}

                    {selectedItem === 'create' && (
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h5" gutterBottom>
                                Create a New IOU
                            </Typography>
                            <CreateIOU />
                        </Paper>
                    )}

                    {selectedItem === 'pay' && (
                        <Paper sx={{ p: 3 }}>
                            <PayIOUScreen />
                        </Paper>
                    )}

                    {selectedItem === 'forgive' && (
                        <Paper sx={{ p: 3 }}>
                            <ForgiveIOUScreen />
                        </Paper>
                    )}
                </Box>
            </Box>
        </Box>
    );
} 