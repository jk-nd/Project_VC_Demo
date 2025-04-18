import { ReactKeycloakProvider } from '@react-keycloak/web';
import { AuthClientEvent, AuthClientError } from '@react-keycloak/core';
import { ReactNode } from 'react';
import keycloak from './keycloak';

interface KeycloakProviderProps {
    children: ReactNode;
}

const KeycloakProvider = ({ children }: KeycloakProviderProps) => {
    const handleOnEvent = (event: AuthClientEvent, error?: AuthClientError) => {
        if (error) {
            console.error('Keycloak event error:', event, error);
        } else {
            console.log('Keycloak event:', event);
        }
    };

    const loadingComponent = <div>Loading authentication...</div>;

    return (
        <ReactKeycloakProvider
            authClient={keycloak}
            onEvent={handleOnEvent}
            LoadingComponent={loadingComponent}
        >
            {children}
        </ReactKeycloakProvider>
    );
};

export default KeycloakProvider;