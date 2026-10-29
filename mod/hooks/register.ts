import type { EngineInterface, Register } from 'claude-code'

type $ = EngineInterface

// ビューア (このリポジトリの Electron アプリ) と取り決めた置き場所
//   ticks/<時刻>-<乱数>.<種類>  空のファイル。種類は tick / pause / step / top / reset / show
//   state.json                 ビューアが書く対局の要約
//   launch.json                ビューアが起動時に書く、自分を起動し直すための argv
const KINDS = ['show', 'pause', 'step', 'top', 'reset'] as const
type Kind = 'tick' | (typeof KINDS)[number]

interface Status {
  round: number
  oya: number
  names: string[]
  scores: [number, number]
  paused: boolean
  message: string
}

let dir: string | undefined
let seq = 0

async function base($: $) {
  dir ??= `${(await $.env.get('HOME')) ?? (await $.env.get('USERPROFILE'))}/.claude/koikoi`
  return dir
}

async function send($: $, kind: Kind) {
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${seq++}.${kind}`
  await $.fs.write(`${await base($)}/ticks/${name}`, '')
}

async function showStatus($: $) {
  try {
    const s: Status = JSON.parse(await $.fs.read(`${await base($)}/state.json`))
    const [a, b] = s.scores
    $.ui.status(`花札 ${s.round}月 ${s.names[0]}${a}-${b}${s.names[1]}${s.paused ? ' 停止中' : ''}`)
  } catch {
    $.ui.status(undefined)
  }
}

// 二重に起動してもビューア側が1つにまとめるので、毎回起動してよい
async function launch($: $): Promise<boolean> {
  let argv: string[]
  try {
    argv = JSON.parse(await $.fs.read(`${await base($)}/launch.json`)).argv
  } catch {
    return false
  }
  // Claude Code を閉じてもビューアが残るよう、切り離して起動する
  const detached = argv[0].toLowerCase().endsWith('.exe')
    ? ['cmd', '/c', 'start', '""', ...argv]
    : ['/bin/sh', '-c', 'nohup "$0" "$@" >/dev/null 2>&1 &', ...argv]
  const { exitCode } = await $.process.run(detached, { timeoutMs: 10_000 })
  return exitCode === 0
}

function advance($: $) {
  void send($, 'tick')
    .then(() => showStatus($))
    .catch(() => {})
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const started = await next(e)
    await $.command.register({
      name: 'koikoi',
      description: '花札こいこいのウインドウを操作する (show / pause / step / top / reset)',
    })
    if (await launch($).catch(() => false)) await showStatus($)
    else $.ui.status('花札: 先にビューアを npm start で一度起動してください')
    return started
  })

  // 花札の都合でツール呼び出しを止めない
  on('tool.call', async ($, e, next) => {
    const result = await next(e)
    advance($)
    return result
  }).catch(($, e, next) => next(e))

  on('prompt.submit', async ($, e, next) => {
    advance($)
    return next(e)
  }).catch(($, e, next) => next(e))

  on('command.run', { command: 'koikoi' }, async ($, e) => {
    const arg = e.args.trim() || 'show'
    if (!(KINDS as readonly string[]).includes(arg)) return { text: `使い方: /koikoi [${KINDS.join(' | ')}]` }
    if (arg === 'show' && !(await launch($).catch(() => false)))
      return { text: 'ビューアの起動方法がまだ分かりません。リポジトリのフォルダで一度 npm start を実行してください。' }
    await send($, arg as Kind)
    const done: Record<string, string> = {
      show: '花札のウインドウを出しました。',
      pause: '一時停止を切り替えました。',
      step: '一手進めました。',
      top: '最前面表示を切り替えました。',
      reset: '対局を最初からやり直します。',
    }
    return { text: done[arg] }
  })
}
