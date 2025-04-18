#!/bin/bash

echo "Waiting for Keycloak to be ready..."
until curl -s --fail http://keycloak:11000/health/ready; do
    echo "Keycloak is not ready - sleeping 5s"
    sleep 5
done

echo "Waiting for Keycloak master realm to be accessible..."
until curl -s --fail -X POST "http://keycloak:11000/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin" \
  -d "password=Keycloak123!" \
  -d "grant_type=password" \
  -d "client_id=admin-cli"; do
    echo "Keycloak master realm is not ready - sleeping 5s"
    sleep 5
done

echo "Keycloak is ready - initializing..."

# Initialize Terraform
terraform init

# Apply Terraform configuration
terraform apply -auto-approve

echo "Keycloak provisioning completed" 