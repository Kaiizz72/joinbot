// bot.js — 30 bots auto /register + /login + /server sursmp + auto reconnect

const mineflayer = require('mineflayer')
const { pathfinder, goals: { GoalXZ } } = require('mineflayer-pathfinder')
const pvp = require('mineflayer-pvp').plugin

// ==== CẤU HÌNH SERVER ====
const SERVER_HOST = process.env.SERVER_HOST || 'node1.lumine.asia'
const SERVER_PORT = Number(process.env.SERVER_PORT || 25675)
const AUTH_MODE   = process.env.AUTH_MODE || 'offline'

// Số lượng bot & delay join
const MAX_BOTS        = 30               // khoảng 30 con
const JOIN_DELAY_MS   = 10000            // 10s 1 con cho chậm bớt, tránh host chặn
const RECONNECT_MINMS = 30000            // min 30s
const RECONNECT_MAXMS = 60000            // max 60s

// Danh sách tên bot (ít nhất 30 tên)
const NAMES = [
  'xPVP2','CauBeNgoc','MayChemHaTinh','Memaybel','Bomaychaphet',
  'noomn','tretrauminecraft','Phu2k8','LinhDepGai','AnhHangXom',
  'CuongDepTrai','LinhThongThai','HoangHac','SuuTam','KhaiBeDe',
  'ThanhNien1','ThanhNien2','ThanhNien3','ThanhNien4','ThanhNien5',
  'NoobGiau','ProKhongLo','LaiCanh','ThoDanSoi','PlayerVN01',
  'PlayerVN02','PlayerVN03','PlayerVN04','PlayerVN05','PlayerVN06'
].slice(0, MAX_BOTS)

function wait (ms) {
  return new Promise(res => setTimeout(res, ms))
}

function randomInt (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// PvP combat setup: attack mobs + players (có cũng được, không thích thì xoá)
function setupCombat (bot) {
  bot.on('physicTick', () => {
    const target = bot.nearestEntity(e =>
      (e.type === 'mob' && e.mobType && ['Zombie', 'Husk', 'Drowned', 'Skeleton', 'Spider', 'Creeper'].includes(e.mobType)) ||
      (e.type === 'player' && e.username !== bot.username)
    )
    if (target && !bot.pvp.target) {
      bot.pvp.attack(target)
    }
  })
}

// Đi lòng vòng random
function wander (bot) {
  setInterval(() => {
    try {
      const x = Math.floor(bot.entity.position.x + (Math.random() * 16 - 8))
      const z = Math.floor(bot.entity.position.z + (Math.random() * 16 - 8))
      bot.pathfinder.setGoal(new GoalXZ(x, z), false)
    } catch {}
  }, 12000)
}

// Sau khi spawn: /register → /login → /server sursmp
async function handleAuthAndServer (bot) {
  try {
    // Đợi server load + gửi bảng đăng nhập xong, tránh spam sớm
    await wait(5000)
    bot.chat('/register 12345678 12345678')

    await wait(4000)
    bot.chat('/login 12345678')

    await wait(4000)
    bot.chat('/server sursmp')

    // Sau khi vào server con thì cứ đi linh tinh
  } catch (e) {
    console.log(`[${bot.username}] auth error:`, e)
  }
}

// Tạo bot + gắn event, nếu bị end/kicked thì tự reconnect
function spawnBot (name) {
  console.log(`[${name}] spawning new instance...`)

  const bot = mineflayer.createBot({
    host: SERVER_HOST,
    port: SERVER_PORT,
    username: name,
    auth: AUTH_MODE
  })

  bot.loadPlugin(pathfinder)
  bot.loadPlugin(pvp)

  bot.once('spawn', () => {
    console.log(`[${name}] joined!`)
    setupCombat(bot)
    wander(bot)
    handleAuthAndServer(bot)
  })

  bot.on('kicked', (reason, loggedIn) => {
    console.log(`[${name}] kicked: ${reason}`)
    const delay = randomInt(RECONNECT_MINMS, RECONNECT_MAXMS)
    console.log(`[${name}] sẽ thử reconnect sau ${Math.floor(delay / 1000)}s...`)
    setTimeout(() => spawnBot(name), delay)
  })

  bot.on('end', reason => {
    console.log(`[${name}] end: ${reason}`)
    const delay = randomInt(RECONNECT_MINMS, RECONNECT_MAXMS)
    console.log(`[${name}] sẽ thử reconnect sau ${Math.floor(delay / 1000)}s...`)
    setTimeout(() => spawnBot(name), delay)
  })

  bot.on('error', e => {
    console.log(`[${name}] error:`, e)
  })

  return bot
}

// ==== TẠO NHIỀU BOT JOIN TỪ TỪ ====
;(async () => {
  for (let i = 0; i < NAMES.length; i++) {
    const name = NAMES[i]
    console.log(`Đang spawn bot thứ ${i + 1}/${NAMES.length} (${name}) sau ${JOIN_DELAY_MS}ms...`)
    spawnBot(name)
    await wait(JOIN_DELAY_MS)
  }
})()
