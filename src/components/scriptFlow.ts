import type { ReactNode } from 'react'

// 台本（TeachingScript）の流れを決める部分。画面を描く TeachingScript と、
// 動線一覧（開発用）の FlowTree が、同じ流れをたどれるように分けておく

// つまずいたときに出すヒント。上から順に、少しずつ手助けを大きくする
export interface Hint {
  // 声をかける前に、親がすること
  do?: string
  // 親が言うこと
  say: string
  // このヒントで、お子さんに見せる画面
  show?: ReactNode
}

// 台本の1ステップ。親が言うこと（say）を中心に、必要なものだけを書く。
// 画面には、ここから「する → 声をかける（見せる）→ 待つ」の順に、1画面に1つずつ出す
export interface Turn {
  // 親がお子さんに言うこと
  say: string
  // 声をかける前に、親がすること（準備）
  do?: string
  // 声をかけるときに、お子さんに見せる画面（図や、問題の文）。
  // 書いたステップでは、台本が「画面を見せながら声をかける」と指示する。
  // お子さんが実物（おはじきなど）や自分の頭で考える場面では書かない。答えがわかるものは入れない
  show?: ReactNode
  // できた後（ほめた後、または、いっしょにやった後）にお子さんに見せる画面。答えの入った図など
  reveal?: ReactNode
  // お子さんの正しい答えのめやす。書くと「待つ」画面と「できた／つまずいた」のボタンが出る。
  // 書かないステップ（問題を読み聞かせるだけ、など）は、声をかけたら次へ進む
  expect?: string
  // なぜこう言うのか（教え方）。声をかける画面で、押したときだけ出す
  why?: ReactNode
  // つまずいたときのヒント。使い切ったら「いっしょにやってみよう」になる
  stuck?: Hint[]
  // できたときのほめ言葉
  praise?: string
}

// 答えを待つステップ（問題と確かめ）。正解のめやすは必ず書く
export type Asked = Turn & { expect: string }

// 台本の流れ。問題 →（むずかしければ）いっしょに解く → 確かめ → おしまい
export interface Script {
  // 最初に出す問題。お子さんがすぐ答えられたら、確かめ（check）へ進む
  question: Asked
  // 問題がむずかしそうなときに、いっしょに解く手順
  turns: Turn[]
  // わかったかを確かめる声掛け。すぐ答えられたのに確かめで答えられなければ、いっしょに解く手順（turns）へ進む
  check: Asked[]
}

// 台本の中の区切り
export type Section = 'question' | 'guide' | 'check' | 'finish'

// 待つ画面のボタンの文字
const REACTIONS = {
  question: { done: '答えられた！', stuck: 'むずかしそう' },
  guide: { done: 'できた！', stuck: 'つまずいた' },
  check: { done: '答えられた！', stuck: 'むずかしそう' },
}

// ステップの中で、今どの場面か
export type Phase =
  | { kind: 'ask' }
  // level がヒントの番号。ヒントを使い切ると level === stuck.length になり、いっしょにやる
  | { kind: 'hint'; level: number }
  | { kind: 'praise' }

// 1画面に出す、親の1つの行動
export type Beat =
  | { kind: 'do'; text: string }
  // label は、ふつうの声掛け以外（ヒント・ほめる など）のときだけ、吹き出しの上に出す
  | { kind: 'say'; label?: string; say: string; why?: ReactNode }
  // say がなければ、見せて確かめるだけ
  | {
      kind: 'show'
      content: ReactNode
      label?: string
      say?: string
      why?: ReactNode
    }
  // done・stuck は反応のボタンの文字。retry は、ヒントを出した後にもう一度待つとき
  | {
      kind: 'wait'
      expect: string
      retry: boolean
      done: string
      stuck: string
    }
  | { kind: 'finish' }

// 画面の見出し。何をする画面かを、アイコンと短い言葉で示す
export const HEADINGS = {
  do: ['✋', 'すること'],
  say: ['💬', '声をかける'],
  show: ['📱', '画面を見せる'],
  wait: ['⏳', '待つ'],
  finish: ['🎉', 'おしまい'],
} as const

// turn は台本の何ステップ目か（問題・いっしょに解く手順・確かめを順につないだ番号）、
// beat は、その場面の何画面目か
export interface Position {
  turn: number
  phase: Phase
  beat: number
}

// 親の操作。next は「つぎへ」（見せる画面では、お子さんの画面を閉じたとき）、
// done・stuck は待つ画面の反応のボタン、finish は「おわる」
export type Action = 'next' | 'done' | 'stuck' | 'finish'

// 声をかける画面。見せるものがあれば、見せながら声をかける画面にする
function speak(
  label: string | undefined,
  say: string,
  show: ReactNode,
  why?: ReactNode,
): Beat {
  return show == null || show === false
    ? { kind: 'say', label, say, why }
    : { kind: 'show', content: show, label, say, why }
}

// 1つの場面を、親の行動ごとの画面に分ける
function beatsOf(
  turn: Turn,
  phase: Phase,
  section: Exclude<Section, 'finish'>,
): Beat[] {
  const beats: Beat[] = []
  const stuck = turn.stuck ?? []
  const reveal = () => {
    if (turn.reveal != null && turn.reveal !== false)
      beats.push({ kind: 'show', content: turn.reveal })
  }
  const wait = (retry: boolean) => {
    const { done, stuck } = REACTIONS[section]
    if (turn.expect !== undefined)
      beats.push({
        kind: 'wait',
        expect: turn.expect,
        retry,
        done,
        stuck: retry ? 'まだ むずかしそう' : stuck,
      })
  }

  if (phase.kind === 'ask') {
    if (turn.do) beats.push({ kind: 'do', text: turn.do })
    beats.push(speak(undefined, turn.say, turn.show, turn.why))
    wait(false)
  } else if (phase.kind === 'praise') {
    if (turn.praise)
      beats.push({ kind: 'say', label: 'ほめる', say: turn.praise })
    reveal()
  } else {
    const hint = stuck[phase.level]
    if (hint) {
      if (hint.do) beats.push({ kind: 'do', text: hint.do })
      beats.push(speak(`ヒント${phase.level + 1}`, hint.say, hint.show))
      wait(true)
    } else {
      beats.push({
        kind: 'say',
        label: 'いっしょにやる',
        say: 'いっしょに やってみよう',
      })
      beats.push({
        kind: 'do',
        text: `手を動かしながら、いっしょに確かめる（めやす：${turn.expect}）`,
      })
      reveal()
    }
  }
  return beats
}

// 台本の流れをたどるための関数をまとめて作る
export function createFlow({ question, turns, check }: Script) {
  // 問題・いっしょに解く手順・確かめを1列に並べる。GUIDE からがいっしょに解く手順、
  // CHECK からが確かめ、FINISH がおしまいの画面
  const script: Turn[] = [question, ...turns, ...check]
  const GUIDE = 1
  const CHECK = GUIDE + turns.length
  const FINISH = script.length

  const sectionOf = (turn: number): Section =>
    turn < GUIDE
      ? 'question'
      : turn < CHECK
        ? 'guide'
        : turn < FINISH
          ? 'check'
          : 'finish'
  const beatsAt = ({ turn, phase }: Position): Beat[] => {
    const section = sectionOf(turn)
    return section === 'finish'
      ? [{ kind: 'finish' }]
      : beatsOf(script[turn], phase, section)
  }
  const ask = (turn: number): Position => ({
    turn,
    phase: { kind: 'ask' },
    beat: 0,
  })
  const START = ask(0)
  // ステップを終えた後の行き先。問題に答えられたら、いっしょに解く手順をとばして確かめへ
  const after = (turn: number) => (turn < GUIDE ? CHECK : turn + 1)
  // 中身のない場面（ほめ言葉も見せる画面もない、など）は飛ばして、次のステップへ
  const settle = (next: Position) =>
    next.turn < FINISH && beatsAt(next).length === 0
      ? ask(after(next.turn))
      : next
  // いっしょに解く手順を通ったか（通ってきた位置から決める）
  const visitedGuide = (history: Position[]) =>
    history.some((p) => sectionOf(p.turn) === 'guide')

  // 今の位置で操作したときの、次の位置。visited は、いっしょに解く手順を通ったか
  const step = (
    position: Position,
    visited: boolean,
    action: Action,
  ): Position => {
    const { turn, phase } = position
    switch (action) {
      case 'next':
        // 場面の最後の画面なら、次のステップへ
        return position.beat < beatsAt(position).length - 1
          ? { ...position, beat: position.beat + 1 }
          : settle(ask(after(turn)))
      case 'done':
        return settle({ turn, phase: { kind: 'praise' }, beat: 0 })
      case 'stuck': {
        // 問題がむずかしそうなとき、または、すぐ答えられたのに確かめで答えられないとき
        // （たまたま当たった など）は、いっしょに解く手順へ。それ以外はヒントを出す
        if (sectionOf(turn) !== 'guide' && !visited && turns.length > 0)
          return ask(GUIDE)
        const level = phase.kind === 'hint' ? phase.level : -1
        return settle({
          turn,
          phase: { kind: 'hint', level: level + 1 },
          beat: 0,
        })
      }
      case 'finish':
        // わかったところで、いつでも終われるようにする
        return ask(FINISH)
    }
  }

  // 操作を順にたどって、通ってきた位置の並びを作る
  const replay = (actions: Action[]): Position[] => {
    const history = [START]
    for (const action of actions)
      history.push(
        step(history[history.length - 1], visitedGuide(history), action),
      )
    return history
  }

  return {
    START,
    GUIDE,
    CHECK,
    FINISH,
    sectionOf,
    beatsAt,
    visitedGuide,
    step,
    replay,
  }
}

export type Flow = ReturnType<typeof createFlow>

// 操作の並びを URL に入れるための短い文字（動線一覧から、途中の画面を開くときに使う）
const CODES: Record<Action, string> = {
  next: 'n',
  done: 'd',
  stuck: 's',
  finish: 'f',
}

export function encodeActions(actions: Action[]) {
  return actions.map((action) => CODES[action]).join('')
}

// 読めない文字があれば null
export function decodeActions(text: string): Action[] | null {
  const byCode = Object.fromEntries(
    Object.entries(CODES).map(([action, code]) => [code, action as Action]),
  )
  const actions = [...text].map((code) => byCode[code])
  return actions.every(Boolean) ? actions : null
}
