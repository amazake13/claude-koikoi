import { type Color, RGB } from './palette'

export class Pixmap {
  readonly data: (Color | null)[]

  constructor(
    readonly w: number,
    readonly h: number,
  ) {
    this.data = new Array(w * h).fill(null)
  }

  get(x: number, y: number): Color | null {
    return x < 0 || y < 0 || x >= this.w || y >= this.h ? null : this.data[y * this.w + x]
  }

  px(x: number, y: number, c: Color | null) {
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.data[y * this.w + x] = c
  }

  rect(x: number, y: number, w: number, h: number, c: Color) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.px(i, j, c)
  }

  disc(cx: number, cy: number, r: number, c: Color) {
    for (let y = Math.floor(cy - r); y <= cy + r; y++)
      for (let x = Math.floor(cx - r); x <= cx + r; x++)
        if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r + r * 0.6) this.px(x, y, c)
  }

  line(x0: number, y0: number, x1: number, y1: number, c: Color) {
    const dx = Math.abs(x1 - x0)
    const dy = -Math.abs(y1 - y0)
    const sx = x0 < x1 ? 1 : -1
    const sy = y0 < y1 ? 1 : -1
    let err = dx + dy
    for (;;) {
      this.px(x0, y0, c)
      if (x0 === x1 && y0 === y1) break
      const e2 = 2 * err
      if (e2 >= dy) {
        err += dy
        x0 += sx
      }
      if (e2 <= dx) {
        err += dx
        y0 += sy
      }
    }
  }

  dots(points: [number, number][], c: Color) {
    for (const [x, y] of points) this.px(x, y, c)
  }

  // 文字で描いた小さな絵を置く。'.' と未定義の文字は透明
  stamp(rows: string[], x: number, y: number, colors: Record<string, Color>) {
    rows.forEach((row, j) => [...row].forEach((ch, i) => colors[ch] && this.px(x + i, y + j, colors[ch])))
  }

  // 2x2 ごとに一番多い色を取って半分の大きさにする。背景色より模様の色を優先する
  half(background: Color[]): Pixmap {
    const out = new Pixmap(this.w >> 1, this.h >> 1)
    for (let y = 0; y < out.h; y++)
      for (let x = 0; x < out.w; x++) {
        const counts = new Map<Color | null, number>()
        for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
          const c = this.get(x * 2 + dx, y * 2 + dy)
          const weight = c && background.includes(c) ? 1 : 2.2
          counts.set(c, (counts.get(c) ?? 0) + weight)
        }
        out.px(x, y, [...counts].sort((a, b) => b[1] - a[1])[0][0])
      }
    return out
  }

  toCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = this.w
    canvas.height = this.h
    const ctx = canvas.getContext('2d')!
    const img = ctx.createImageData(this.w, this.h)
    this.data.forEach((c, i) => {
      if (!c) return
      const [r, g, b] = RGB[c]
      img.data.set([r, g, b, 255], i * 4)
    })
    ctx.putImageData(img, 0, 0)
    return canvas
  }
}
