const express = require('express');
const mineflayer = require('mineflayer');

const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', (req, res) => {
  res.send('KEEPING_ONLINE Bot is active on Render 24/7!');
});

app.listen(PORT, () => {
  console.log(`Web Server running on port ${PORT}`);
});

let bot = null;
let reconnectTimeout = null;
let afkInterval = null;

function createBot() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  if (afkInterval) {
    clearInterval(afkInterval);
    afkInterval = null;
  }

  console.log('Connecting KEEPING_ONLINE bot to UwU_world.aternos.me...');

  bot = mineflayer.createBot({
    host: 'UwU_world.aternos.me',
    port: 30089,
    username: 'KEEPING_ONLINE',
    version: '1.20.4',
    physicsEnabled: false
  });

  bot.on('spawn', () => {
    console.log('SUCCESS: KEEPING_ONLINE has joined the server!');

    if (afkInterval) clearInterval(afkInterval);
    afkInterval = setInterval(() => {
      if (bot && bot.entity) {
        bot.setControlState('jump', true);
        setTimeout(() => {
          if (bot) bot.setControlState('jump', false);
        }, 500);
      }
    }, 60000);
  });

  bot.on('death', () => {
    console.log('Bot died! Respawning automatically...');
    if (bot) bot.respawn();
  });

  bot.on('end', (reason) => {
    console.log('Disconnected:', reason);
    console.log('Reconnecting in 10 seconds...');
    scheduleReconnect();
  });

  bot.on('error', (err) => {
    console.log('Bot Error:', err.message);
    scheduleReconnect();
  });

  bot.on('kicked', (reason) => {
    console.log('Bot kicked:', reason);
    scheduleReconnect();
  });
}

function scheduleReconnect() {
  if (reconnectTimeout) return;

  if (afkInterval) {
    clearInterval(afkInterval);
    afkInterval = null;
  }

  if (bot) {
    bot.removeAllListeners();
    bot = null;
  }

  reconnectTimeout = setTimeout(() => {
    createBot();
  }, 10000);
}

createBot();
