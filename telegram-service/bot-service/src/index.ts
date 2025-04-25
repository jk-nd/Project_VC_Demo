import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import LocalSession from 'telegraf-session-local';
import express, { Request, Response } from 'express';
import { registerCommands } from './commands';
import { setupMiddleware } from './middleware';
import { MyContext } from './middleware';

// Load environment variables
dotenv.config();

// Initialize the bot with typed context
const bot = new Telegraf<MyContext>(process.env.TELEGRAM_BOT_TOKEN || '');

// Set up session storage
const localSession = new LocalSession({ database: 'sessions.json' });
bot.use(localSession.middleware());

// Set up middleware for auth, logging, etc.
setupMiddleware(bot);

// Register bot commands
registerCommands(bot);

// Express server for webhook and health checks
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).send({ status: 'OK' });
});

// Start the bot
if (process.env.NODE_ENV === 'production') {
  // Use webhooks in production
  app.use(bot.webhookCallback('/telegram-webhook'));
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    
    // Set webhook URL
    const webhookUrl = process.env.WEBHOOK_URL;
    if (webhookUrl) {
      bot.telegram.setWebhook(webhookUrl);
      console.log(`Webhook set to ${webhookUrl}`);
    } else {
      console.error('WEBHOOK_URL not set in environment variables');
      process.exit(1);
    }
  });
} else {
  // Use long polling in development
  bot.launch().then(() => {
    console.log('Bot started in polling mode');
  }).catch(err => {
    console.error('Error starting bot:', err);
  });
  
  // Enable graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
} 