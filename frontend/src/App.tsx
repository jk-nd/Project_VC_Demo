import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CircularProgress, Box } from '@mui/material';
import { ReactKeycloakProvider } from '@react-keycloak/web';
import Layout from './components/Layout';
import IOUList from './components/iou/IOUList';
import IOUCreate from './components/iou/IOUCreate';
import keycloak, { initOptions } from './auth/keycloak';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// Loading component
const LoadingComponent = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <CircularProgress />
  </Box>
);

function App() {
  const eventLogger = (event: unknown, error: unknown) => {
    console.log('onKeycloakEvent', event, error);
  };

  const tokenLogger = (tokens: unknown) => {
    console.log('onKeycloakTokens', tokens);
  };

  return (
    <ReactKeycloakProvider
      authClient={keycloak}
      initOptions={initOptions}
      LoadingComponent={<LoadingComponent />}
      onEvent={eventLogger}
      onTokens={tokenLogger}
    >
      <ThemeProvider theme={theme}>
        <Router>
          <Layout>
            <Routes>
              <Route path="/ious" element={<IOUList />} />
              <Route path="/ious/create" element={<IOUCreate />} />
              <Route path="/" element={<IOUList />} />
            </Routes>
          </Layout>
        </Router>
      </ThemeProvider>
    </ReactKeycloakProvider>
  );
}

export default App;
