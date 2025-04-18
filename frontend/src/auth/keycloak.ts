import Keycloak from 'keycloak-js';

const keycloakConfig = {
    url: '/auth',
    realm: 'projectvc-realm',
    clientId: 'engine-client'
};

let keycloakInstance: Keycloak | null = null;

export const getKeycloak = () => {
    if (!keycloakInstance) {
        keycloakInstance = new Keycloak(keycloakConfig);
    }
    return keycloakInstance;
};

export const getToken = () => {
    return getKeycloak().token;
};

export const getParsedToken = () => {
    return getKeycloak().tokenParsed;
};

export const keycloakLogout = () => {
    return getKeycloak().logout();
};

export const directLogin = async (username: string, password: string) => {
    try {
        const keycloak = getKeycloak();
        if (!keycloak.authenticated) {
            await keycloak.init({
                onLoad: 'check-sso',
                checkLoginIframe: false,
                flow: 'standard'
            });
        }

        await keycloak.login({
            loginHint: username
        });

        // If we get here, login was successful
        return {
            token: keycloak.token,
            tokenParsed: keycloak.tokenParsed,
            refreshToken: keycloak.refreshToken,
            idToken: keycloak.idToken
        };
    } catch (error) {
        console.error('Keycloak initialization error:', error);
        throw error;
    }
};

export interface LoginResponse {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    refresh_expires_in: number;
    token_type: string;
}

export async function initKeycloak(): Promise<boolean> {
    try {
        const keycloak = getKeycloak();
        if (!keycloak.authenticated) {
            const authenticated = await keycloak.init({
                onLoad: 'check-sso',
                checkLoginIframe: false,
                flow: 'standard'
            });

            if (!authenticated) {
                await keycloak.login();
            }
        }

        return true;
    } catch (error) {
        console.error('Keycloak initialization error:', error);
        return false;
    }
}

export async function refreshToken(): Promise<boolean> {
    try {
        return await getKeycloak().updateToken(5);
    } catch (error) {
        return false;
    }
}

export function logout(): void {
    keycloakLogout();
}

export function getTokenParsed(): any | undefined {
    return getParsedToken();
}

export default getKeycloak; 