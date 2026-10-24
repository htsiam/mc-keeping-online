const mineflayer = require('mineflayer')

// ========== CONFIG ==========
const HOST = 'UwU_world.aternos.me'
const PORT = 30089
const USERNAME = 'Herobrine'
const VERSION = '26.3'               // stable, works great with ViaVersion + ViaBackwards
// ============================

let bot = null
let reconnectTimeout = null
const RECONNECT_DELAY = 12000          //  seconds

function createBot() {
  console.log(`[${new Date().toLocaleTimeString()}] Connecting to ${HOST}:${PORT} as ${USERNAME}...`)

  bot = mineflayer.createBot({
    host: HOST,
    port: PORT,
    username: USERNAME,
    version: VERSION,
    auth: 'offline',                   // Aternos is usually offline-mode
    physicsEnabled: false,             // CRITICAL: prevents "Invalid move player packet"
    viewDistance: 2,                   // low = less lag / less packets
    hideErrors: false
  })

  bot.once('spawn', () => {
    console.log(`[${new Date().toLocaleTimeString()}] ✅ Spawned successfully! Standing still (physics disabled).`)
    // Make sure physics stays off
    bot.physicsEnabled = false
  })

  bot.on('login', () => {
    console.log(`[${new Date().toLocaleTimeString()}] Logged in`)
  })

  bot.on('error', (err) => {
    console.log(`[${new Date().toLocaleTimeString()}] Error:`, err.message)
  })

  bot.on('kicked', (reason) => {
    console.log(`[${new Date().toLocaleTimeString()}] Kicked:`, reason)
  })

  bot.on('end', (reason) => {
    console.log(`[${new Date().toLocaleTimeString()}] Disconnected:`, reason || 'unknown')
    scheduleReconnect()
  })

  // Optional: log chat so you can see what's happening
  bot.on('message', (msg) => {
    const text = msg.toString()
    if (text.trim()) console.log(`[CHAT] ${text}`)
  })
}

function scheduleReconnect() {
  if (reconnectTimeout) clearTimeout(reconnectTimeout)
  console.log(`[${new Date().toLocaleTimeString()}] Reconnecting in ${RECONNECT_DELAY / 1000}s...`)
  reconnectTimeout = setTimeout(() => {
    createBot()
  }, RECONNECT_DELAY)
}

// Start
createBot()

// Keep process alive
process.on('SIGINT', () => {
  console.log('\nStopping bot...')
  if (bot) bot.quit()
  process.exit(0)
})
