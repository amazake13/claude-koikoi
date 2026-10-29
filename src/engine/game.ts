import { CARDS, monthOf } from './cards'
import { shuffle } from './rng'
import { type Yaku, evaluate, points } from './yaku'

export type Seat = 0 | 1
export type Phase = 'deal' | 'play' | 'draw' | 'decide' | 'roundEnd' | 'gameEnd'

export interface RoundResult {
  winner: Seat | null
  points: number
  yaku: Yaku[]
  reason: 'stop' | 'teshi' | 'kuttsuki' | 'nagare'
}

export interface GameState {
  version: 1
  rng: number
  round: number
  oya: Seat
  turn: Seat
  phase: Phase
  deck: number[]
  field: number[]
  hands: [number[], number[]]
  captured: [number[], number[]]
  koikoi: [number, number]
  // こいこいした時点の役の点。これを超えたときだけ次の判断をする
  decidedAt: [number, number]
  scores: [number, number]
  result?: RoundResult
  stats: { games: number; wins: [number, number]; draws: number }
}

export type GameEvent =
  | { type: 'deal'; oya: Seat; result?: RoundResult }
  | { type: 'play' | 'draw'; seat: Seat; card: number; took: number[] }
  | { type: 'koikoi'; seat: Seat; yaku: Yaku[] }
  | { type: 'stop'; seat: Seat; result: RoundResult }
  | { type: 'gameEnd'; scores: [number, number] }

export interface View {
  round: number
  hand: readonly number[]
  field: readonly number[]
  mine: readonly number[]
  theirs: readonly number[]
  // 自分から見えない札。相手の手札と山札
  unseen: readonly number[]
  koikoi: readonly [mine: number, theirs: number]
}

export interface Strategy {
  name: string
  play(v: View): { card: number; target?: number }
  pick(v: View, card: number, options: readonly number[]): number
  koikoi(v: View, points: number, yaku: readonly Yaku[]): boolean
}

export const ROUNDS = 12
const LUCKY_HAND = 6

export function newGame(seed: number, oya: Seat = 0): GameState {
  return {
    version: 1,
    rng: seed | 0,
    round: 1,
    oya,
    turn: oya,
    phase: 'deal',
    deck: [],
    field: [],
    hands: [[], []],
    captured: [[], []],
    koikoi: [0, 0],
    decidedAt: [0, 0],
    scores: [0, 0],
    stats: { games: 0, wins: [0, 0], draws: 0 },
  }
}

export function viewOf(s: GameState, seat: Seat): View {
  const other = (1 - seat) as Seat
  return {
    round: s.round,
    hand: s.hands[seat],
    field: s.field,
    mine: s.captured[seat],
    theirs: s.captured[other],
    unseen: [...s.hands[other], ...s.deck],
    koikoi: [s.koikoi[seat], s.koikoi[other]],
  }
}

// 1回呼ぶごとに1手だけ進める。s は書き換えず、新しい状態を返す
export function step(prev: GameState, cpus: readonly [Strategy, Strategy]): [GameState, GameEvent] {
  const s: GameState = structuredClone(prev)
  switch (s.phase) {
    case 'deal':
      return [s, deal(s)]
    case 'play': {
      const seat = s.turn
      const choice = cpus[seat].play(viewOf(s, seat))
      const id = s.hands[seat].includes(choice.card) ? choice.card : s.hands[seat][0]
      s.hands[seat] = s.hands[seat].filter(c => c !== id)
      const took = take(s, seat, id, choice.target)
      s.phase = 'draw'
      return [s, { type: 'play', seat, card: id, took }]
    }
    case 'draw': {
      const seat = s.turn
      const id = s.deck.shift()!
      const options = s.field.filter(c => monthOf(c) === monthOf(id))
      const target = options.length === 2 ? cpus[seat].pick(viewOf(s, seat), id, options) : undefined
      const took = take(s, seat, id, target)
      if (points(s.captured[seat]) > s.decidedAt[seat]) s.phase = 'decide'
      else endTurn(s)
      return [s, { type: 'draw', seat, card: id, took }]
    }
    case 'decide': {
      const seat = s.turn
      const yaku = evaluate(s.captured[seat])
      const pts = points(s.captured[seat])
      const canGoOn = s.hands[seat].length > 0
      if (canGoOn && cpus[seat].koikoi(viewOf(s, seat), pts, yaku)) {
        s.koikoi[seat]++
        s.decidedAt[seat] = pts
        endTurn(s)
        return [s, { type: 'koikoi', seat, yaku }]
      }
      const result = finish(s, seat, pts, yaku, 'stop')
      return [s, { type: 'stop', seat, result }]
    }
    case 'roundEnd':
      if (s.round >= ROUNDS) {
        s.phase = 'gameEnd'
        const [a, b] = s.scores
        if (a === b) s.stats.draws++
        else s.stats.wins[a > b ? 0 : 1]++
        s.stats.games++
        return [s, { type: 'gameEnd', scores: s.scores }]
      }
      s.round++
      if (s.result?.winner != null) s.oya = s.result.winner
      return [s, deal(s)]
    case 'gameEnd':
      s.round = 1
      s.scores = [0, 0]
      s.oya = (1 - s.oya) as Seat
      return [s, deal(s)]
  }
}

function deal(s: GameState): GameEvent {
  let deck: number[]
  // 場に同じ月が4枚そろったら配り直す
  do {
    ;[deck, s.rng] = shuffle(CARDS.map(c => c.id), s.rng)
  } while (hasFour(deck.slice(16, 24)))
  s.hands = [deck.slice(0, 8), deck.slice(8, 16)]
  s.field = deck.slice(16, 24)
  s.deck = deck.slice(24)
  s.captured = [[], []]
  s.koikoi = [0, 0]
  s.decidedAt = [0, 0]
  s.result = undefined
  s.turn = s.oya

  for (const seat of [s.oya, 1 - s.oya] as Seat[]) {
    const lucky = luckyHand(s.hands[seat])
    if (lucky) {
      const result = finish(s, seat, LUCKY_HAND, [{ name: lucky === 'teshi' ? '手四' : 'くっつき', points: LUCKY_HAND }], lucky)
      return { type: 'deal', oya: s.oya, result }
    }
  }
  s.phase = 'play'
  return { type: 'deal', oya: s.oya }
}

function take(s: GameState, seat: Seat, id: number, target?: number): number[] {
  const matches = s.field.filter(c => monthOf(c) === monthOf(id))
  let taken: number[]
  if (matches.length === 0) {
    s.field.push(id)
    return []
  } else if (matches.length === 2) {
    taken = [target !== undefined && matches.includes(target) ? target : matches[0]]
  } else {
    taken = matches
  }
  s.field = s.field.filter(c => !taken.includes(c))
  const took = [id, ...taken]
  s.captured[seat].push(...took)
  return took
}

function endTurn(s: GameState) {
  if (s.hands[0].length === 0 && s.hands[1].length === 0) {
    s.result = { winner: null, points: 0, yaku: [], reason: 'nagare' }
    s.phase = 'roundEnd'
    return
  }
  s.turn = (1 - s.turn) as Seat
  s.phase = 'play'
}

function finish(s: GameState, seat: Seat, base: number, yaku: Yaku[], reason: RoundResult['reason']): RoundResult {
  let pts = base
  if (pts >= 7) pts *= 2
  if (s.koikoi[1 - seat] > 0) pts *= 2
  const result: RoundResult = { winner: seat, points: pts, yaku, reason }
  s.scores[seat] += pts
  s.result = result
  s.phase = 'roundEnd'
  return result
}

function hasFour(ids: number[]): boolean {
  const counts = new Map<number, number>()
  for (const id of ids) counts.set(monthOf(id), (counts.get(monthOf(id)) ?? 0) + 1)
  return [...counts.values()].some(n => n === 4)
}

function luckyHand(hand: number[]): 'teshi' | 'kuttsuki' | undefined {
  const counts = new Map<number, number>()
  for (const id of hand) counts.set(monthOf(id), (counts.get(monthOf(id)) ?? 0) + 1)
  const values = [...counts.values()]
  if (values.some(n => n === 4)) return 'teshi'
  if (values.every(n => n % 2 === 0)) return 'kuttsuki'
  return undefined
}
