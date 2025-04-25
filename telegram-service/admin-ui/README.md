# NPL Telegram Admin UI

A web-based admin interface for managing the NPL Telegram bot integration.

## Features

- Dashboard with key metrics
- User management
- Workflow monitoring
- Bot configuration

## Tech Stack

- **Next.js**: React framework with server-side rendering
- **Mantine**: UI component library
- **React Query**: Data fetching and state management
- **TypeScript**: Type safety

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm or yarn
- Access to an NPL Engine instance with Keycloak

### Installation

1. Clone the repository
2. Copy `.env.example` to `.env` and configure it with your settings
3. Install dependencies:

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The admin UI will be available at http://localhost:3001.

### Build for Production

```bash
npm run build
```

### Start in Production

```bash
npm start
```

## Docker

Build the Docker image:

```bash
docker build -t npl-telegram-admin .
```

Run the Docker container:

```bash
docker run -p 3001:3001 --env-file .env npl-telegram-admin
```

## Architecture

The admin UI is built with the following components:

- **Next.js App Router**: For routing and server-side rendering
- **React Query**: For data fetching and caching
- **Mantine**: For UI components and styling
- **Authentication**: Integration with Keycloak for secure access

## License

This project is licensed under the Apache License 2.0 - see the LICENSE file for details. 