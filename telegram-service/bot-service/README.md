# NPL Telegram Bot

A Telegram bot that integrates with NPL workflows, allowing users to interact with NPL protocols through Telegram.

## Features

- Authentication with Keycloak
- Create and manage IOUs
- View workflow status
- Receive notifications about workflow events

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm or yarn
- A Telegram bot token (get it from [@BotFather](https://t.me/botfather))
- Access to an NPL Engine instance with Keycloak

### Installation

1. Clone the repository
2. Copy `.env.example` to `.env` and configure it with your settings
3. Install dependencies

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

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
docker build -t npl-telegram-bot .
```

Run the Docker container:

```bash
docker run -p 3000:3000 --env-file .env npl-telegram-bot
```

## Usage

Once the bot is running, users can interact with it using the following commands:

- `/start` - Start the bot
- `/login` - Link Telegram account to NPL identity
- `/workflows` - List available workflows
- `/iou` - Create a new IOU
- `/myious` - List your IOUs
- `/help` - Show help message

## Architecture

The bot consists of the following components:

- Telegram Bot API integration using Telegraf
- Authentication service for Keycloak integration
- NPL Engine client for workflow interaction
- Session management for user state

## License

This project is licensed under the Apache License 2.0 - see the LICENSE file for details. 