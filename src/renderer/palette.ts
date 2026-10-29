// くすんだ和色。GBA と同じく RGB 各 5bit に丸めて使う
const HEX = {
  ink: '#1c1a20',
  sumi: '#3a363c',
  night: '#2a2c3a',
  felt: '#2c3a33',
  felt2: '#31413a',
  washi: '#e3d8bf',
  washi2: '#c4b591',
  shiro: '#f0e9d8',
  shu: '#b04a3a',
  beni: '#86303a',
  ai: '#33506a',
  ai2: '#5f7e92',
  matsu: '#3d5a3f',
  moegi: '#7d9157',
  kin: '#c9a14a',
  kin2: '#8c6f33',
  fuji: '#7a6292',
  sakura: '#d4a2a0',
  momiji: '#a9472f',
  cha: '#6a4a36',
  hai: '#8b877d',
  hada: '#d8b48e',
  kiiro: '#d9bf5a',
  daidai: '#c47a3c',
  mizu: '#86a8ab',
  kon: '#4e4f88',
} as const

export type Color = keyof typeof HEX

function to15bit(hex: string): string {
  const n = parseInt(hex.slice(1), 16)
  const ch = (shift: number) => {
    const v = (n >> shift) & 0xff
    const five = Math.round((v / 255) * 31)
    return Math.round((five / 31) * 255)
  }
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`
}

export const COLOR = Object.fromEntries(Object.entries(HEX).map(([k, v]) => [k, to15bit(v)])) as Record<Color, string>

export const RGB = Object.fromEntries(
  Object.entries(COLOR).map(([k, v]) => [k, v.match(/\d+/g)!.map(Number) as [number, number, number]]),
) as Record<Color, [number, number, number]>
