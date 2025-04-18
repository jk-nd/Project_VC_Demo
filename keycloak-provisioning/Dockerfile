FROM hashicorp/terraform:1.7

# Install curl and jq
RUN apk add --no-cache curl jq

# Copy Terraform configurations
COPY . /workspace
WORKDIR /workspace

# Make the script executable
RUN chmod +x local.sh

# Set environment variables
ENV KEYCLOAK_USER=admin \
    KEYCLOAK_PASSWORD=Keycloak123! \
    KEYCLOAK_URL=http://keycloak:11000 \
    TF_VAR_default_password=welcome \
    TF_VAR_app_name=projectvc

# Run the provisioning script
ENTRYPOINT ["/bin/sh"]
CMD ["./local.sh"] 