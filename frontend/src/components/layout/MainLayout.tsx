import { useState } from 'react';
import { Box, AppBar, Toolbar, Typography, Button, Container, Paper, Avatar, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import IOUTable from '../iou/IOUTable';

export default function MainLayout() {
    const { logout, parsedToken, isAuthenticated } = useAuth();
    const [expanded, setExpanded] = useState(false);

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

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <AppBar position="static">
                <Toolbar>
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

            <Container component="main" sx={{ mt: 4, mb: 4, flex: 1 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h4" component="h1" gutterBottom>
                            Welcome, {parsedToken.preferred_username || 'User'}!
                        </Typography>
                        <Typography variant="body1" paragraph>
                            You are logged in as a member of {parsedToken.organization || 'the system'}.
                        </Typography>
                        <Typography variant="body1" paragraph>
                            Your email: {parsedToken.email || 'Not provided'}
                        </Typography>
                        {parsedToken.Can_Issue === "true" && (
                            <Typography variant="body1" color="primary" paragraph>
                                You have permission to issue IOUs.
                            </Typography>
                        )}
                    </Paper>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                        <Paper sx={{ p: 3, flex: 1 }}>
                            <Typography variant="h5" gutterBottom>
                                Create New IOU
                            </Typography>
                            <Typography variant="body1" paragraph>
                                Issue a new IOU to another user in the system.
                            </Typography>
                            <Button variant="contained" color="primary">
                                Create IOU
                            </Button>
                        </Paper>
                        <Paper sx={{ p: 3, flex: 1 }}>
                            <Typography variant="h5" gutterBottom>
                                View My IOUs
                            </Typography>
                            <Typography variant="body1" paragraph>
                                View and manage your existing IOUs.
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
                    </Box>
                </Box>
            </Container>
        </Box>
    );
} 