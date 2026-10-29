import { SAKE_CUP, card, monthOf } from './cards'
import type { Strategy, View } from './game'
import { points } from './yaku'

interface Weights {
  // 役が伸びる札をどれだけ重く見るか
  yaku: number
  // 場に捨てた札を相手に取られる怖さ
  caution: number
}

function value(id: number): number {
  const c = card(id)
  if (id === SAKE_CUP) return 15
  switch (c.kind) {
    case 'light': return 20
    case 'seed': return 10
    case 'ribbon': return c.ribbon === 'plain' ? 5 : 7
    case 'chaff': return 1
  }
}

const gain = (mine: readonly number[], add: readonly number[]) => points([...mine, ...add]) - points(mine)

// あと1枚で相手の役が増える札の数
function threats(v: View): number {
  const base = points(v.theirs)
  return [...v.unseen, ...v.field].filter(id => points([...v.theirs, id]) > base).length
}

function planner(w: Weights) {
  const captureScore = (v: View, took: number[]) =>
    took.reduce((sum, id) => sum + value(id), 0) + gain(v.mine, took) * w.yaku

  const best = (v: View) => {
    let top = { card: v.hand[0], target: undefined as number | undefined, score: -Infinity }
    for (const id of v.hand) {
      const matches = v.field.filter(c => monthOf(c) === monthOf(id))
      if (matches.length === 0) {
        // 同じ月をもう1枚持っていれば、次の手番で取り返せる
        const pair = v.hand.some(c => c !== id && monthOf(c) === monthOf(id))
        const lost = value(id) + gain(v.theirs, [id]) * w.yaku
        const score = -lost * w.caution * (pair ? 0.3 : 1)
        if (score > top.score) top = { card: id, target: undefined, score }
        continue
      }
      const options = matches.length === 2 ? matches.map(m => [m]) : [matches]
      for (const taken of options) {
        const score = captureScore(v, [id, ...taken])
        if (score > top.score) top = { card: id, target: matches.length === 2 ? taken[0] : undefined, score }
      }
    }
    return top
  }

  return {
    play: (v: View) => {
      const { card, target } = best(v)
      return { card, target }
    },
    pick: (v: View, id: number, options: readonly number[]) =>
      [...options].sort((a, b) => captureScore(v, [id, b]) - captureScore(v, [id, a]))[0],
  }
}

export const steady: Strategy = {
  name: 'シズ',
  ...planner({ yaku: 12, caution: 1.2 }),
  // 堅実なので、役ができたらほぼ必ずあがる
  koikoi: (v, pts) => pts <= 1 && v.hand.length >= 6 && threats(v) === 0,
}

export const greedy: Strategy = {
  name: 'トラ',
  ...planner({ yaku: 20, caution: 0.6 }),
  koikoi: (v, pts) => {
    if (pts >= 7 || v.hand.length < 3 || v.koikoi[0] >= 2) return false
    return threats(v) <= 2
  },
}
