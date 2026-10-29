import type { GameEvent, GameState } from './engine'

export interface Update {
  state: GameState
  // 起動直後やリセットでは手がないので、並べ直すだけ
  event?: GameEvent
  // まだ処理していない tick の数。多いほど演出を速くする
  pending: number
  paused: boolean
  // true なら盤面をそのまま並べ直す。false で event もなければ、一時停止などの表示だけ変える
  snap: boolean
}

export type Command = 'pause' | 'step' | 'top' | 'reset'

export interface Api {
  onUpdate(cb: (u: Update) => void): void
  ready(): void
  send(cmd: Command): void
}
