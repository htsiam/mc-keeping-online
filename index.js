const express = require('express');
const mineflayer = require('mineflayer');

const app = express();
const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => {
  res.send('KEEPING_ONLINE Bot is active on Koyeb 24/7!');
});

app.listen(PORT, () => {
  console.log(`Web Server running on port ${PORT}`);
});

function createBot() {
  console.log('Connecting KEEPING_ONLINE bot to UwU_world.aternos.me...');
  
  const bot = mineflayer.createBot({
    host: 'UwU_world.aternos.me',
    port: 30089,
    username: 'KEEPING_ONLINE',
    version: false
  });

  bot.on('spawn', () => {
    console.log('SUCCESS: KEEPING_ONLINE has joined the server!');
    
    setInterval(() => {
      if (bot && bot.entity) {
        bot.setControlState('jump', true);
        setTimeout(() => bot.setControlState('jump', false), 500);
      }
    }, 25000);
  });

  bot.on('end', (reason) => {
    console.log('Disconnected:', reason);
    console.log('Reconnecting in 10 seconds...');
    setTimeout(createBot, 10000);
  });

  bot.on('error', (err) => {
    console.log('Bot Error:', err.message);
  });
}

createBot();
