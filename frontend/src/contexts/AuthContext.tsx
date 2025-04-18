import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getToken, getTokenParsed, keycloakLogout, getKeycloak } from '../auth/keycloak';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  parsedToken: any | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(getToken() || null);
  const [parsedToken, setParsedToken] = useState<any | null>(getTokenParsed() || null);

  useEffect(() => {
    const keycloak = getKeycloak();

    const updateTokens = () => {
      setToken(keycloak.token || null);
      setParsedToken(keycloak.tokenParsed || null);
    };

    // Set up event listeners for token updates
    keycloak.onTokenExpired = () => {
      keycloak.updateToken(5).then(updateTokens);
    };

    keycloak.onAuthSuccess = updateTokens;
    keycloak.onAuthRefreshSuccess = updateTokens;

    // Initial check
    updateTokens();

    // Check auth state every minute
    const interval = setInterval(() => {
      keycloak.updateToken(5).then(updateTokens);
    }, 60000);

    return () => {
      clearInterval(interval);
      keycloak.onTokenExpired = undefined;
      keycloak.onAuthSuccess = undefined;
      keycloak.onAuthRefreshSuccess = undefined;
    };
  }, []);

  const logout = () => {
    keycloakLogout();
    setToken(null);
    setParsedToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!token,
        token,
        parsedToken,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 