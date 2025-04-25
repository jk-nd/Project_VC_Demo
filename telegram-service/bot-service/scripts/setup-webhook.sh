#!/bin/bash

# Enable debug mode to see what's happening
set -x

# Get the absolute path to the .env file
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ENV_FILE="$SCRIPT_DIR/../.env"

echo "Looking for .env file at: $ENV_FILE"

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: .env file not found at $ENV_FILE"
    exit 1
fi

echo "Loading environment variables from $ENV_FILE"
set -o allexport
source "$ENV_FILE"
set +o allexport

echo "TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN:0:5}..."
echo "WEBHOOK_URL: $WEBHOOK_URL"

# More robust token validation - check for standard Telegram bot token format
if [[ ! "$TELEGRAM_BOT_TOKEN" =~ ^[0-9]+:[A-Za-z0-9_-]{35}$ ]]; then
    echo "Error: TELEGRAM_BOT_TOKEN appears to be invalid. It should be in the format 'number:alphanumeric_string'"
    exit 1
fi

if [ -z "$WEBHOOK_URL" ]; then
    echo "Error: WEBHOOK_URL is not set in .env file"
    exit 1
fi

# Remove any existing webhook
echo "Removing existing webhook..."
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/deleteWebhook"
echo

# Set the new webhook
echo "Setting webhook to: $WEBHOOK_URL"
RESPONSE=$(curl -s -X POST \
    "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
    -H "Content-Type: application/json" \
    -d "{\"url\": \"$WEBHOOK_URL\"}")

echo "Response: $RESPONSE"

# Check webhook info
echo -e "\nChecking webhook info:"
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getWebhookInfo"
echo

echo -e "\nWebhook setup complete!" 