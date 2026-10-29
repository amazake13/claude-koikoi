import type { Color } from './palette'
import { Pixmap } from './pixmap'

export type Mood = 'normal' | 'happy' | 'sad'

// 目と口の行は表情ごとに差し替える。E と M がその目印
const SHIZU = [
  '.....kkkkk......',
  '....kkkkkkk.....',
  '...kkkkkkkkk....',
  '..kkkkkkkkkkk...',
  '..kkksssssskk...',
  '..kksssssssk.r..',
  '..kssssssssk.rr.',
  'E',
  '..kssssssssk....',
  '..ksssssssskk...',
  'M',
  '...kssssssk.k...',
  '....kssssk......',
  '...aaasssaaa....',
  '..aaaasssaaaa...',
  '.aaaaaawaaaaaa..',
]

const TORA = [
  '....kkkkkkk.....',
  '...kkkkkkkkk....',
  '..kkkkkkkkkkk...',
  '..ttttttttttt...',
  '..tktktktktkt...',
  '..ksssssssssk...',
  '..sssssssssss...',
  'E',
  '..sssssssssss...',
  '..sssssssssss...',
  'M',
  '...sskkkkkss....',
  '....sssssss.....',
  '...cccsssccc....',
  '..ccccssscccc...',
  '.cccccc.cccccc..',
]

const ROWS: Record<Mood, { E: string; M: string }> = {
  normal: { E: '..sseessseess...', M: '..sssssmmsssss..' },
  happy: { E: '..sesesssesess..', M: '..sssmmmmmssss..' },
  sad: { E: '..sseessseesb...', M: '..ssssmmmsssss..' },
}

const COLORS: Record<string, Color> = {
  k: 'ink', s: 'hada', e: 'ink', m: 'beni', a: 'fuji', w: 'shiro', r: 'shu', t: 'kin', c: 'ai', b: 'ai2',
}

function draw(base: string[], mood: Mood): HTMLCanvasElement {
  const p = new Pixmap(16, 16)
  p.rect(0, 0, 16, 16, 'night')
  const rows = base.map(r => (r === 'E' ? ROWS[mood].E : r === 'M' ? ROWS[mood].M : r))
  p.stamp(rows, 0, 0, COLORS)
  return p.toCanvas()
}

export function buildFaces(): Record<Mood, HTMLCanvasElement>[] {
  const moods: Mood[] = ['normal', 'happy', 'sad']
  return [SHIZU, TORA].map(base => Object.fromEntries(moods.map(m => [m, draw(base, m)])) as Record<Mood, HTMLCanvasElement>)
}
