// mulberry32。状態を数値1つで持つので、ゲームの状態と一緒に JSON に保存できる
export function next(state: number): [value: number, state: number] {
  const s = (state + 0x6d2b79f5) | 0
  let t = s
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, s]
}

export function shuffle<T>(items: readonly T[], state: number): [T[], number] {
  const out = [...items]
  let s = state
  for (let i = out.length - 1; i > 0; i--) {
    let r: number
    ;[r, s] = next(s)
    const j = Math.floor(r * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return [out, s]
}
