import { BOAR, BUTTERFLY, CURTAIN, DEER, MOON, RAIN_MAN, SAKE_CUP, card } from './cards'

export interface Yaku {
  name: string
  points: number
}

const LIGHTS = [0, 8, 28, 40, 44]
const RED = [1, 5, 9]
const BLUE = [21, 33, 37]

export function evaluate(ids: readonly number[]): Yaku[] {
  const has = new Set(ids)
  const found: Yaku[] = []
  const all = (list: number[]) => list.every(id => has.has(id))

  const dry = LIGHTS.filter(id => id !== RAIN_MAN && has.has(id)).length
  const rain = has.has(RAIN_MAN)
  if (dry === 4 && rain) found.push({ name: '五光', points: 10 })
  else if (dry === 4) found.push({ name: '四光', points: 8 })
  else if (dry === 3 && rain) found.push({ name: '雨四光', points: 7 })
  else if (dry === 3) found.push({ name: '三光', points: 5 })

  if (all([BOAR, DEER, BUTTERFLY])) found.push({ name: '猪鹿蝶', points: 5 })
  if (all(RED)) found.push({ name: '赤短', points: 5 })
  if (all(BLUE)) found.push({ name: '青短', points: 5 })
  if (all([CURTAIN, SAKE_CUP])) found.push({ name: '花見で一杯', points: 5 })
  if (all([MOON, SAKE_CUP])) found.push({ name: '月見で一杯', points: 5 })

  const count = (name: string, kind: string, threshold: number) => {
    const n = ids.filter(id => card(id).kind === kind).length
    if (n >= threshold) found.push({ name, points: 1 + n - threshold })
  }
  count('タネ', 'seed', 5)
  count('タン', 'ribbon', 5)
  count('カス', 'chaff', 10)

  return found
}

export const points = (ids: readonly number[]) => evaluate(ids).reduce((sum, y) => sum + y.points, 0)
