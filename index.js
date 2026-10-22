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

function createBot() {
  console.log('Connecting KEEPING_ONLINE bot to UwU_world.aternos.me...');
  
  const bot = mineflayer.createBot({
    host: 'UwU_world.aternos.me',
    port: 30089,
    username: 'KEEPING_ONLINE',
    version: '1.20.4',
    physicsEnabled: false // অ্যান্টি-চিট কিক রোধ করতে ফিজিক্স অফ রাখা হয়েছে
  });

  bot.on('spawn', () => {
    console.log('SUCCESS: KEEPING_ONLINE has joined the server!');
    
    // Anti-AFK: ঠিক প্রতি ১ মিনিটে (৬০ সেকেন্ডে) একবার জাম্প করবে
    setInterval(() => {
      if (bot && bot.entity) {
        bot.setControlState('jump', true);
        setTimeout(() => {
          if (bot) bot.setControlState('jump', false);
        }, 500); // আধ সেকেন্ড পর জাম্প ছেড়ে দেবে
      }
    }, 60000); // 60000 ms = 1 minute
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
