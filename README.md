# Project VC

A venture capital workflow implementation using NPL (Noumena Protocol Language) for backend workflow and business process management.

## Local Development Setup

### Prerequisites
- Docker and Docker Compose
- NPL CLI tools
- Maven

### Getting Started

1. Start the local development environment:
```bash
docker-compose up -d
```

2. Access the services:
- NPL Engine: http://localhost:8081
- Keycloak Admin Console: http://localhost:8080
- PostgreSQL: localhost:5432

3. Build the NPL protocols:
```bash
mvn clean install
```

### Project Structure

```
.
├── docker-compose.yml    # Docker configuration
├── pom.xml              # Maven configuration
├── src/                 # Source code
│   └── main/
│       └── npl-1.0/    # NPL protocol definitions
│           ├── products/  # Product management protocols
│           ├── orders/    # Order processing protocols
│           └── users/     # User management protocols
└── README.md           # This file
```

## Backend Components

The backend consists of several key components:

1. **NPL Engine**: Handles all business logic and workflow management
2. **Keycloak**: Manages authentication and authorization
3. **PostgreSQL**: Stores protocol state and data

## NPL Protocols

### Product Protocol
- Manages product lifecycle (draft, active, inactive, outOfStock)
- Handles product creation, updates, and stock management
- Admin permissions for product management

### Order Protocol
- Manages order lifecycle (created, processing, shipped, delivered, cancelled)
- Handles order creation, shipping, delivery, and cancellation
- Customer and admin permissions for order management

### User Protocol
- Manages user lifecycle (pending, active, inactive)
- Handles user activation, deactivation, and updates
- Admin permissions for user management

## API Documentation

The NPL Engine exposes REST APIs for:
- Product management
- Order processing
- User management
- Workflow state management

Detailed API documentation will be available at http://localhost:8081/swagger-ui.html once the services are running. # Project_VC_Demo
