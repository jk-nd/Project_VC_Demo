import { Telegraf } from 'telegraf';
import { nplService, IOU } from './services';
import { MyContext } from './middleware';

/**
 * Register all bot commands
 */
export function registerCommands(bot: Telegraf<MyContext>): void {
  // Help command
  bot.help((ctx) => {
    ctx.reply(
      'Welcome to NPL Workflow Bot!\n\n' +
      'Available commands:\n' +
      '/start - Start the bot\n' +
      '/login - Link your Telegram account to your Keycloak account\n' +
      '/workflows - List available workflows\n' +
      '/iou - Create a new IOU\n' +
      '/myious - List your IOUs\n' +
      '/help - Show this help message'
    );
  });

  // Start command
  bot.start((ctx) => {
    ctx.reply(
      'Welcome to the NPL Workflow Bot! 🤖\n\n' +
      'This bot allows you to interact with NPL workflows through Telegram.\n\n' +
      'To get started, use /login to link your Telegram account with your NPL identity.\n\n' +
      'Type /help to see all available commands.'
    );
  });

  // Login command
  bot.command('login', (ctx) => {
    ctx.reply(
      'To link your Telegram account with your NPL identity, please provide your credentials in this format:\n\n' +
      '/login username password\n\n' +
      'For example: /login alice alice'
    );
  });

  // Handle login with credentials
  bot.hears(/^\/login (\S+) (\S+)$/, async (ctx) => {
    const username = ctx.match[1];
    const password = ctx.match[2];
    
    try {
      const token = await nplService.authenticate(username, password);
      
      // Store token in session
      ctx.session.authToken = token;
      ctx.session.username = username;
      ctx.session.isAuthenticated = true;
      
      ctx.reply(`Successfully logged in as ${username}! You can now use the NPL workflows.`);
    } catch (error) {
      ctx.reply('Authentication failed. Please check your credentials and try again.');
    }
  });

  // List available workflows
  bot.command('workflows', (ctx) => {
    if (!ctx.session.authToken) {
      return ctx.reply('Please log in first using /login');
    }

    ctx.reply(
      'Available workflows:\n\n' +
      '1. IOU Management - Create and manage IOUs\n' +
      '   Commands: /iou, /myious\n\n' +
      '2. More workflows coming soon!'
    );
  });

  // Create IOU command
  bot.command('iou', (ctx) => {
    if (!ctx.session.authToken) {
      return ctx.reply('Please log in first using /login');
    }

    ctx.reply(
      'To create a new IOU, please provide the details in this format:\n\n' +
      '/iou <recipient> <amount> <description>\n\n' +
      'For example: /iou bob 100 "Lunch payment"'
    );
  });

  // Handle IOU creation
  bot.hears(/^\/iou (\S+) (\d+) (.+)$/, async (ctx) => {
    if (!ctx.session.authToken) {
      return ctx.reply('Please log in first using /login');
    }

    const recipient = ctx.match[1];
    const amount = parseInt(ctx.match[2], 10);
    const description = ctx.match[3];

    try {
      await nplService.createIOU(
        ctx.session.authToken,
        recipient,
        amount,
        description
      );
      
      ctx.reply(`Successfully created an IOU for ${recipient} with amount ${amount}`);
    } catch (error) {
      ctx.reply('Failed to create IOU. Please try again later.');
    }
  });

  // List my IOUs
  bot.command('myious', async (ctx) => {
    if (!ctx.session.authToken) {
      return ctx.reply('Please log in first using /login');
    }

    try {
      const ious = await nplService.getMyIOUs(ctx.session.authToken);
      
      if (ious.length === 0) {
        ctx.reply('You don\'t have any IOUs yet.');
        return;
      }

      let message = 'Your IOUs:\n\n';
      ious.forEach((iou: IOU, index: number) => {
        message += `${index + 1}. ${iou.description}\n`;
        message += `   Amount: ${iou.amount}\n`;
        message += `   Status: ${iou.status}\n`;
        if (iou.recipientEmail === ctx.session.username) {
          message += `   From: ${iou.issuerEmail}\n`;
        } else {
          message += `   To: ${iou.recipientEmail}\n`;
        }
        message += '\n';
      });

      ctx.reply(message);
    } catch (error) {
      ctx.reply('Failed to retrieve your IOUs. Please try again later.');
    }
  });
} 