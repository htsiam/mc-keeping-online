const express = require('express');
const mineflayer = require('mineflayer');

const HOST = 'UwU_world.aternos.me';
const PORT = 30089;
const USERNAME = 'KEEPING_ONLINE';
const RECONNECT_DELAY = 10000;
const ANTI_AFK_INTERVAL = 60000; // প্রতি ১ মিনিটে একবার জাম্প করবে
const WEB_PORT = process.env.PORT || 10000;

let bot = null;
let status = 'OFFLINE';
let isReconnecting = false;
let antiAfkInterval = null;
let reconnectTimeout = null;

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function cleanup() {
  if (antiAfkInterval) {
    clearInterval(antiAfkInterval);
    antiAfkInterval = null;
  }
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  if (bot) {
    try {
      bot.removeAllListeners();
      bot.quit();
    } catch (_) {}
    bot = null;
  }
}

// শুধু জাম্প করার ফাংশন (অন্য কিছু করবে না)
function startAntiAfk() {
  if (antiAfkInterval) clearInterval(antiAfkInterval);
  antiAfkInterval = setInterval(() => {
    if (!bot || status !== 'ONLINE') return;
    try {
      bot.setControlState('jump', true);
      setTimeout(() => {
        if (bot) bot.setControlState('jump', false);
      }, 300);
    } catch (_) {}
  }, ANTI_AFK_INTERVAL);
}

function createBot() {
  if (isReconnecting) return;
  isReconnecting = true;
  status = 'CONNECTING';

  cleanup();

  console.log(`[BOT] Connecting to ${HOST}:${PORT} as ${USERNAME}...`);

  bot = mineflayer.createBot({
    host: HOST,
    port: PORT,
    username: USERNAME,
    physicsEnabled: true,
    hideErrors: true
  });

  bot.once('spawn', () => {
    status = 'ONLINE';
    isReconnecting = false;
    console.log('[BOT] Spawned – ONLINE (Jump only anti-AFK active)');
    startAntiAfk();
  });

  bot.on('death', () => {
    console.log('[BOT] Died – respawning');
    try {
      bot.respawn();
    } catch (_) {}
  });

  bot.on('chat', () => {});

  bot.on('kicked', (reason) => {
    console.log('[BOT] Kicked:', JSON.stringify(reason));
    status = 'OFFLINE';
    scheduleReconnect();
  });

  bot.on('end', () => {
    console.log('[BOT] Connection ended');
    status = 'OFFLINE';
    scheduleReconnect();
  });

  bot.on('error', (err) => {
    console.log('[BOT] Error:', err.message);
    status = 'OFFLINE';
    scheduleReconnect();
  });
}

function scheduleReconnect() {
  if (isReconnecting) return;
  isReconnecting = true;
  status = 'CONNECTING';

  if (antiAfkInterval) {
    clearInterval(antiAfkInterval);
    antiAfkInterval = null;
  }

  if (reconnectTimeout) clearTimeout(reconnectTimeout);
  reconnectTimeout = setTimeout(() => {
    isReconnecting = false;
    createBot();
  }, RECONNECT_DELAY);
}

app.get('/', (req, res) => {
  const statusColor =
    status === 'ONLINE' ? '#00ff88' :
    status === 'CONNECTING' ? '#ffaa00' : '#ff4444';

  res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Minecraft Bot Dashboard</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      background: #0d1117;
      color: #e6edf3;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }
    .card {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 12px;
      padding: 32px;
      width: 100%;
      max-width: 480px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    }
    h1 {
      font-size: 1.5rem;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .status {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
      background: ${statusColor}22;
      color: ${statusColor};
      border: 1px solid ${statusColor}44;
    }
    .info {
      color: #8b949e;
      font-size: 0.9rem;
      margin: 16px 0 24px;
      line-height: 1.5;
    }
    label {
      display: block;
      font-size: 0.85rem;
      color: #8b949e;
      margin-bottom: 8px;
    }
    .input-row {
      display: flex;
      gap: 10px;
    }
    input[type="text"] {
      flex: 1;
      background: #0d1117;
      border: 1px solid #30363d;
      border-radius: 8px;
      padding: 12px 14px;
      color: #e6edf3;
      font-size: 0.95rem;
      outline: none;
      transition: border-color 0.2s;
    }
    input[type="text"]:focus {
      border-color: #58a6ff;
    }
    button {
      background: #238636;
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 12px 20px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    button:hover { background: #2ea043; }
    button:disabled {
      background: #21262d;
      color: #484f58;
      cursor: not-allowed;
    }
    #feedback {
      margin-top: 16px;
      font-size: 0.9rem;
      min-height: 20px;
      color: #8b949e;
    }
    .footer {
      margin-top: 28px;
      text-align: center;
      font-size: 0.75rem;
      color: #484f58;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>
      Bot Dashboard
      <span class="status" id="statusBadge">${status}</span>
    </h1>
    <p class="info">
      Server: ${HOST}:${PORT}<br>
      Username: ${USERNAME}<br>
      Mode: Jump-only Anti-AFK
    </p>

    <label for="cmd">Send chat / command</label>
    <div class="input-row">
      <input type="text" id="cmd" placeholder="/gamemode creative  or  hello world" autocomplete="off">
      <button id="sendBtn" ${status !== 'ONLINE' ? 'disabled' : ''}>Send</button>
    </div>
    <div id="feedback"></div>

    <div class="footer">UptimeRobot-friendly • 200 OK</div>
  </div>

  <script>
    const statusBadge = document.getElementById('statusBadge');
    const sendBtn = document.getElementById('sendBtn');
    const cmdInput = document.getElementById('cmd');
    const feedback = document.getElementById('feedback');

    setInterval(async () => {
      try {
        const res = await fetch('/status');
        const data = await res.json();
        statusBadge.textContent = data.status;
        statusBadge.style.color = data.color;
        statusBadge.style.background = data.color + '22';
        statusBadge.style.borderColor = data.color + '44';
        sendBtn.disabled = data.status !== 'ONLINE';
      } catch (_) {}
    }, 8000);

    sendBtn.addEventListener('click', send);
    cmdInput.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });

    async function send() {
      const message = cmdInput.value.trim();
      if (!message) return;
      sendBtn.disabled = true;
      feedback.textContent = 'Sending...';
      try {
        const res = await fetch('/send-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message })
        });
        const data = await res.json();
        feedback.textContent = data.ok ? '✓ Sent' : '✗ ' + (data.error || 'Failed');
        feedback.style.color = data.ok ? '#00ff88' : '#ff4444';
        if (data.ok) cmdInput.value = '';
      } catch (err) {
        feedback.textContent = '✗ Network error';
        feedback.style.color = '#ff4444';
      }
      sendBtn.disabled = statusBadge.textContent !== 'ONLINE';
    }
  </script>
</body>
</html>`);
});

app.get('/status', (req, res) => {
  const color =
    status === 'ONLINE' ? '#00ff88' :
    status === 'CONNECTING' ? '#ffaa00' : '#ff4444';
  res.json({ status, color });
});

app.post('/send-chat', (req, res) => {
  const message = (req.body && req.body.message) ? String(req.body.message).trim() : '';
  if (!message) {
    return res.status(400).json({ ok: false, error: 'Empty message' });
  }
  if (!bot || status !== 'ONLINE') {
    return res.status(503).json({ ok: false, error: 'Bot is not online' });
  }
  try {
    bot.chat(message);
    console.log('[CHAT] Sent:', message);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

process.on('uncaughtException', (err) => {
  console.error('[PROCESS] Uncaught Exception:', err.message);
});
process.on('unhandledRejection', (reason) => {
  console.error('[PROCESS] Unhandled Rejection:', reason);
});

app.listen(WEB_PORT, () => {
  console.log(`[WEB] Dashboard listening on port ${WEB_PORT}`);
  createBot();
});
