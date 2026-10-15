import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { useBlocker } from 'react-router'
import styles from './TeachingScript.module.css'

// つまずいたときに出すヒント。上から順に、少しずつ手助けを大きくする
interface Hint {
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

// 始める前に読む内容。30秒ほどで読める量にする
interface Prepare {
  // この問題で、お子さんができるようになること
  goal: ReactNode
  // 用意するもの
  materials: string[]
  // いちばん大事なこと（1つだけ）
  point: ReactNode
  // 言わないようにしたいこと
  avoid: string[]
}

interface Props {
  prepare: Prepare
  turns: Turn[]
  // 最後に、わかったかを確かめる声掛け
  check: string[]
}

// ステップの中で、今どの場面か
type Phase =
  | { kind: 'ask' }
  // level がヒントの番号。ヒントを使い切ると level === stuck.length になり、いっしょにやる
  | { kind: 'hint'; level: number }
  | { kind: 'praise' }

// 1画面に出す、親の1つの行動
type Beat =
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
  | { kind: 'wait'; expect: string; retry: boolean }
  | { kind: 'finish' }

// beat は、その場面の何画面目か
interface Position {
  turn: number
  phase: Phase
  beat: number
}

const START: Position = { turn: 0, phase: { kind: 'ask' }, beat: 0 }

// 教えている間は、スマホの画面が自動で消えないようにする
function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return
    // 取り直しが重なると、取れた分だけ解除用の札（sentinel）が届く。1つでも残ると画面が消えなくなるので、すべて覚えておく
    const locks = new Set<WakeLockSentinel>()
    let cancelled = false
    const request = () => {
      if (document.visibilityState !== 'visible') return
      navigator.wakeLock.request('screen').then(
        (sentinel) => {
          if (cancelled) sentinel.release()
          else locks.add(sentinel)
        },
        // 電池が少ないときなどは断られる。画面が消えるだけなので、何もしない
        () => {},
      )
    }
    request()
    // 別のアプリに切り替えると解除されるので、戻ってきたら取り直す
    document.addEventListener('visibilitychange', request)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', request)
      for (const lock of locks) lock.release()
      locks.clear()
    }
  }, [active])
}

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
function beatsOf(turn: Turn, phase: Phase): Beat[] {
  const beats: Beat[] = []
  const stuck = turn.stuck ?? []
  const reveal = () => {
    if (turn.reveal != null && turn.reveal !== false)
      beats.push({ kind: 'show', content: turn.reveal })
  }
  const wait = (retry: boolean) => {
    if (turn.expect !== undefined)
      beats.push({ kind: 'wait', expect: turn.expect, retry })
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
        text: `手を動かしながら、答え（${turn.expect}）を いっしょに確かめる`,
      })
      reveal()
    }
  }
  return beats
}

// 最後の確かめ。1つずつ声をかけて、おしまいの画面で終わる
function checkBeats(check: string[]): Beat[] {
  return [
    ...check.map((say): Beat => ({
      kind: 'say',
      label: 'さいごに 確かめる',
      say,
    })),
    { kind: 'finish' },
  ]
}

function PrepareView({
  prepare,
  turns,
  onStart,
}: {
  prepare: Prepare
  turns: Turn[]
  onStart: () => void
}) {
  return (
    <div className={styles.prepare}>
      <h2 className={styles.prepareTitle}>はじめる前に</h2>
      <dl className={styles.facts}>
        <dt>ねらい</dt>
        <dd>{prepare.goal}</dd>
        <dt>用意するもの</dt>
        <dd>{prepare.materials.join('・')}</dd>
        <dt>いちばん大事なこと</dt>
        <dd>{prepare.point}</dd>
        <dt>言わないようにしたいこと</dt>
        <dd>
          <ul>
            {prepare.avoid.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
        </dd>
      </dl>
      <details className={styles.why}>
        <summary>声掛けの流れを見る（{turns.length}ステップ）</summary>
        <ol className={styles.flow}>
          {turns.map((turn) => (
            <li key={turn.say}>{turn.say}</li>
          ))}
        </ol>
      </details>
      <div className={styles.actions}>
        <button className={styles.primary} type="button" onClick={onStart}>
          はじめる
        </button>
      </div>
    </div>
  )
}

// 画面の見出し。何をする画面かを、アイコンと短い言葉で示す（アイコンは読み上げない）
const HEADINGS = {
  do: ['✋', 'すること'],
  say: ['💬', '声をかける'],
  show: ['📱', '画面を見せる'],
  wait: ['⏳', '待つ'],
  finish: ['🎉', 'おしまい'],
} as const

// 画面が替わったときに読み上げる文。正解のめやすは入れない
// （読み上げ機能を使っていると、考えているお子さんに答えが聞こえてしまうため）
function announcement(beat: Beat) {
  const heading = HEADINGS[beat.kind][1]
  switch (beat.kind) {
    case 'do':
      return `${heading}。${beat.text}`
    case 'say':
      return `${heading}。${beat.label ? `${beat.label}。` : ''}${beat.say}`
    case 'show':
      return beat.say
        ? `${heading}。見せながら、こう声をかける。${beat.say}`
        : `${heading}。いっしょに確かめる`
    case 'wait':
      return `${heading}。答えるまで だまって待つ`
    case 'finish':
      return heading
  }
}

// 1画面の中身。行動は1つだけにして、それ以外の情報は出さない
function BeatView({ beat }: { beat: Beat }) {
  switch (beat.kind) {
    case 'do':
      return <p className={styles.main}>{beat.text}</p>
    case 'say':
    case 'show':
      return (
        <>
          {beat.kind === 'show' && (
            <p className={styles.main}>
              {beat.say ? '見せながら、こう声をかける' : 'いっしょに確かめる'}
            </p>
          )}
          {beat.say && (
            <div className={styles.speech}>
              <img className={styles.mascot} src="/mascot.png" alt="" />
              <div>
                {beat.label && <p className={styles.label}>{beat.label}</p>}
                <p className={styles.bubble}>{beat.say}</p>
              </div>
            </div>
          )}
          {beat.why && (
            <details className={styles.why}>
              <summary>なぜ？</summary>
              {beat.why}
            </details>
          )}
        </>
      )
    case 'wait':
      return (
        <>
          <p className={styles.main}>
            {beat.retry ? 'もう一度、' : ''}答えるまで だまって待つ
          </p>
          <p className={styles.expect}>正解のめやす：{beat.expect}</p>
        </>
      )
    case 'finish':
      return (
        <p className={styles.main}>今日はおしまいです。おつかれさまでした。</p>
      )
  }
}

// 台本の途中でページを離れようとしたときの確認。ブラウザの confirm() ではなく、アプリの見た目で聞く。
// 「続ける」を押すか、Esc などで閉じたら、ページに残る
function LeaveConfirm({
  onStay,
  onLeave,
}: {
  onStay: () => void
  onLeave: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useEffect(() => {
    dialog.current?.showModal()
  }, [])

  return (
    <dialog
      className={styles.confirm}
      ref={dialog}
      aria-labelledby={titleId}
      onClose={onStay}
    >
      <h2 id={titleId}>台本の途中です</h2>
      <p>このページを離れると、はじめからになります。</p>
      <div className={styles.confirmButtons}>
        {/* 何も考えずに押しても進み具合が消えないよう、続けるほうを先に置く（開いたときに選ばれる） */}
        <button
          className={styles.primary}
          type="button"
          onClick={() => dialog.current?.close()}
        >
          続ける
        </button>
        <button type="button" onClick={onLeave}>
          離れる
        </button>
      </div>
    </dialog>
  )
}

// 教えている最中に使う台本。親の行動を1画面に1つずつ出し、
// お子さんの反応（できた／つまずいた）に合わせて、ほめ言葉やヒントに切り替える
export function TeachingScript({ prepare, turns, check }: Props) {
  const [started, setStarted] = useState(false)
  // 戻るボタンのために、通ってきた位置をすべて覚えておく
  const [history, setHistory] = useState<Position[]>([START])
  // 画面を、進むときは下から、戻るときは上から入れる
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')
  const dialog = useRef<HTMLDialogElement>(null)
  const actions = useRef<HTMLDivElement>(null)

  const position = history[history.length - 1]
  const { turn: index, phase } = position
  const turn = turns[index]
  const beats = turn ? beatsOf(turn, phase) : checkBeats(check)
  const beat = beats[position.beat]
  // おしまいの画面まで来たら、画面が自動で消えるように戻す
  useWakeLock(started && beat.kind !== 'finish')

  // 台本の途中でページを離れると（iOS のスワイプで戻る など）はじめからになるので、離れる前に確かめる
  const blocker = useBlocker(started && beat.kind !== 'finish')

  // 押したボタンが次の画面で消えたとき（「つまずいた」など）は、
  // キーボードや読み上げで操作している人が迷わないよう、主なボタンへ移す
  useEffect(() => {
    if (document.activeElement === document.body)
      actions.current?.querySelector('button')?.focus()
  }, [history, started])

  const go = (next: Position) => {
    // 中身のない場面（ほめ言葉も見せる画面もない、など）は飛ばして、次のステップへ
    const target =
      next.turn < turns.length &&
      beatsOf(turns[next.turn], next.phase).length === 0
        ? { turn: next.turn + 1, phase: { kind: 'ask' } as const, beat: 0 }
        : next
    setHistory([...history, target])
    setDirection('forward')
  }
  const nextTurn = () =>
    go({ turn: index + 1, phase: { kind: 'ask' }, beat: 0 })
  // 場面の最後の画面なら、次のステップへ（待つ画面は、反応のボタンで進む）
  const advance = () =>
    position.beat < beats.length - 1
      ? go({ ...position, beat: position.beat + 1 })
      : nextTurn()
  const done = () => go({ turn: index, phase: { kind: 'praise' }, beat: 0 })
  const level = phase.kind === 'hint' ? phase.level : -1
  const stuck = () =>
    go({ turn: index, phase: { kind: 'hint', level: level + 1 }, beat: 0 })

  const start = () => {
    setHistory([START])
    setStarted(true)
    window.scrollTo(0, 0)
  }
  const back = () => {
    if (history.length > 1) setHistory(history.slice(0, -1))
    else setStarted(false)
    setDirection('back')
  }

  if (!started)
    return <PrepareView prepare={prepare} turns={turns} onStart={start} />

  return (
    // data-script-running がある間は、ページのパンくずリストと見出しを隠す（index.css）
    <div className={styles.script} data-script-running>
      <Progress count={turns.length} current={index} onBack={back} />
      {/* 画面が替わったことを、読み上げで伝える */}
      <p className={styles.srOnly} aria-live="polite">
        {announcement(beat)}
      </p>
      {/* ボタンは押したまま残したいので、入れ替わるパネルの外に置く */}
      <div
        className={styles.panel}
        key={history.length}
        data-direction={direction}
      >
        <h2 className={styles.heading}>
          <span aria-hidden="true">{HEADINGS[beat.kind][0]}</span>{' '}
          {HEADINGS[beat.kind][1]}
        </h2>
        <BeatView beat={beat} />
      </div>
      {beat.kind === 'show' && (
        // お子さんに見せる画面。親向けの文字が目に入らないように、画面全体をおおう。
        // 閉じたら、見せ終わったものとして次の画面へ進む
        <dialog
          className={styles.child}
          ref={dialog}
          aria-label="お子さんの画面"
          onClose={advance}
        >
          <div className={styles.childPanel}>{beat.content}</div>
          <button
            className={styles.close}
            type="button"
            onClick={() => dialog.current?.close()}
          >
            おうちの人の画面にもどる
          </button>
        </dialog>
      )}
      {blocker.state === 'blocked' && (
        <LeaveConfirm
          onStay={() => blocker.reset()}
          onLeave={() => blocker.proceed()}
        />
      )}
      <div className={styles.actions} ref={actions}>
        {/* 押したボタンが消えてフォーカスを失わないように、主なボタンは同じ key で残す */}
        {beat.kind === 'wait' ? (
          <>
            <button
              className={styles.primary}
              type="button"
              key="primary"
              onClick={done}
            >
              できた！
            </button>
            <button type="button" onClick={stuck}>
              {beat.retry ? 'まだ むずかしそう' : 'つまずいた'}
            </button>
          </>
        ) : beat.kind === 'show' ? (
          <button
            className={styles.primary}
            type="button"
            key="primary"
            onClick={() => dialog.current?.showModal()}
          >
            お子さんに見せる
          </button>
        ) : beat.kind === 'finish' ? (
          <button
            className={styles.primary}
            type="button"
            key="primary"
            onClick={start}
          >
            もういちど はじめから
          </button>
        ) : (
          <button
            className={styles.primary}
            type="button"
            key="primary"
            onClick={advance}
          >
            つぎへ
          </button>
        )}
      </div>
    </div>
  )
}

function Progress({
  count,
  current,
  onBack,
}: {
  count: number
  current: number
  onBack: () => void
}) {
  return (
    <div className={styles.progress}>
      <button className={styles.back} type="button" onClick={onBack}>
        ← もどる
      </button>
      <span className={styles.dots} aria-hidden="true">
        {Array.from({ length: count }, (_, i) => (
          <span className={styles.dot} key={i} data-done={i < current} />
        ))}
      </span>
      <span className={styles.count}>
        {Math.min(current + 1, count)} / {count}
      </span>
    </div>
  )
}
