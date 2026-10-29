import { CARDS, type Card } from '../engine'
import { ART, paint } from './art'
import type { Color } from './palette'
import { Pixmap } from './pixmap'

export const CARD_W = 16
export const CARD_H = 24

function frame(p: Pixmap, border: Color) {
  for (let x = 0; x < CARD_W; x++) {
    p.px(x, 0, border)
    p.px(x, CARD_H - 1, border)
  }
  for (let y = 0; y < CARD_H; y++) {
    p.px(0, y, border)
    p.px(CARD_W - 1, y, border)
  }
  for (const [x, y] of [[0, 0], [CARD_W - 1, 0], [0, CARD_H - 1], [CARD_W - 1, CARD_H - 1]]) p.px(x, y, null)
}

export function face(c: Card): Pixmap {
  const p = new Pixmap(CARD_W, CARD_H)
  p.rect(1, 1, CARD_W - 2, CARD_H - 2, 'shiro')
  paint(p, ART[c.id], 1, 1)
  // 光札だけ枠を金にして、小さくても見分けがつくようにする
  frame(p, c.kind === 'light' ? 'kin' : 'ink')
  return p
}

export function back(): Pixmap {
  const p = new Pixmap(CARD_W, CARD_H)
  p.rect(1, 1, CARD_W - 2, CARD_H - 2, 'beni')
  for (let y = 3; y < CARD_H - 3; y += 3) for (let x = 3 + (y % 2); x < CARD_W - 3; x += 3) p.px(x, y, 'kin2')
  p.rect(1, 1, CARD_W - 2, 1, 'momiji')
  frame(p, 'ink')
  return p
}

export interface CardSprites {
  big: HTMLCanvasElement[]
  mini: HTMLCanvasElement[]
  back: HTMLCanvasElement
  backMini: HTMLCanvasElement
}

export function buildCards(): CardSprites {
  const shrink = (p: Pixmap) => {
    const m = p.half(['shiro', 'sumi', 'beni'])
    for (let x = 0; x < m.w; x++) {
      m.px(x, 0, 'ink')
      m.px(x, m.h - 1, 'ink')
    }
    for (let y = 0; y < m.h; y++) {
      m.px(0, y, 'ink')
      m.px(m.w - 1, y, 'ink')
    }
    return m.toCanvas()
  }
  const faces = CARDS.map(face)
  const b = back()
  return { big: faces.map(f => f.toCanvas()), mini: faces.map(shrink), back: b.toCanvas(), backMini: shrink(b) }
}
