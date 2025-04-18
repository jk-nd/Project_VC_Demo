#!/bin/bash
set -e  # Exit on error

# Default configuration
KEYCLOAK_URL=${KEYCLOAK_URL:-"http://localhost:11000"}
KEYCLOAK_ADMIN=${KEYCLOAK_ADMIN:-"admin"}
KEYCLOAK_PASSWORD=${KEYCLOAK_PASSWORD:-"Keycloak123!"}
REALM_NAME=${REALM_NAME:-"project-vc"}
CLIENT_ID=${CLIENT_ID:-"engine-client"}
CLIENT_SECRET=${CLIENT_SECRET:-"engine-client-secret"}

# Function to check if a command exists
check_command() {
    if ! command -v "$1" &> /dev/null; then
        echo "Error: $1 is required but not installed."
        exit 1
    fi
}

# Check required commands
check_command curl
check_command jq

# Wait for Keycloak to be ready
echo "Waiting for Keycloak to be ready..."
until curl -s -f -o /dev/null "${KEYCLOAK_URL}/health/ready"; do
    echo "Waiting for Keycloak..."
    sleep 5
done

# Get admin access token
echo "Getting admin access token..."
TOKEN=$(curl -s -X POST "${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=${KEYCLOAK_ADMIN}" \
    -d "password=${KEYCLOAK_PASSWORD}" \
    -d "grant_type=password" \
    -d "client_id=admin-cli" | jq -r '.access_token')

if [ -z "$TOKEN" ]; then
    echo "Error: Failed to get admin token"
    exit 1
fi

# Create realm
echo "Creating realm ${REALM_NAME}..."
curl -s -X POST "${KEYCLOAK_URL}/admin/realms" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
        \"realm\": \"${REALM_NAME}\",
        \"enabled\": true,
        \"displayName\": \"Project VC\",
        \"registrationAllowed\": false,
        \"loginWithEmailAllowed\": false,
        \"duplicateEmailsAllowed\": false,
        \"resetPasswordAllowed\": false,
        \"editUsernameAllowed\": false,
        \"bruteForceProtected\": true
    }"

# Create client
echo "Creating client ${CLIENT_ID}..."
curl -s -X POST "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
        \"clientId\": \"${CLIENT_ID}\",
        \"enabled\": true,
        \"publicClient\": false,
        \"redirectUris\": [\"http://engine:12000/*\"],
        \"webOrigins\": [\"http://engine:12000\"],
        \"protocol\": \"openid-connect\",
        \"attributes\": {
            \"access.token.lifespan\": \"3600\"
        },
        \"clientAuthenticatorType\": \"client-secret\",
        \"secret\": \"${CLIENT_SECRET}\",
        \"serviceAccountsEnabled\": true
    }"

# Create test users
echo "Creating test users..."
for username in alice bob; do
    echo "Creating user ${username}..."
    curl -s -X POST "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"username\": \"${username}\",
            \"enabled\": true,
            \"credentials\": [{
                \"type\": \"password\",
                \"value\": \"${username}\",
                \"temporary\": false
            }]
        }"
done

echo "Keycloak setup completed successfully!" 