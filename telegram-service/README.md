# NPL Telegram Integration

A comprehensive integration between Telegram and NPL workflows, allowing users to interact with NPL protocols through Telegram.

## Components

This project consists of two main components:

1. **Bot Service**: A Telegram bot that integrates with NPL Engine, allowing users to interact with workflows through Telegram.
2. **Admin UI**: A web interface for managing the Telegram bot, built with Next.js, React Query, and Mantine.

## Architecture

The telegram integration consists of the following components:

- **Telegram Bot**: Built with Telegraf.js to handle Telegram API interactions
- **NPL Engine Integration**: Uses the NPL Engine API to interact with workflows
- **Authentication**: Integrates with Keycloak for secure authentication
- **Admin UI**: Provides management interface for the bot

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm or yarn
- Docker and Docker Compose (for containerized deployment)
- A Telegram bot token (get it from [@BotFather](https://t.me/botfather))
- Access to an NPL Engine instance with Keycloak

### Installation

1. Clone the repository
2. Set up the components:

```bash
# Install all dependencies
npm install

# Configure the Bot Service
cp bot-service/.env.example bot-service/.env
# Edit .env with your settings
```

### Development

Start both services in development mode:

```bash
npm run dev
```

Or start individual services:

```bash
# Start only the bot service
npm run dev:bot

# Start only the admin UI
npm run dev:admin
```

### Building and Running in Production

Build all services:

```bash
npm run build
```

Start in production:

```bash
# Start all services using Docker
docker-compose up -d
```

## Usage

Once the services are running, users can interact with the Telegram bot using commands like:

- `/start` - Start the bot
- `/login` - Authenticate with NPL
- `/workflows` - List available workflows
- `/iou` - Manage IOUs

Administrators can access the admin UI to:
- Monitor bot usage
- Configure workflows
- Manage users

## License

This project is licensed under the Apache License 2.0 - see the LICENSE file for details. 