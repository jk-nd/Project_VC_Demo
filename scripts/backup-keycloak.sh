#!/bin/bash

# Create backup directory if it doesn't exist
BACKUP_DIR="keycloak-backup"
mkdir -p $BACKUP_DIR

# Get current timestamp for backup file
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Get access token for admin
TOKEN=$(curl -s -X POST "http://localhost:11000/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin" \
  -d "password=Keycloak123!" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" | jq -r .access_token)

# Export realm configuration
echo "Exporting Keycloak configuration..."
curl -s -X GET "http://localhost:11000/admin/realms/projectvc-realm" \
  -H "Authorization: Bearer $TOKEN" \
  > "$BACKUP_DIR/realm_${TIMESTAMP}.json"

# Export users
echo "Exporting users..."
curl -s -X GET "http://localhost:11000/admin/realms/projectvc-realm/users" \
  -H "Authorization: Bearer $TOKEN" \
  > "$BACKUP_DIR/users_${TIMESTAMP}.json"

# Export client configuration
echo "Exporting client configuration..."
curl -s -X GET "http://localhost:11000/admin/realms/projectvc-realm/clients" \
  -H "Authorization: Bearer $TOKEN" \
  > "$BACKUP_DIR/clients_${TIMESTAMP}.json"

echo "Backup completed. Files saved in $BACKUP_DIR/"
echo "- realm_${TIMESTAMP}.json"
echo "- users_${TIMESTAMP}.json"
echo "- clients_${TIMESTAMP}.json" 