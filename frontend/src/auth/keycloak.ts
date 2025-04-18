import Keycloak from 'keycloak-js';

const keycloakConfig = {
    url: 'http://localhost:11000',
    realm: 'projectvc-realm',
    clientId: 'engine-client',
    'public-client': true,
    'confidential-port': 0,
    'enable-cors': true,
    'ssl-required': 'external',
    'verify-token-audience': true
};

const keycloak = new Keycloak(keycloakConfig);

// Initialize options
export const initOptions = {
    onLoad: 'login-required',
    checkLoginIframe: false,
    responseMode: 'fragment',
    flow: 'standard',
    pkceMethod: 'S256',
    redirectUri: 'http://localhost:5173/',
    enableLogging: true,
    scope: 'openid profile email',
    credentials: {
        sameSite: 'lax'
    },
    silentCheckSsoRedirectUri: 'http://localhost:5173/silent-check-sso.html'
};

// Configure Keycloak to handle tokens
keycloak.onTokenExpired = () => {
    keycloak.updateToken(70).catch(() => {
        console.log('Failed to refresh token');
    });
};

// Add error handling
keycloak.onAuthError = (error) => {
    console.error('Keycloak auth error:', error);
};

keycloak.onAuthLogout = () => {
    console.log('User logged out');
};

export default keycloak; 