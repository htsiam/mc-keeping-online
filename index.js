const express = require('express');
const mineflayer = require('mineflayer');

const HOST = 'UwU_world.aternos.me';
const PORT = 30089;
const USERNAME = 'KEEPING_ONLINE';
const WEB_PORT = process.env.PORT || 10000;

let bot = null;
let reconnectTimer = null;
let afkInterval = null;

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
  const isOnline = bot && bot.entity;
  res.send(`<!DOCTYPE html>
<html>
<head>
  <title>Bot Status</title>
  <meta http-equiv="refresh" content="10">
  <style>
    body { font-family: sans-serif; background: #111; color: #fff; text-align: center; padding-top: 50px; }
    .status { font-size: 24px; font-weight: bold; color: ${isOnline ? '#0f0' : '#f00'}; }
  </style>
</head>
<body>
  <h1>KEEPING_ONLINE Bot</h1>
  <p class="status">${isOnline ? 'ONLINE (Connected)' : 'OFFLINE / Reconnecting...'}</p>
</body>
</html>`);
});

app.listen(WEB_PORT, () => {
  console.log(`Web server running on port ${WEB_PORT}`);
  startBot();
});

function startBot() {
  if (bot) {
    try { bot.removeAllListeners(); bot.quit(); } catch(e){}
    bot = null;
  }
  if (afkInterval) { clearInterval(afkInterval); afkInterval = null; }
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }

  console.log(`Connecting to ${HOST}:${PORT} as ${USERNAME}...`);

  bot = mineflayer.createBot({
    host: HOST,
    port: PORT,
    username: USERNAME,
    checkTimeoutInterval: 60000
  });

  bot.on('spawn', () => {
    console.log('SUCCESS: Bot joined the server!');

    afkInterval = setInterval(() => {
      if (bot && bot.entity) {
        try {
          bot.setControlState('jump', true);
          setTimeout(() => { if (bot) bot.setControlState('jump', false); }, 250);
        } catch(e) {}
      }
    }, 60000);
  });

  bot.on('death', () => {
    console.log('Bot died, respawning...');
    try { bot.respawn(); } catch(e) {}
  });

  bot.on('kicked', (reason) => {
    console.log('Kicked by server:', JSON.stringify(reason));
    reconnect();
  });

  bot.on('end', (reason) => {
    console.log('Disconnected:', reason);
    reconnect();
  });

  bot.on('error', (err) => {
    console.log('Bot error:', err.message);
    reconnect();
  });
}

function reconnect() {
  if (reconnectTimer) return;
  if (afkInterval) { clearInterval(afkInterval); afkInterval = null; }
  
  console.log('Reconnecting in 10 seconds...');
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    startBot();
  }, 10000);
}

process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception:', err.message);
});
