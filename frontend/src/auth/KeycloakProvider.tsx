import { ReactKeycloakProvider } from '@react-keycloak/web';
import keycloakInstance from './keycloak';
import { ReactNode } from 'react';

interface KeycloakProviderProps {
    children: ReactNode;
}

const KeycloakProvider = ({ children }: KeycloakProviderProps) => {
    const onKeycloakEvent = (event: string, error?: any) => {
        if (error) {
            console.error('Keycloak event error:', event, error);
        }
    };

    const onKeycloakTokens = (tokens: any) => {
        if (tokens.token) {
            localStorage.setItem('token', tokens.token);
        }
    };

    return (
        <ReactKeycloakProvider
            authClient={keycloakInstance}
            onEvent={onKeycloakEvent}
            onTokens={onKeycloakTokens}
            LoadingComponent={<div>Loading...</div>}
            initOptions={{
                onLoad: 'check-sso',
                silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
                pkceMethod: 'S256'
            }}
        >
            {children}
        </ReactKeycloakProvider>
    );
};

export default KeycloakProvider;