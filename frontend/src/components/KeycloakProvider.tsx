import React, { ReactNode, useEffect, useState } from 'react';
import { ReactKeycloakProvider } from '@react-keycloak/web';
import keycloak from '../auth/keycloak';

interface KeycloakProviderProps {
  children: ReactNode;
}

export const KeycloakProvider: React.FC<KeycloakProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);

  const handleOnEvent = (event: string) => {
    if (event === 'onReady') {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div>Loading authentication...</div>;
  }

  return (
    <ReactKeycloakProvider
      authClient={keycloak}
      onEvent={handleOnEvent}
      initOptions={{
        onLoad: 'login-required',
        checkLoginIframe: false
      }}
    >
      {children}
    </ReactKeycloakProvider>
  );
}; 