// 札48枚を1枚の PNG に並べて、絵を確かめる。月ごとに1行、右側に小さい札も並べる
import { writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'
import { CARDS } from '../src/engine'
import { ART, ART_H, ART_W } from '../src/renderer/art'
import { CARD_H, CARD_W, back, face } from '../src/renderer/cards'
import { RGB } from '../src/renderer/palette'
import type { Pixmap } from '../src/renderer/pixmap'

ART.forEach((art, id) => {
  if (art.grid.length !== ART_H) throw new Error(`${CARDS[id].name}: ${art.grid.length} 行`)
  art.grid.forEach((row, y) => {
    if (row.length !== ART_W) throw new Error(`${CARDS[id].name} ${y}行目: ${row.length} 文字`)
  })
})

const scale = Number(process.argv[3] ?? 5)
const gap = 2
const cols = 4 + 4 + 1
const W = (cols * (CARD_W + gap)) * scale
const H = 12 * (CARD_H + gap) * scale
const px = new Uint8Array(W * H * 3).fill(60)

function blit(p: Pixmap, x0: number, y0: number, s: number) {
  for (let y = 0; y < p.h; y++)
    for (let x = 0; x < p.w; x++) {
      const c = p.get(x, y)
      if (!c) continue
      const [r, g, b] = RGB[c]
      for (let dy = 0; dy < s; dy++)
        for (let dx = 0; dx < s; dx++) px.set([r, g, b], ((y0 + y * s + dy) * W + x0 + x * s + dx) * 3)
    }
}

for (const c of CARDS) {
  const row = c.month - 1
  const col = c.id % 4
  const f = face(c)
  blit(f, col * (CARD_W + gap) * scale, row * (CARD_H + gap) * scale, scale)
  // 実際の画面と同じ倍率 (等倍の3倍) での見え方
  blit(f, (4 * (CARD_W + gap) + col * (CARD_W + gap)) * scale, row * (CARD_H + gap) * scale, 3)
  blit(f.half(['shiro', 'sumi', 'beni']), (4 * (CARD_W + gap) + col * (CARD_W + gap)) * scale, (row * (CARD_H + gap) + 15) * scale, 3)
}
blit(back(), 8 * (CARD_W + gap) * scale, 0, scale)

function png(w: number, h: number, rgb: Uint8Array): Buffer {
  const raw = Buffer.alloc((w * 3 + 1) * h)
  for (let y = 0; y < h; y++) Buffer.from(rgb.buffer, y * w * 3, w * 3).copy(raw, y * (w * 3 + 1) + 1)
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    return c >>> 0
  })
  const crc = (b: Buffer) => {
    let c = 0xffffffff
    for (const x of b) c = crcTable[(c ^ x) & 0xff] ^ (c >>> 8)
    return (c ^ 0xffffffff) >>> 0
  }
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4)
    len.writeUInt32BE(data.length)
    const body = Buffer.concat([Buffer.from(type), data])
    const sum = Buffer.alloc(4)
    sum.writeUInt32BE(crc(body))
    return Buffer.concat([len, body, sum])
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr.set([8, 2, 0, 0, 0], 8)
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

writeFileSync(process.argv[2] ?? 'cards.png', png(W, H, px))
