import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import axios from 'axios';

interface AuthContextType {
  token: string | null;
  initialized: boolean;
  isLoggedIn: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  tokenParsed: any;
  getToken: () => Promise<string | null>;
}

const keycloakConfig = {
  url: 'http://localhost:11000',
  realm: 'projectvc-realm',
  clientId: 'engine-client',
};

// Create the context
const AuthContext = createContext<AuthContextType>({
  token: null,
  initialized: false,
  isLoggedIn: false,
  login: async () => false,
  logout: () => {},
  tokenParsed: null,
  getToken: async () => null,
});

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Parse JWT token
function parseJwt(token: string) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
}

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [initialized, setInitialized] = useState(false);
  const [tokenParsed, setTokenParsed] = useState<any>(null);

  useEffect(() => {
    // Check if we have a token and parse it
    if (token) {
      try {
        const parsed = parseJwt(token);
        setTokenParsed(parsed);
        
        // Check if token is expired
        const currentTime = Math.floor(Date.now() / 1000);
        if (parsed && parsed.exp && parsed.exp < currentTime) {
          console.log('Token expired, clearing');
          localStorage.removeItem('token');
          setToken(null);
          setTokenParsed(null);
        }
      } catch (error) {
        console.error('Error parsing token:', error);
        localStorage.removeItem('token');
        setToken(null);
        setTokenParsed(null);
      }
    }
    
    setInitialized(true);
  }, [token]);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      console.log('Attempting direct login...');
      
      // Build form data
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);
      formData.append('grant_type', 'password');
      formData.append('client_id', keycloakConfig.clientId);
      
      // Make the request to get a token
      const response = await axios.post(
        `${keycloakConfig.url}/realms/${keycloakConfig.realm}/protocol/openid-connect/token`,
        formData.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      if (response.data && response.data.access_token) {
        console.log('Login successful, saving token');
        localStorage.setItem('token', response.data.access_token);
        setToken(response.data.access_token);
        
        const parsed = parseJwt(response.data.access_token);
        setTokenParsed(parsed);
        
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('Login error:', error.response?.data || error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setTokenParsed(null);
  };

  // Get the current token or refresh if needed
  const getToken = async (): Promise<string | null> => {
    if (!token) {
      console.log('No token available');
      return null;
    }
    
    // Check if token is expired
    if (tokenParsed && tokenParsed.exp) {
      const currentTime = Math.floor(Date.now() / 1000);
      // If token expires in less than 30 seconds, consider it expired
      if (tokenParsed.exp - currentTime < 30) {
        console.log('Token is about to expire, refreshing...');
        
        // For now, we'll just use the existing token - in a real app, you'd refresh the token here
        // We would normally use refresh_token, but for this demo we'll just keep using the existing token
        console.log('Using existing token for now');
      }
    }
    
    return token;
  };

  const isLoggedIn = Boolean(token && tokenParsed);

  const value = {
    token,
    initialized,
    isLoggedIn,
    login,
    logout,
    tokenParsed,
    getToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider; 