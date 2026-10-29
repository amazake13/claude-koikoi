import { type GameEvent, type GameState, MONTH_NAMES, type Seat, card, greedy, points, steady } from '../engine'
import type { Api, Update } from '../shared'
import { CARD_H, CARD_W, buildCards } from './cards'
import { type Mood, buildFaces } from './faces'
import { loadFont, text, textWidth } from './font'
import { COLOR, type Color } from './palette'

declare global {
  interface Window {
    koikoi: Api
  }
}

const W = 240
const H = 160
const NAMES = [steady.name, greedy.name]
const SEATS: Seat[] = [0, 1]

// 下が席0、上が席1
const HAND_Y = [107, 1]
const CAP_Y = [94, 27]
const FIELD_Y = [41, 66]
const STEP = 17
const PANEL_Y = [105, 1]
const DECK = { x: 152, y: 46 }
const MSG_Y = 134
const CAP_GROUPS = [
  { kind: 'light', x: 4, w: 22 },
  { kind: 'seed', x: 28, w: 32 },
  { kind: 'ribbon', x: 62, w: 32 },
  { kind: 'chaff', x: 96, w: 44 },
] as const

interface Place {
  x: number
  y: number
  face: boolean
  mini: boolean
  z: number
}

interface Sprite {
  id: number
  from: Place
  to: Place
  t: number
  dur: number
  delay: number
}

interface CutIn {
  title: string
  lines: string[]
  color: Color
  t: number
  hold: number
}

interface Stage {
  places: Map<number, Place>
  // 一部の札だけ動かす。false なら places にない札は消す
  partial?: boolean
  spawn?: Map<number, Place>
  dur: number
  stagger?: number
  hold: number
  message?: string[]
  cutin?: Omit<CutIn, 't'>
  shake?: number
  moods?: Mood[]
}

const screenCanvas = document.getElementById('screen') as HTMLCanvasElement
const screenCtx = screenCanvas.getContext('2d')!
const buf = document.createElement('canvas')
buf.width = W
buf.height = H
const ctx = buf.getContext('2d')!

const sprites = new Map<number, Sprite>()
let fieldSlots: (number | null)[] = []
let state: GameState | undefined
let queue: Stage[] = []
let current: { stage: Stage; hold: number } | undefined
let cutin: CutIn | undefined
let waitingReady = false
let paused = false
let pending = 0
let shake = 0
let moods: Mood[] = ['normal', 'normal']
let message: string[] = ['Claudeがうごくと', '一手すすむ']
let shown = 0
let early: Update | undefined

let cards: ReturnType<typeof buildCards>
let faces: ReturnType<typeof buildFaces>

// ---- 並べ方 ----

function syncSlots(field: readonly number[]) {
  fieldSlots = fieldSlots.map(id => (id !== null && field.includes(id) ? id : null))
  for (const id of field) {
    if (fieldSlots.includes(id)) continue
    const empty = fieldSlots.indexOf(null)
    if (empty >= 0) fieldSlots[empty] = id
    else fieldSlots.push(id)
  }
}

function slotPos(k: number) {
  const over = Math.floor(k / 16)
  const i = k % 16
  return { x: 4 + (i % 8) * STEP + over * 3, y: FIELD_Y[Math.floor(i / 8)] + over * 3 }
}

function layout(s: GameState): Map<number, Place> {
  const places = new Map<number, Place>()
  syncSlots(s.field)
  fieldSlots.forEach((id, k) => id !== null && places.set(id, { ...slotPos(k), face: true, mini: false, z: 1 + Math.floor(k / 16) }))
  for (const seat of SEATS) {
    ;[...s.hands[seat]].sort((a, b) => a - b).forEach((id, i) => places.set(id, { x: 4 + i * STEP, y: HAND_Y[seat], face: true, mini: false, z: 1 }))
    for (const g of CAP_GROUPS) {
      const ids = s.captured[seat].filter(id => card(id).kind === g.kind)
      const step = ids.length <= 1 ? 0 : Math.min(5, (g.w - 8) / (ids.length - 1))
      ids.forEach((id, i) => places.set(id, { x: Math.round(g.x + i * step), y: CAP_Y[seat], face: true, mini: true, z: 2 + i / 100 }))
    }
  }
  return places
}

const deckPlace = (): Place => ({ x: DECK.x, y: DECK.y, face: false, mini: false, z: 60 })

// 取る札の上に少しずらして重ねた位置
function overPlace(target: number): Place {
  const k = fieldSlots.indexOf(target)
  const p = k >= 0 ? slotPos(k) : { x: 70, y: 52 }
  return { x: p.x + 2, y: p.y + 3, face: true, mini: false, z: 50 }
}

// ---- 手から演出を組む ----

function speed() {
  return pending >= 8 ? 4 : pending >= 3 ? 2 : 1
}

function script(e: GameEvent, next: GameState) {
  const sp = speed()
  const dur = (n: number) => Math.max(2, Math.round(n / sp))
  const name = (seat: Seat) => NAMES[seat]
  const stages: Stage[] = []

  switch (e.type) {
    case 'deal': {
      sprites.clear()
      fieldSlots = []
      const places = layout(next)
      const spawn = new Map([...places.keys()].map(id => [id, deckPlace()]))
      stages.push({
        places, spawn, dur: dur(12), stagger: Math.max(1, Math.round(2 / sp)), hold: dur(20),
        message: [`${next.round}月 ${MONTH_NAMES[next.round - 1]}`, `${name(e.oya)}の親で配る`],
        moods: ['normal', 'normal'],
      })
      if (e.result) stages.push(resultStage(e.result.winner!, e.result.reason === 'teshi' ? '手四' : 'くっつき', e.result, dur))
      break
    }
    case 'play':
    case 'draw': {
      const verb = e.type === 'play' ? '出した' : 'めくった'
      const lines = [`${name(e.seat)}は ${card(e.card).name}を${verb}`, e.took.length ? `${e.took.slice(1).map(id => card(id).name).join('と')}をとった` : '場においた']
      const first = new Map<number, Place>()
      const spawn = e.type === 'draw' ? new Map([[e.card, deckPlace()]]) : undefined
      if (e.took.length) {
        first.set(e.card, overPlace(e.took[1]))
        stages.push({ places: first, partial: true, spawn, dur: dur(10), hold: dur(10), message: lines })
        stages.push({ places: layout(next), dur: dur(10), hold: dur(8) })
      } else {
        const places = layout(next)
        stages.push({ places, spawn, dur: dur(12), hold: dur(14), message: lines })
      }
      if (next.phase === 'decide') {
        stages.push({ places: layout(next), dur: 1, hold: dur(20), message: [`${name(e.seat)}に役ができた！`, `${points(next.captured[e.seat])}文 どうする…`] })
      }
      if (next.phase === 'roundEnd' && next.result?.reason === 'nagare') {
        stages.push({
          places: layout(next), dur: 1, hold: 0, message: ['だれも役ができなかった'],
          cutin: { title: '流れ', lines: ['この月はおあずけ'], color: 'hai', hold: dur(70) },
        })
      }
      break
    }
    case 'koikoi':
      stages.push({
        places: layout(next), dur: 1, hold: 0, shake: 8,
        message: [`${name(e.seat)}「こいこい！」`, `${e.yaku.map(y => y.name).join('・')}で まだ続ける`],
        cutin: { title: 'こいこい！', lines: [e.yaku.map(y => `${y.name} ${y.points}`).join('  ')], color: 'shu', hold: dur(70) },
      })
      break
    case 'stop':
      stages.push(resultStage(e.seat, '勝負！', e.result, dur))
      break
    case 'gameEnd': {
      const [a, b] = e.scores
      const winner = a === b ? null : a > b ? 0 : 1
      stages.push({
        places: layout(next), dur: 1, hold: dur(30),
        message: [`終局 ${NAMES[0]} ${a}文 ${NAMES[1]} ${b}文`, winner === null ? '引き分け' : `${NAMES[winner]}の勝ち`],
        cutin: { title: '終局', lines: [`${NAMES[0]} ${a} － ${b} ${NAMES[1]}`, winner === null ? '引き分け' : `${NAMES[winner]}の勝ち`], color: 'kin', hold: dur(110) },
        moods: winner === null ? ['normal', 'normal'] : SEATS.map(s => (s === winner ? 'happy' : 'sad')),
      })
      break
    }
  }
  return stages
}

function resultStage(seat: Seat, title: string, r: NonNullable<GameState['result']>, dur: (n: number) => number): Stage {
  return {
    places: layout(state!),
    dur: 1,
    hold: dur(20),
    shake: 10,
    message: [`${NAMES[seat]}の勝ち ${r.points}文`, r.yaku.map(y => y.name).join('・')],
    cutin: { title, lines: [...r.yaku.map(y => `${y.name} ${y.points}`), `${r.points}文`], color: 'beni', hold: dur(100) },
    moods: SEATS.map(s => (s === seat ? 'happy' : 'sad')),
  }
}

// ---- 進行 ----

function startStage(st: Stage) {
  for (const [id, p] of st.spawn ?? []) sprites.set(id, { id, from: p, to: p, t: 0, dur: 0, delay: 0 })
  if (!st.partial) for (const id of [...sprites.keys()]) if (!st.places.has(id)) sprites.delete(id)
  let i = 0
  for (const [id, to] of st.places) {
    const s = sprites.get(id)
    const from = s ? currentPlace(s) : to
    const changed = !s || from.x !== to.x || from.y !== to.y || s.to.face !== to.face || s.to.mini !== to.mini
    sprites.set(id, { id, from, to, t: 0, dur: changed ? st.dur : 0, delay: changed ? (st.stagger ?? 0) * i++ : 0 })
  }
  if (st.message) {
    message = st.message
    shown = 0
  }
  if (st.cutin) cutin = { ...st.cutin, t: 0 }
  if (st.shake) shake = st.shake
  if (st.moods) moods = st.moods
  current = { stage: st, hold: st.hold }
}

function progress(s: Sprite) {
  return s.dur === 0 ? 1 : Math.min(1, Math.max(0, (s.t - s.delay) / s.dur))
}

const ease = (p: number) => 1 - (1 - p) ** 3

function currentPlace(s: Sprite): Place {
  const p = ease(progress(s))
  return {
    x: Math.round(s.from.x + (s.to.x - s.from.x) * p),
    y: Math.round(s.from.y + (s.to.y - s.from.y) * p),
    face: p < 0.5 ? s.from.face : s.to.face,
    mini: p < 0.5 ? s.from.mini : s.to.mini,
    z: progress(s) < 1 && s.dur > 0 ? 100 : s.to.z,
  }
}

function tick() {
  for (const s of sprites.values()) s.t++
  if (shake > 0) shake--
  if (shown < 99) shown += 2
  if (cutin) {
    cutin.t++
    if (cutin.t > cutin.hold + 16) cutin = undefined
  }
  if (current) {
    const moving = [...sprites.values()].some(s => progress(s) < 1)
    if (!moving && !cutin) {
      if (current.hold > 0) current.hold--
      else {
        current = undefined
        const next = queue.shift()
        if (next) startStage(next)
      }
    }
  }
  if (!current && !cutin && waitingReady) {
    waitingReady = false
    window.koikoi.ready()
  }
}

function snap(s: GameState) {
  sprites.clear()
  fieldSlots = []
  for (const [id, p] of layout(s)) sprites.set(id, { id, from: p, to: p, t: 0, dur: 0, delay: 0 })
  queue = []
  current = undefined
  cutin = undefined
}

function onUpdate(u: Update) {
  // フォントと絵の準備ができる前に届いたら、最後の盤面だけ覚えておく
  if (!cards) {
    early = u
    return
  }
  paused = u.paused
  pending = u.pending
  if (u.snap) {
    state = u.state
    snap(u.state)
    return
  }
  if (!u.event) return
  // 前の演出が終わる前に次が来たら、前のは飛ばす
  if (current || queue.length) {
    queue = []
    current = undefined
    cutin = undefined
    if (state) for (const [id, p] of layout(state)) sprites.set(id, { id, from: p, to: p, t: 0, dur: 0, delay: 0 })
  }
  state = u.state
  queue = script(u.event, u.state)
  waitingReady = true
  const first = queue.shift()
  if (first) startStage(first)
}

// ---- 描画 ----

function fill(x: number, y: number, w: number, h: number, c: Color) {
  ctx.fillStyle = COLOR[c]
  ctx.fillRect(x, y, w, h)
}

function frameBox(x: number, y: number, w: number, h: number) {
  fill(x, y, w, h, 'ink')
  fill(x + 1, y + 1, w - 2, h - 2, 'ai2')
  fill(x + 2, y + 2, w - 4, h - 4, 'night')
  for (const [cx, cy] of [[x, y], [x + w - 1, y], [x, y + h - 1], [x + w - 1, y + h - 1]]) fill(cx, cy, 1, 1, 'felt')
}

function drawBackground() {
  fill(0, 0, W, H, 'felt')
  ctx.fillStyle = COLOR.felt2
  for (let y = 0; y < H; y += 2) for (let x = (y / 2) % 4; x < W; x += 4) ctx.fillRect(x, y, 1, 1)
}

function drawSprite(s: Sprite) {
  const p = currentPlace(s)
  const prog = progress(s)
  const flipping = s.from.face !== s.to.face && prog > 0 && prog < 1
  const mini = p.mini
  const w = mini ? CARD_W / 2 : CARD_W
  const h = mini ? CARD_H / 2 : CARD_H
  const img = p.face ? (mini ? cards.mini : cards.big)[s.id] : mini ? cards.backMini : cards.back
  if (flipping) {
    const scale = Math.abs(Math.cos(prog * Math.PI))
    const dw = Math.max(1, Math.round(w * scale))
    ctx.drawImage(img, p.x + Math.floor((w - dw) / 2), p.y, dw, h)
  } else {
    ctx.drawImage(img, p.x, p.y, w, h)
  }
}

function drawPanel(seat: Seat, s: GameState) {
  const y = PANEL_Y[seat]
  frameBox(144, y, 94, 28)
  ctx.drawImage(faces[seat][moods[seat]], 148, y + 6)
  text(ctx, NAMES[seat], 167, y + 4, 'washi')
  if (s.oya === seat) {
    text(ctx, 'おや', 218, y + 4, 'kin')
  }
  text(ctx, `${s.scores[seat]}文`, 167, y + 16, 'kin')
  const pts = points(s.captured[seat])
  if (s.koikoi[seat] > 0) text(ctx, 'こい', 210, y + 16, 'shu')
  else if (pts > 0) text(ctx, `やく${pts}`, 210, y + 16, 'moegi')
}

function drawCenter(s: GameState) {
  // 山札
  const left = s.deck.length
  for (let i = Math.min(3, Math.ceil(left / 8)) - 1; i >= 0; i--) ctx.drawImage(cards.back, DECK.x + i, DECK.y - i, CARD_W, CARD_H)
  text(ctx, `残${left}`, DECK.x, DECK.y + 27, 'washi2')
  // 月
  text(ctx, `${s.round}月`, 184, 46, 'kin', 2)
  text(ctx, MONTH_NAMES[s.round - 1], 186, 66, 'washi')
  text(ctx, `${s.stats.games + 1}局目`, 186, 78, 'washi2')
}

function drawMessage() {
  frameBox(0, MSG_Y, W, H - MSG_Y)
  let budget = shown
  message.slice(0, 2).forEach((line, i) => {
    const part = [...line].slice(0, Math.max(0, budget)).join('')
    budget -= [...line].length
    text(ctx, part, 7, MSG_Y + 5 + i * 10, 'washi')
  })
  if (paused) {
    const label = '一時停止 [Space]'
    const x = W - textWidth(label) - 7
    text(ctx, label, x, MSG_Y + 15, 'shu')
  } else if (pending > 1) {
    const label = `あと${pending}手`
    text(ctx, label, W - textWidth(label) - 7, MSG_Y + 15, 'hai')
  }
}

function drawCutIn(c: CutIn) {
  const inT = Math.min(1, c.t / 8)
  const outT = Math.max(0, (c.t - c.hold - 8) / 8)
  const offset = Math.round((1 - ease(inT)) * W - ease(outT) * W)
  const lines = c.lines.slice(0, 3)
  const h = 30 + lines.length * 10
  const y = Math.round((MSG_Y - h) / 2)
  ctx.save()
  ctx.translate(offset, 0)
  fill(0, y, W, h, 'ink')
  fill(0, y + 1, W, 1, c.color)
  fill(0, y + h - 2, W, 1, c.color)
  fill(0, y + 3, W, h - 6, 'night')
  const tw = textWidth(c.title, 2)
  text(ctx, c.title, Math.round((W - tw) / 2), y + 6, 'shiro', 2)
  fill(Math.round((W - tw) / 2), y + 23, tw, 1, c.color)
  lines.forEach((line, i) => text(ctx, line, Math.round((W - textWidth(line)) / 2), y + 26 + i * 10, 'kin'))
  ctx.restore()
  // 出始めに一瞬だけ白く光らせる
  if (c.t < 3) {
    ctx.globalAlpha = 0.5
    fill(0, 0, W, H, 'shiro')
    ctx.globalAlpha = 1
  }
}

function draw() {
  ctx.save()
  if (shake > 0) ctx.translate(((shake * 7) % 3) - 1, ((shake * 5) % 3) - 1)
  drawBackground()
  if (state) {
    for (const seat of SEATS) drawPanel(seat, state)
    drawCenter(state)
    const list = [...sprites.values()].sort((a, b) => currentPlace(a).z - currentPlace(b).z)
    for (const s of list) drawSprite(s)
  }
  drawMessage()
  if (cutin) drawCutIn(cutin)
  ctx.restore()

  const scale = Math.max(1, Math.floor(Math.min(innerWidth / W, innerHeight / H)))
  if (screenCanvas.width !== W * scale) {
    screenCanvas.width = W * scale
    screenCanvas.height = H * scale
  }
  screenCtx.imageSmoothingEnabled = false
  screenCtx.drawImage(buf, 0, 0, W * scale, H * scale)
}

// 画面の更新が何Hzでも、進行は 60fps 固定で回す
let last = performance.now()
let acc = 0
function loop(now: number) {
  acc = Math.min(acc + (now - last), 250)
  last = now
  while (acc >= 1000 / 60) {
    tick()
    acc -= 1000 / 60
  }
  draw()
  requestAnimationFrame(loop)
}

addEventListener('keydown', e => {
  if (e.key === ' ') window.koikoi.send('pause')
  else if (e.key === 't' || e.key === 'T') window.koikoi.send('top')
  else if (e.key === 'n' || e.key === 'ArrowRight') window.koikoi.send('step')
  else if (e.key === 'R' && e.shiftKey) window.koikoi.send('reset')
})

async function main() {
  window.koikoi.onUpdate(onUpdate)
  await loadFont()
  ctx.imageSmoothingEnabled = false
  cards = buildCards()
  faces = buildFaces()
  if (early) {
    onUpdate({ ...early, snap: true })
    if (early.event) window.koikoi.ready()
  }
  requestAnimationFrame(loop)
}

main()
