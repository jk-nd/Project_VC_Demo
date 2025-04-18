# Project VC Demo

A vibe coding workflow implementation using NPL (Noumena Protocol Language) for backend workflow and business process management.

## Local Development Setup

### Prerequisites
- Docker and Docker Compose
- NPL CLI tools
- Maven

### Getting Started

1. Start the local development environment:
```bash
docker compose up --build
```

2. Access the services:
- NPL Engine: http://localhost:12000
- Keycloak Admin Console: http://localhost:11000
- Read Model: http://localhost:5555
- PostgreSQL: localhost:5432

3. Authentication:
- Default users are provisioned with the following credentials:
  - Alice: username: `alice`, password: `alice`
  - Bob: username: `bob`, password: `bob`
  - Charlie: username: `charlie`, password: `charlie`
- To get an access token, use the following endpoint:
  ```bash
  curl -X POST 'http://localhost:11000/realms/projectvc-realm/protocol/openid-connect/token' \
    -H 'Content-Type: application/x-www-form-urlencoded' \
    -d 'grant_type=password' \
    -d 'client_id=engine-client' \
    -d 'username=alice' \
    -d 'password=alice'
  ```

### Project Structure

```
.
├── docker-compose.yml           # Docker configuration
├── keycloak-provisioning/      # Keycloak setup and user provisioning
│   ├── Dockerfile             # Keycloak provisioning container
│   ├── local.sh              # Provisioning script
│   └── terraform.tf          # Keycloak configuration
├── db_init/                   # Database initialization scripts
│   └── db_init.sh            # Initial database setup
└── README.md                 # This file
```

## Backend Components

The backend consists of several key components:

1. **NPL Engine**: Handles all business logic and workflow management
   - Port: 12000
   - Swagger UI: http://localhost:12000/swagger-ui/

2. **Keycloak**: Manages authentication and authorization
   - Port: 11000
   - Admin Console: http://localhost:11000
   - Realm: projectvc-realm
   - Client: engine-client

3. **Read Model**: Provides GraphQL interface for data access
   - Port: 5555
   - GraphQL Playground: http://localhost:5555/graphiql

4. **PostgreSQL**: Stores protocol state and data
   - Port: 5432
   - Database: engine

## Authentication and Authorization

The system uses Keycloak for authentication and authorization:
- OIDC client: engine-client
- Realm: projectvc-realm
- Users are provisioned with organization-specific attributes
- Access tokens are required for API access

## API Documentation

The NPL Engine exposes REST APIs for:
- Product management
- Order processing
- User management
- Workflow state management

Detailed API documentation is available at http://localhost:12000/swagger-ui/ once the services are running.
