import { Context, Middleware } from 'telegraf';
import { Update, Message } from 'telegraf/typings/core/types/typegram';

// Define the session structure
export interface BotSession {
  authToken?: string;
  username?: string;
  isAuthenticated: boolean;
}

// Extend the Context type to include our session
export interface MyContext extends Context {
  session: BotSession;
}

/**
 * Set up middleware for the bot
 */
export function setupMiddleware(bot: any): void {
  // Log all messages
  bot.use((ctx: MyContext, next: () => Promise<void>) => {
    if (ctx.message && 'text' in ctx.message) {
      console.log(`[${ctx.from?.username || 'Unknown'}]: ${ctx.message.text}`);
    }
    return next();
  });

  // Initialize session if it doesn't exist
  bot.use((ctx: MyContext, next: () => Promise<void>) => {
    if (!ctx.session) {
      ctx.session = {
        isAuthenticated: false,
      };
    }
    return next();
  });
}