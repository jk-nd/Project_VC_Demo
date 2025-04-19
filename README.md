# Project VC Demo

This project demonstrates a full-stack application for IOU (I Owe You) management with a backend in NPL and a React frontend.

## Features

- **Create IOUs**: Users can create digital IOUs specifying recipient and amount
- **Search Functionality**: Search IOUs by various criteria (issuer, payee, state, amount)
- **Pay IOUs**: Make partial or full payments towards outstanding IOUs
- **Forgive IOUs**: Recipients can forgive debts entirely
- **User Authentication**: Secure login with role-based access control

## Architecture

The project consists of several components:

- **Frontend**: A React application built with Vite, Material UI, and TypeScript
- **Backend**: An NPL engine service running IOU protocols
- **Authentication**: Keycloak for identity management
- **Proxy**: Nginx for routing requests

## Development Setup

### Prerequisites

- Docker and Docker Compose
- Node.js and npm/yarn

### Running the Application

1. Start the backend services:
```bash
docker compose up -d
```

2. Start the frontend development server:
```bash
cd frontend
npm install
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:12000
- Keycloak: http://localhost:80/auth

## API Configuration

The frontend uses Axios for API requests, configured in `frontend/src/services/api.ts`. All API requests are prefixed with `/backend` and are proxied through Vite to the NPL engine.

### Vite Proxy Configuration

The Vite development server is configured to proxy requests to the backend services:

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/backend': {
        target: 'http://localhost:12000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/backend/, '')
      },
      '/auth': {
        target: 'http://localhost:80',
        changeOrigin: true,
      }
    }
  }
})
```

Important notes about the proxy configuration:
1. The `/backend` prefix is used to distinguish API requests from other routes
2. The `rewrite` function removes the `/backend` prefix before forwarding to the engine
3. This setup avoids CORS issues by making all requests appear to come from the same origin
4. The API methods in `api.ts` must include the `/backend` prefix in their paths

## Authentication

The application uses Keycloak for authentication. The configuration is in `frontend/src/auth/KeycloakContext.tsx`.

## NPL IOU Protocol

The backend is powered by NPL (Noumena Protocol Language), which defines the IOU protocol with the following states:
- `unpaid`: Initial state when an IOU is created
- `paid`: Final state when an IOU is fully paid
- `forgiven`: Final state when an IOU is forgiven by the payee

Key permissions include:
- `pay`: Allows the issuer to make payments toward the IOU
- `forgive`: Allows the payee to forgive the IOU
- `getAmountOwed`: Returns the current outstanding amount

## License and Requirements

This demo project is released under MIT license. 

The Noumena NPL components (Engine, Read Model) used in this project require a Noumena Developer License for development and testing purposes. These components are freely available under the NPL RUNTIME DEVELOPER license, but production use would require appropriate Noumena licenses.

For more information about Noumena licensing, visit: https://documentation.noumenadigital.com/licenses/

## Local Development Setup

### Prerequisites
- Docker and Docker Compose
- NPL CLI tools (optional for development)

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
├── frontend/                    # React frontend application
├── keycloak-provisioning/       # Keycloak setup and user provisioning
│   ├── Dockerfile               # Keycloak provisioning container
│   ├── local.sh                 # Provisioning script
│   └── terraform.tf             # Keycloak configuration
├── db_init/                     # Database initialization scripts
│   └── db_init.sh               # Initial database setup
└── README.md                    # This file
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

## Nginx Configuration

The project uses Nginx as a reverse proxy to route traffic between different services. The Nginx configuration is defined in `nginx.conf`:

### Key Features
- Routes frontend requests to the Vite development server
- Proxies API requests to the NPL engine at `/npl/`
- Proxies authentication requests to Keycloak at `/auth/`
- Handles CORS headers for all responses
- Configures proper forwarding of headers for proxied requests

### Running with Docker
The Nginx proxy is configured in `docker-compose.yml` and runs as a container. It maps port 80 from the host to the container and mounts the `nginx.conf` file for configuration.
