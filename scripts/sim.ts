// 1局を最後まで自動で打たせて、手順を文字で出す
import { type GameState, card, greedy, newGame, steady, step } from '../src/engine'

const cpus = [steady, greedy] as const
const seed = Number(process.argv[2] ?? Date.now())
const names = (ids: readonly number[]) => ids.map(id => card(id).name).join(' ')

let s: GameState = newGame(seed)
console.log(`seed ${seed}`)
for (;;) {
  const [next, e] = step(s, cpus)
  s = next
  switch (e.type) {
    case 'deal':
      console.log(`\n== ${s.round}月 親:${cpus[e.oya].name} ==`)
      console.log(`場: ${names(s.field)}`)
      if (e.result) console.log(`${cpus[e.result.winner!].name} ${e.result.yaku[0].name} ${e.result.points}点`)
      break
    case 'play':
    case 'draw':
      console.log(
        `${cpus[e.seat].name} ${e.type === 'play' ? '出す' : 'めくる'} ${card(e.card).name}` +
          (e.took.length ? ` → 取る ${names(e.took.slice(1))}` : ' → 場へ'),
      )
      break
    case 'koikoi':
      console.log(`${cpus[e.seat].name} こいこい! (${e.yaku.map(y => y.name).join('・')})`)
      break
    case 'stop':
      console.log(`${cpus[e.seat].name} 勝負! ${e.result.yaku.map(y => `${y.name}${y.points}`).join('・')} → ${e.result.points}点`)
      break
    case 'gameEnd':
      console.log(`\n終局 ${cpus[0].name} ${e.scores[0]} - ${e.scores[1]} ${cpus[1].name}`)
      process.exit(0)
  }
  if (s.phase === 'roundEnd' && s.result?.reason === 'nagare') console.log('流れ')
}
