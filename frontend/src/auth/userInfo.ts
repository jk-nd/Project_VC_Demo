import keycloakInstance from './keycloak';

/**
 * Gets the current user's email from the Keycloak token
 * @returns The email of the currently authenticated user or null if not available
 */
export const getCurrentUserEmail = (): string | null => {
  const parsedToken = keycloakInstance.tokenParsed as any;
  return parsedToken?.email || null;
};

/**
 * Gets the current user's full name from the Keycloak token
 * @returns The full name of the currently authenticated user or null if not available
 */
export const getCurrentUserName = (): string | null => {
  const parsedToken = keycloakInstance.tokenParsed as any;
  return parsedToken?.name || null;
}; 