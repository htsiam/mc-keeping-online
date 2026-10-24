
const express = require('express');
const path = require('path');
const mineflayer = require('mineflayer');

const app = express();
const PORT = process.env.PORT || 10000;

const MC_HOST = process.env.MC_HOST || 'UwU_world.aternos.me';
const MC_PORT = Number(process.env.MC_PORT || 30089);
const MC_USERNAME = process.env.MC_USERNAME || 'KEEPING_ONLINE';
const RECONNECT_DELAY = 10000;

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

let bot = null;
let online = false;
let reconnectTimer = null;
let stopping = false;

function log(...args) {
  console.log(new Date().toISOString(), ...args);
}

function scheduleReconnect() {
  if (stopping || reconnectTimer) return;

  log('Reconnecting in 10 seconds...');

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    createBot();
  }, RECONNECT_DELAY);
}

function createBot() {
  if (stopping || bot) return;

  log(`Connecting to ${MC_HOST}:${MC_PORT}...`);

  let currentBot;

  try {
    currentBot = mineflayer.createBot({
      host: MC_HOST,
      port: MC_PORT,
      username: MC_USERNAME,
      version: false,
      hideErrors: false,
      checkTimeoutInterval: 60000

      // Default physics remains enabled.
      // No artificial movement packets.
    });
  } catch (err) {
    log('Bot creation error:', err.message);
    scheduleReconnect();
    return;
  }

  bot = currentBot;
  online = false;

  currentBot.on('login', () => {
    if (bot !== currentBot) return;
    log('Bot logged in.');
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

    log('Bot disconnected:', reason || 'Connection ended');
    scheduleReconnect();
  });
}

// Dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Bot status
app.get('/status', (req, res) => {
  res.json({
    online: Boolean(bot && online),
    username: MC_USERNAME,
    host: MC_HOST
  });
});

// Send chat or command
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
    log('Chat error:', err.message);

    return res.status(500).json({
      ok: false,
      error: 'Failed to send message.'
    });
  }
});

// Start web server
const server = app.listen(PORT, '0.0.0.0', () => {
  log(`Web server listening on port ${PORT}`);
  createBot();
});

// Graceful shutdown
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
