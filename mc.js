const express = require('express');
const path = require('path');
const mineflayer = require('mineflayer');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let bot = null;
let online = false;

function createBot() {
  bot = mineflayer.createBot({
    host: 'UwU_world.aternos.me',
    port: 30089,
    username: 'KEEPING_ONLINE',
    physicsEnabled: true,
    version: false,
    hideErrors: true,
    checkTimeoutInterval: 60000
  });

  bot.on('login', () => {
    online = true;
  });

  bot.on('spawn', () => {
    online = true;
  });

  bot.on('end', () => {
    online = false;
    bot = null;
    setTimeout(createBot, 15000);
  });

  bot.on('kicked', (reason) => {
    online = false;
  });

  bot.on('error', (err) => {
    if (err.code === 'EPIPE' || err.code === 'ECONNRESET' || (err.message && err.message.includes('socketClosed'))) {
      return;
    }
  });
}

process.on('uncaughtException', () => {});
process.on('unhandledRejection', () => {});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/status', (req, res) => {
  res.json({ online });
});

app.post('/send-chat', (req, res) => {
  const message = req.body && req.body.message;
  if (bot && online && typeof message === 'string' && message.length > 0) {
    try {
      bot.chat(message);
    } catch (e) {}
  }
  res.json({ ok: true });
});

app.listen(PORT, () => {
  createBot();
});
