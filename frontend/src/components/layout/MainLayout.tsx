import { useState } from 'react';
import { Box, AppBar, Toolbar, Typography, Button, Container, Paper, Avatar, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Accordion, AccordionSummary, AccordionDetails, IconButton } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ListIcon from '@mui/icons-material/List';
import AddIcon from '@mui/icons-material/Add';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import IOUTable from '../iou/IOUTable';
import CreateIOUForm from '../iou/CreateIOUForm';

const drawerWidth = 240;
const collapsedDrawerWidth = 73;

export default function MainLayout() {
    const { logout, parsedToken, isAuthenticated } = useAuth();
    const [expanded, setExpanded] = useState(false);
    const [selectedItem, setSelectedItem] = useState('dashboard');
    const [isDrawerOpen, setIsDrawerOpen] = useState(true);

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!parsedToken) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <Typography>Loading user information...</Typography>
            </Box>
        );
    }

    const menuItems = [
        { text: 'Dashboard', icon: <ListIcon />, path: 'dashboard' },
        { text: 'Create IOU', icon: <AddIcon />, path: 'create' },
    ];

    const handleDrawerToggle = () => {
        setIsDrawerOpen(!isDrawerOpen);
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
                            {parsedToken.preferred_username?.[0]?.toUpperCase() || '?'}
                        </Avatar>
                        <Typography variant="body1">
                            {parsedToken.preferred_username || 'Unknown User'}
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
                            Welcome, <span style={{ fontWeight: 'bold' }}>{parsedToken.preferred_username || 'User'}</span>!
                        </Typography>
                        <Typography variant="body1" paragraph>
                            You are logged in as a member of {parsedToken.organization || 'the system'}.
                        </Typography>
                        <Typography variant="body1" paragraph>
                            Your email: {parsedToken.email || 'Not provided'}
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
                                        username: parsedToken.preferred_username,
                                        email: parsedToken.email,
                                        organization: parsedToken.organization || 'Not specified',
                                        company: parsedToken.company || 'Not specified',
                                        department: parsedToken.department || 'Not specified',
                                        canIssue: parsedToken.Can_Issue,
                                        roles: parsedToken.realm_access?.roles || [],
                                        scope: parsedToken.scope,
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
                                    {JSON.stringify(parsedToken, null, 2)}
                                </Paper>
                            </AccordionDetails>
                        </Accordion>
                        {parsedToken.Can_Issue === "true" && (
                            <Typography variant="body1" color="primary" sx={{ mt: 2 }} paragraph>
                                You have permission to issue IOUs.
                            </Typography>
                        )}
                    </Paper>

                    {selectedItem === 'dashboard' && (
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h5" gutterBottom>
                                View My IOUs
                            </Typography>
                            <Accordion 
                                expanded={expanded}
                                onChange={(event, isExpanded) => setExpanded(isExpanded)}
                            >
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    aria-controls="ious-content"
                                    id="ious-header"
                                >
                                    <Typography>View My IOUs</Typography>
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
                                Create New IOU
                            </Typography>
                            <Typography variant="body1" paragraph>
                                Issue a new IOU to another user in the system.
                            </Typography>
                            <CreateIOUForm />
                        </Paper>
                    )}
                </Box>
            </Box>
        </Box>
    );
} 