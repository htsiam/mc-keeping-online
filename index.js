const express = require('express');
const mineflayer = require('mineflayer');

const HOST = 'UwU_world.aternos.me';
const PORT = 30089;
const USERNAME = 'KEEPING_ONLINE';
const WEB_PORT = process.env.PORT || 10000;

let bot = null;
let reconnectTimer = null;

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
  const isOnline = bot && bot.entity;
  res.send(`<!DOCTYPE html>
<html>
<head>
  <title>KEEPING_ONLINE Dashboard</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #121212; color: #fff; text-align: center; padding: 20px; margin: 0; }
    .card { background: #1e1e1e; padding: 25px; border-radius: 12px; display: inline-block; width: 90%; max-width: 450px; box-shadow: 0 8px 20px rgba(0,0,0,0.6); border: 1px solid #333; margin-top: 30px; }
    .status { font-weight: bold; padding: 10px 18px; border-radius: 20px; display: inline-block; margin-bottom: 20px; font-size: 14px; }
    .online { background: #1b5e20; color: #4caf50; border: 1px solid #2e7d32; }
    .offline { background: #b71c1c; color: #ef5350; border: 1px solid #c62828; }
    input[type="text"] { width: 85%; padding: 12px; border-radius: 6px; border: 1px solid #444; background: #2a2a2a; color: #fff; margin-bottom: 15px; font-size: 14px; outline: none; }
    button { padding: 12px 24px; border: none; background: #007bff; color: white; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 14px; }
    button:hover { background: #0056b3; }
  </style>
</head>
<body>
  <div class="card">
    <h2>🤖 KEEPING_ONLINE Console</h2>
    <div class="status ${isOnline ? 'online' : 'offline'}">
      ${isOnline ? '● SERVER CONNECTED' : '○ DISCONNECTED / RECONNECTING'}
    </div>
    <form action="/send-chat" method="POST">
      <input type="text" name="message" placeholder="Type command or chat..." required autocomplete="off">
      <br>
      <button type="submit">Execute / Send</button>
    </form>
  </div>
</body>
</html>`);
});

app.post('/send-chat', (req, res) => {
  const msg = req.body.message;
  if (bot && bot.entity && msg) {
    bot.chat(msg);
  }
  res.redirect('/');
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
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }

  console.log(`Connecting to ${HOST}:${PORT} as ${USERNAME}...`);

  bot = mineflayer.createBot({
    host: HOST,
    port: PORT,
    username: USERNAME,
    physicsEnabled: true,
    checkTimeoutInterval: 60000,
    hideErrors: true
  });

  bot.on('spawn', () => {
    console.log('SUCCESS: Bot joined the server and standing idle!');
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
    if (err.code === 'EPIPE' || err.code === 'ECONNRESET') return;
    console.log('Bot error:', err.message);
    reconnect();
  });
}

function reconnect() {
  if (reconnectTimer) return;
  
  console.log('Reconnecting in 10 seconds...');
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    startBot();
  }, 10000);
}

process.on('uncaughtException', (err) => {
  if (err.code === 'EPIPE' || err.code === 'ECONNRESET') return;
  console.log('Uncaught Exception:', err.message);
});
