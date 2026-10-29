import { BrowserWindow, app, ipcMain } from 'electron'
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, unlinkSync, watch, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { type GameState, card, greedy, newGame, steady, step } from '../engine'
import type { Command, Update } from '../shared'

// mod と取り決めた場所。mod は ticks/ にファイルを置き、state.json を読む
const DIR = process.env.KOIKOI_DIR ?? join(homedir(), '.claude', 'koikoi')
const TICKS = join(DIR, 'ticks')
const GAME = join(DIR, 'game.json')
const PREFS = join(DIR, 'prefs.json')
const STATUS = join(DIR, 'state.json')
const LAUNCH = join(DIR, 'launch.json')

const CPUS = [steady, greedy] as const
const COMMANDS: Command[] = ['pause', 'step', 'top', 'reset']
const MAX_PENDING = 30
// 描画側から ready が来なくても、この時間で次に進める
const READY_TIMEOUT = 8000

interface Prefs {
  top: boolean
  bounds?: { x: number; y: number; width: number; height: number }
}

let win: BrowserWindow | undefined
let game: GameState
let prefs: Prefs = { top: false }
let pending = 0
let paused = false
let busy: NodeJS.Timeout | undefined

// 置き場所を変えた開発用の起動は、普段のビューアとは別のインスタンスにする
if (process.env.KOIKOI_DIR) app.setPath('userData', join(DIR, 'userdata'))

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (!win) return
    if (win.isMinimized()) win.restore()
    win.showInactive()
  })
  app.whenReady().then(start)
  app.on('window-all-closed', () => app.quit())
}

function start() {
  mkdirSync(TICKS, { recursive: true })
  game = readJson<GameState>(GAME) ?? newGame(Date.now())
  prefs = { ...prefs, ...readJson<Prefs>(PREFS) }
  // mod がビューアを起動するときに使う
  writeFileSync(LAUNCH, JSON.stringify({ argv: [process.execPath, app.getAppPath()] }))

  win = new BrowserWindow({
    ...(prefs.bounds ?? { width: 720, height: 480 }),
    useContentSize: true,
    minWidth: 240,
    minHeight: 160,
    title: '花札こいこい',
    backgroundColor: '#14141a',
    alwaysOnTop: prefs.top,
    webPreferences: { preload: join(__dirname, 'preload.js') },
  })
  win.setAspectRatio(3 / 2)
  win.setMenuBarVisibility(false)
  win.loadFile(join(__dirname, 'index.html'))
  win.webContents.on('did-finish-load', () => {
    clearTimeout(busy)
    busy = undefined
    send(true)
    pump()
  })
  win.on('close', () => {
    prefs.bounds = win!.getContentBounds()
    savePrefs()
  })

  ipcMain.on('ready', () => {
    clearTimeout(busy)
    busy = undefined
    pump()
  })
  ipcMain.on('command', (_e, cmd: Command) => command(cmd))

  watch(TICKS, () => scan())
  // watch は取りこぼすことがあるので、念のため定期的にも見る
  setInterval(scan, 1000)
  scan()
  writeStatus()
  if (process.env.KOIKOI_SHOT) shoot(process.env.KOIKOI_SHOT)
}

// 開発用: 一定間隔で画面を PNG に書き出す
function shoot(prefix: string) {
  let n = 0
  setInterval(async () => {
    const img = await win!.webContents.capturePage()
    writeFileSync(`${prefix}-${n++}.png`, img.toPNG())
  }, Number(process.env.KOIKOI_SHOT_MS ?? 1500))
}

// tick は `<時刻>-<乱数>.<種類>` という空のファイル。種類は tick か Command か show
function scan() {
  let names: string[]
  try {
    names = readdirSync(TICKS).sort()
  } catch {
    return
  }
  for (const name of names) {
    try {
      unlinkSync(join(TICKS, name))
    } catch {
      continue
    }
    const kind = name.slice(name.lastIndexOf('.') + 1)
    if (kind === 'tick') pending = Math.min(MAX_PENDING, pending + 1)
    else if (kind === 'show') win?.showInactive()
    else if ((COMMANDS as string[]).includes(kind)) command(kind as Command)
  }
  pump()
}

function command(cmd: Command) {
  switch (cmd) {
    case 'pause':
      paused = !paused
      break
    case 'step':
      pending = Math.min(MAX_PENDING, pending + 1)
      break
    case 'top':
      prefs.top = !prefs.top
      win?.setAlwaysOnTop(prefs.top)
      savePrefs()
      break
    case 'reset': {
      const stats = game.stats
      game = { ...newGame(Date.now()), stats }
      pending = 0
      save()
      clearTimeout(busy)
      busy = undefined
      send(true)
      break
    }
  }
  if (cmd !== 'reset') send(false)
  writeStatus()
  pump()
}

function pump() {
  if (busy || paused || pending === 0 || !win) return
  pending--
  const [next, event] = step(game, CPUS)
  game = next
  save()
  busy = setTimeout(() => {
    busy = undefined
    pump()
  }, READY_TIMEOUT)
  win.webContents.send('update', { state: game, event, pending, paused, snap: false } satisfies Update)
  writeStatus(describe(event))
}

function send(snap: boolean) {
  win?.webContents.send('update', { state: game, pending, paused, snap } satisfies Update)
}

function describe(e: ReturnType<typeof step>[1]): string {
  switch (e.type) {
    case 'deal': return `${game.round}月 配札`
    case 'play': return `${CPUS[e.seat].name} ${card(e.card).name}`
    case 'draw': return `${CPUS[e.seat].name} めくり ${card(e.card).name}`
    case 'koikoi': return `${CPUS[e.seat].name} こいこい`
    case 'stop': return `${CPUS[e.seat].name} 勝負 ${e.result.points}文`
    case 'gameEnd': return '終局'
  }
}

let lastMessage = ''
function writeStatus(message?: string) {
  if (message) lastMessage = message
  const status = {
    round: game.round,
    oya: game.oya,
    names: CPUS.map(c => c.name),
    scores: game.scores,
    phase: game.phase,
    paused,
    pending,
    message: lastMessage,
    stats: game.stats,
    updatedAt: Date.now(),
  }
  writeAtomic(STATUS, JSON.stringify(status))
}

const save = () => writeAtomic(GAME, JSON.stringify(game))
const savePrefs = () => writeAtomic(PREFS, JSON.stringify(prefs))

function writeAtomic(path: string, text: string) {
  const tmp = `${path}.tmp`
  writeFileSync(tmp, text)
  renameSync(tmp, path)
}

function readJson<T>(path: string): T | undefined {
  if (!existsSync(path)) return undefined
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return undefined
  }
}
