import { describe, expect, it } from 'vitest'
import { CARDS, type GameState, greedy, newGame, points, steady, step, evaluate } from '.'

const names = (ids: number[]) => evaluate(ids).map(y => `${y.name}${y.points}`)

describe('役', () => {
  it('光札の役は一番高いものだけ', () => {
    expect(names([0, 8, 28, 44])).toEqual(['四光8'])
    expect(names([0, 8, 28, 40])).toEqual(['雨四光7'])
    expect(names([0, 8, 40])).toEqual([])
    expect(names([0, 8, 28, 40, 44])).toEqual(['五光10'])
  })

  it('短冊とタンは重なってつく', () => {
    expect(names([1, 5, 9, 21, 33])).toEqual(['赤短5', 'タン1'])
  })

  it('カスは10枚から、1枚ごとに1点', () => {
    const chaff = CARDS.filter(c => c.kind === 'chaff').map(c => c.id)
    expect(points(chaff.slice(0, 9))).toBe(0)
    expect(points(chaff.slice(0, 12))).toBe(3)
  })

  it('盃は花見と月見の両方に使える', () => {
    expect(names([8, 28, 32])).toEqual(['花見で一杯5', '月見で一杯5'])
  })
})

function invariant(s: GameState) {
  const all = [...s.deck, ...s.field, ...s.hands.flat(), ...s.captured.flat()]
  expect(all.length).toBe(48)
  expect(new Set(all).size).toBe(48)
}

describe('対局', () => {
  it('200局回しても札が増減せず、必ず終わる', () => {
    let s = newGame(12345)
    let games = 0
    for (let i = 0; games < 200; i++) {
      const [next, event] = step(s, [steady, greedy])
      if (next.phase !== 'gameEnd' && next.phase !== 'roundEnd') invariant(next)
      if (event.type === 'gameEnd') games++
      s = next
      expect(i).toBeLessThan(200 * 12 * 40)
    }
    expect(s.stats.games).toBe(200)
    expect(s.stats.wins[0] + s.stats.wins[1] + s.stats.draws).toBe(200)
  })

  it('同じシードなら同じ対局になる', () => {
    const run = () => {
      let s = newGame(7)
      const log: string[] = []
      for (let i = 0; i < 300; i++) {
        let e
        ;[s, e] = step(s, [steady, greedy])
        log.push(JSON.stringify(e))
      }
      return log
    }
    expect(run()).toEqual(run())
  })

  it('step は元の状態を書き換えない', () => {
    const s = newGame(1)
    const before = JSON.stringify(s)
    step(s, [steady, greedy])
    expect(JSON.stringify(s)).toBe(before)
  })
})
