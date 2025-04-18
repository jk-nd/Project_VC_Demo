#!/bin/bash

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "Error: .env file not found"
    exit 1
fi

# Function to get token
get_token() {
    local username=$1
    local password=$2
    
    # Get the full token response
    local response=$(curl -s "${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token" \
        -d "username=${username}" \
        -d "password=${password}" \
        -d "grant_type=password" \
        -d "client_id=${KEYCLOAK_CLIENT_ID}" \
        -d "client_secret=${KEYCLOAK_CLIENT_SECRET}")
    
    # Extract just the access token
    echo "$response" | jq -r .access_token
}

# Export the function
export -f get_token 