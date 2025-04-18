import { Button, Box, Typography } from '@mui/material';
import { useKeycloak } from '@react-keycloak/web';

const LoginStatus = () => {
  const { keycloak, initialized } = useKeycloak();

  if (!initialized) {
    return <div>Loading...</div>;
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {keycloak.authenticated ? (
        <>
          <Typography>
            Welcome, {keycloak.tokenParsed?.preferred_username}
          </Typography>
          <Button 
            color="inherit" 
            onClick={() => keycloak.logout()}
          >
            Logout
          </Button>
        </>
      ) : (
        <Button 
          color="inherit" 
          onClick={() => keycloak.login()}
        >
          Login
        </Button>
      )}
    </Box>
  );
};

export default LoginStatus; 