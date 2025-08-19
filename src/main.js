import dotenv from "dotenv";
dotenv.config();

import { createBot } from "./bot.js";
import { pool } from "./db.js";

const token = process.env.TELEGRAM_TOKEN;
if (!token) {
  console.error("TELEGRAM_TOKEN is missing in .env");
  process.exit(1);
}

const bot = createBot(token);

(async () => {
  try {
    await pool.query("select 1");
    console.log("✅ Postgres OK");

    await bot.startPolling();
    console.log("🤖 Bot polling started");
  } catch (e) {
    console.error("Startup error:", e);
    process.exit(1);
  }
})();

async function shutdown(signal) {
  console.log(`\n${signal}: stopping...`);
  try {
    await bot.stopPolling();
    await pool.end();
    console.log("✅ Graceful shutdown complete");
  } catch (e) {
    console.error("Shutdown error:", e);
  } finally {
    process.exit(0);
  }
}

["SIGINT", "SIGTERM"].forEach((sig) => {
  process.on(sig, () => shutdown(sig));
});
