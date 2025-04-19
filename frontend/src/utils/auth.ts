// import { useAuth } from '../auth/KeycloakContext';

/**
 * Get the current user's email from the token
 * @returns {Promise<string>} The user's email
 */
export const getUserEmail = async (): Promise<string> => {
  try {
    // Try to get from sessionStorage or localStorage
    const keycloakToken = sessionStorage.getItem('kc-token') || localStorage.getItem('kc-token');
    
    if (keycloakToken) {
      try {
        // Parse the token to get user info
        const tokenData = JSON.parse(atob(keycloakToken.split('.')[1]));
        if (tokenData.email) {
          return tokenData.email;
        }
      } catch (e) {
        console.error('Error parsing token:', e);
      }
    }
    
    // Fallback: Get from the current keycloak session
    // This assumes we're in a component context
    const auth = (window as any).keycloak;
    if (auth && auth.tokenParsed && auth.tokenParsed.email) {
      return auth.tokenParsed.email;
    }
    
    // If we can't get the email, throw an error
    throw new Error('User email not available');
  } catch (error) {
    console.error('Error getting user email:', error);
    throw error;
  }
}; 