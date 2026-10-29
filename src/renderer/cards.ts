import { CARDS, type Card } from '../engine'
import { ART, ICON_CROP, ICON_H, ICON_W, paint } from './art'
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

export const ICON_FULL_W = ICON_W + 2
export const ICON_FULL_H = ICON_H + 2

// 取り札のアイコン。縮小せず、大きい札の絵の一部をそのまま切り出す
export function icon(c: Card, big = face(c)): Pixmap {
  const p = new Pixmap(ICON_FULL_W, ICON_FULL_H)
  const [cx, cy] = ICON_CROP[c.id]
  for (let y = 0; y < ICON_H; y++) for (let x = 0; x < ICON_W; x++) p.px(x + 1, y + 1, big.get(cx + x + 1, cy + y + 1))
  const border = c.kind === 'light' ? 'kin' : 'ink'
  for (let x = 0; x < p.w; x++) {
    p.px(x, 0, border)
    p.px(x, p.h - 1, border)
  }
  for (let y = 0; y < p.h; y++) {
    p.px(0, y, border)
    p.px(p.w - 1, y, border)
  }
  return p
}

export interface CardSprites {
  big: HTMLCanvasElement[]
  mini: HTMLCanvasElement[]
  back: HTMLCanvasElement
  backMini: HTMLCanvasElement
}

export function buildCards(): CardSprites {
  const faces = CARDS.map(c => face(c))
  const b = back()
  const backMini = b.half(['beni'])
  return {
    big: faces.map(f => f.toCanvas()),
    mini: CARDS.map((c, i) => icon(c, faces[i]).toCanvas()),
    back: b.toCanvas(),
    backMini: backMini.toCanvas(),
  }
}
