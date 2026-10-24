
const express = require('express');
const path = require('path');
const mineflayer = require('mineflayer');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

const SERVER_HOST = process.env.MC_HOST || 'UwU_world.aternos.me';
const SERVER_PORT = Number(process.env.MC_PORT || 30089);
const BOT_USERNAME = process.env.MC_USERNAME || 'KEEPING_ONLINE';

let bot = null;
let online = false;
let reconnectTimer = null;
let reconnectDelay = 15000;
let stopping = false;

function log(...args) {
  console.log(new Date().toISOString(), ...args);
}

function scheduleReconnect() {
  if (stopping || reconnectTimer) return;

  log(`Reconnecting in ${reconnectDelay / 1000}s...`);

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    createBot();
  }, reconnectDelay);

  reconnectDelay = Math.min(reconnectDelay * 1.5, 60000);
}

function createBot() {
  if (stopping || bot) return;

  log(`Connecting to ${SERVER_HOST}:${SERVER_PORT}...`);

  let currentBot;

  try {
    currentBot = mineflayer.createBot({
      host: SERVER_HOST,
      port: SERVER_PORT,
      username: BOT_USERNAME,
      version: false,
      hideErrors: false,
      checkTimeoutInterval: 60000

      // Keep default physics enabled.
      // Do not send artificial movement packets.
    });
  } catch (err) {
    log('Bot creation failed:', err.message);
    scheduleReconnect();
    return;
  }

  bot = currentBot;
  online = false;

  currentBot.on('login', () => {
    log('Bot logged in.');
    reconnectDelay = 15000;
  });

  currentBot.on('spawn', () => {
    if (bot !== currentBot) return;

    online = true;
    log('Bot spawned and is online.');
  });

  currentBot.on('kicked', (reason) => {
    online = false;
    log('Bot kicked:', reason);
  });

  currentBot.on('error', (err) => {
    log('Bot error:', err.message);
  });

  currentBot.on('end', (reason) => {
    online = false;

    if (bot === currentBot) {
      bot = null;
    }

    log('Bot disconnected:', reason || 'connection ended');

    scheduleReconnect();
  });
}

// Web dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Status endpoint
app.get('/status', (req, res) => {
  res.json({
    online: Boolean(bot && online),
    username: BOT_USERNAME,
    host: SERVER_HOST
  });
});

// Send Minecraft chat or command
app.post('/send-chat', (req, res) => {
  const message = req.body?.message;

  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({
      ok: false,
      error: 'Message is required.'
    });
  }

  if (!bot || !online) {
    return res.status(503).json({
      ok: false,
      error: 'Bot is offline.'
    });
  }

  try {
    bot.chat(message.trim());

    return res.json({ ok: true });
  } catch (err) {
    log('Chat send failed:', err.message);

    return res.status(500).json({
      ok: false,
      error: 'Could not send message.'
    });
  }
});

const server = app.listen(PORT, '0.0.0.0', () => {
  log(`Web server listening on port ${PORT}`);
  createBot();
});

function shutdown() {
  if (stopping) return;

  stopping = true;
  online = false;

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  if (bot) {
    const currentBot = bot;
    bot = null;

    try {
      currentBot.quit('Service shutting down');
    } catch (err) {
      log('Shutdown error:', err.message);
    }
  }

  server.close(() => {
    process.exit(0);
  });

  setTimeout(() => process.exit(0), 5000).unref();
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
