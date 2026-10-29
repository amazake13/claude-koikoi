import { COLOR, type Color } from './palette'

const FAMILY = 'misaki'
const cache = new Map<string, HTMLCanvasElement>()

export async function loadFont() {
  const font = new FontFace(FAMILY, 'url(misaki_gothic.ttf)')
  await font.load()
  document.fonts.add(font)
}

// 美咲フォントは 8px で描くとドットに揃う。にじんだ縁は二値にして消す
function glyph(ch: string, color: Color): HTMLCanvasElement {
  const key = ch + color
  const hit = cache.get(key)
  if (hit) return hit
  const c = document.createElement('canvas')
  const ctx = c.getContext('2d')!
  ctx.font = `8px ${FAMILY}`
  c.width = Math.max(1, Math.round(ctx.measureText(ch).width))
  c.height = 8
  ctx.font = `8px ${FAMILY}`
  ctx.fillStyle = COLOR[color]
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(ch, 0, 7)
  const img = ctx.getImageData(0, 0, c.width, c.height)
  for (let i = 3; i < img.data.length; i += 4) img.data[i] = img.data[i] >= 110 ? 255 : 0
  ctx.putImageData(img, 0, 0)
  cache.set(key, c)
  return c
}

export function textWidth(s: string, scale = 1): number {
  return [...s].reduce((w, ch) => w + glyph(ch, 'ink').width * scale, 0)
}

export function text(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, color: Color, scale = 1): number {
  let cx = x
  for (const ch of s) {
    const g = glyph(ch, color)
    ctx.drawImage(g, Math.round(cx), Math.round(y), g.width * scale, g.height * scale)
    cx += g.width * scale
  }
  return cx - x
}
