import TelegramBot from "node-telegram-bot-api";
import { handle } from "./handlers.js";

export function createBot(token) {
  const bot = new TelegramBot(token, {
    polling: {
      interval: 300,
      autoStart: false,
      params: { timeout: 30 }
    }
  });


  bot.on("message", async (msg) => {
    try {
      await handle(bot, msg);
    } catch (e) {
      console.error("on message error:", e);
    }
  });


  bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
    console.error('Fatal polling error detected. Restarting polling...');
      bot.stopPolling()
        .then(() => startPolling())
        .catch(err => {
          console.error('Error while restarting polling:', err);

        });
    process.exit(1); 
  });

  return bot;
}
