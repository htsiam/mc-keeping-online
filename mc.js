const mineflayer = require('mineflayer')

// ========== CONFIG ==========
const HOST = 'UwU_world.aternos.me'
const PORT = 30089
const USERNAME = 'Herobrine'
const VERSION = '1.20.1'
// ============================

let bot = null
let reconnectTimeout = null
let isConnecting = false
const RECONNECT_DELAY = 10000 // 10 seconds AFTER disconnect only

function createBot() {
  // Prevent double connections
  if (isConnecting || (bot && bot.entity)) {
    console.log(`[${new Date().toLocaleTimeString()}] Already connected or connecting – skip`)
    return
  }

  isConnecting = true
  console.log(`[${new Date().toLocaleTimeString()}] Connecting to ${HOST}:${PORT} as ${USERNAME}...`)

  // Clean up any previous bot
  if (bot) {
    try { bot.removeAllListeners(); bot.quit() } catch (e) {}
    bot = null
  }

  bot = mineflayer.createBot({
    host: HOST,
    port: PORT,
    username: USERNAME,
    version: VERSION,
    auth: 'offline',
    physicsEnabled: false,   // keeps "Invalid move player packet" away
    viewDistance: 2,
    hideErrors: false
  })

  bot.once('spawn', () => {
    isConnecting = false
    console.log(`[${new Date().toLocaleTimeString()}] ✅ Spawned! Standing still.`)
    bot.physicsEnabled = false
  })

  bot.on('login', () => {
    console.log(`[${new Date().toLocaleTimeString()}] Logged in`)
  })

  bot.on('error', (err) => {
    console.log(`[${new Date().toLocaleTimeString()}] Error:`, err.message)
  })

  bot.on('kicked', (reason) => {
    console.log(`[${new Date().toLocaleTimeString()}] Kicked:`, reason.toString())
    isConnecting = false
    // 'end' will fire after this, so reconnect is handled there
  })

  bot.on('end', (reason) => {
    console.log(`[${new Date().toLocaleTimeString()}] Disconnected:`, reason || 'unknown')
    isConnecting = false
    bot = null
    scheduleReconnect()
  })

  bot.on('message', (msg) => {
    const text = msg.toString()
    if (text.trim()) console.log(`[CHAT] ${text}`)
  })
}

function scheduleReconnect() {
  if (reconnectTimeout) clearTimeout(reconnectTimeout)

  console.log(`[${new Date().toLocaleTimeString()}] Will reconnect in ${RECONNECT_DELAY / 1000}s...`)
  reconnectTimeout = setTimeout(() => {
    reconnectTimeout = null
    createBot()
  }, RECONNECT_DELAY)
}

// Start once
createBot()

process.on('SIGINT', () => {
  console.log('\nStopping bot...')
  if (reconnectTimeout) clearTimeout(reconnectTimeout)
  if (bot) {
    try { bot.quit() } catch (e) {}
  }
  process.exit(0)
})
