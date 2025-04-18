#!/bin/bash

echo "Waiting for Keycloak to be ready..."
until curl -s --fail http://keycloak:11000/health/ready; do
    echo "Keycloak is not ready - sleeping 5s"
    sleep 5
done

echo "Keycloak is ready - initializing..."

# Initialize Terraform
terraform init

# Apply Terraform configuration
terraform apply -auto-approve

echo "Keycloak provisioning completed" 