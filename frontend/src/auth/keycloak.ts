import Keycloak from 'keycloak-js';

const keycloakConfig = {
    url: 'http://localhost:11000',
    realm: 'projectvc-realm',
    clientId: 'engine-client',
    'public-client': true,
    'confidential-port': 0
};

// Create a single instance of Keycloak without initializing it
const keycloakInstance = new Keycloak(keycloakConfig);

export const getToken = () => {
    return keycloakInstance.token;
};

export const getParsedToken = () => {
    return keycloakInstance.tokenParsed;
};

export const directLogin = async (username: string, password: string) => {
    try {
        // Use loginHint since direct username/password login isn't supported in this way
        const response = await keycloakInstance.login({
            loginHint: username,
            redirectUri: window.location.origin
        });
        return response;
    } catch (error) {
        console.error('Login error:', error);
        return false;
    }
};

export const logout = () => {
    keycloakInstance.logout();
};

// Export the single instance
export default keycloakInstance; 