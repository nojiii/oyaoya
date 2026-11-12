import { useEffect, useRef, useState, type ReactNode, type Ref } from 'react'
import { flushSync } from 'react-dom'
import { Link, useLocation, useLoaderData } from 'react-router'
import type { loadProblem } from '../pages/loaders'
import styles from './TeachingScript.module.css'
import { CounterDisplay, type CounterProblem } from './CounterDisplay'
import { Oyajii } from './Oyajii'
import { ScriptGuideSlide } from './ScriptGuide'
import { GUIDE_TITLE, useScriptGuide } from './scriptGuideState'
import { NextPageButton, PageEdges } from './ScriptPaging'
import { ScriptControls } from './scriptControls'
import { ScriptCurtain, type Curtain } from './ScriptCurtain'
import { ScriptHelp, type ScriptHelpContent } from './ScriptHelp'
import { TeachingStep, type TeachingStepContent } from './TeachingStep'

// 台本の1ステップ。親が言うこと（say）を中心に、必要なものだけを書く。
// 台本の画面には「声をかける →（reveal があれば）解説を確認する」の順に出す
export interface Turn extends TeachingStepContent {
  // 声をかける前に、親がすること（準備）。
  do?: string
  // 教材ごとの教え方のヒント（元の台本データ）。
  how?: string
  // このステップで避けたい声かけ。
  avoid?: string[]
  // 問題（question）の図や文。台本の上部に常に出す。いっしょに解く手順（turns）では使わない
  show?: ReactNode
  // 声をかけた後に、親が確認する解説図
  reveal?: ReactNode
  // この声かけをする理由（元の台本データ）。
  why?: ReactNode
}

// 問題ごとに書く、教えるための内容。point 以外は準備の画面に出す（30秒ほどで読める量にする）
interface Prepare {
  // 準備の画面に「声かけを先に読んでおく」の行を出すか（書かなければ出す）
  sayPreview?: boolean
  // この問題で、お子さんができるようになること
  goal: ReactNode
  // 用意するもの。1つずつ、数も書く（例：「おはじきを7こ」）
  materials: string[]
  // 台本の大まかな流れ。準備の画面に、番号つきのステップで出す。
  // 1つは「問題を読む」のような短い言葉にし、全部で3〜6こにまとめる（台本のページと1対1にしなくてよい）
  steps: string[]
  // いちばん大事なこと（1つだけ）。台本の「困ったら」の「何を言えばいいか迷う」で出す
  point: ReactNode
}

// ページを分けた台本（flow）の進み具合。最後のページ（たしかめ）まで進んだら finished
export type FlowStatus = 'start' | 'middle' | 'finished'

interface Props {
  flow?: ReactNode
  // flow の進み具合を、保存した内容から読む。準備の画面を出すか、続きから始めるかを決める
  flowStatus?: () => FlowStatus
  // ステップごとに出す図（おはじき（counters）を使うときは出さない）
  renderVisual?: (step: number) => ReactNode
  // 台本の下に出す、おはじきの画面
  counters?: CounterProblem
  // 問題の数字を変える入力欄
  editor?: ReactNode
  // 準備の画面のステージに大きく出す図。問題の数字を変える欄は、図の下に並べて出す
  picture?: ReactNode
  prepare: Prepare
  // 教える問題。台本の上部に常時表示する
  question: Turn
  // 順番に読み上げる、解き方の台本
  turns: Turn[]
  // 台本の右上の「困ったら」で出す答えのうち、この問題に合わせて書き換えるもの（ScriptHelp）
  help?: ScriptHelpContent
}

type Section = 'question' | 'guide' | 'finish'

// 1画面に出す、親の1つの行動
type Beat =
  | { kind: 'do'; text: string }
  // label は、ふつうの声掛け以外（ヒント・ほめる など）のときだけ、吹き出しの上に出す
  | ({ kind: 'say'; why?: ReactNode } & TeachingStepContent)
  // say がなければ、見せて確かめるだけ
  | {
      kind: 'show'
      content: ReactNode
      label?: string
      say?: string
      why?: ReactNode
    }
  | { kind: 'finish' }

// turn は台本の何ステップ目か（問題・いっしょに解く手順・確かめを順につないだ番号）、
// beat は、その場面の何画面目か
interface Position {
  turn: number
  beat: number
}

const START: Position = { turn: 0, beat: 0 }

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

// 教える手順を、反応による分岐のない台本にする。
function beatsOf(turn: Turn): Beat[] {
  const beats: Beat[] = []
  beats.push({
    kind: 'say',
    say: turn.say,
    sayContent: turn.sayContent,
    parentNote: turn.parentNote,
    resourceHint: turn.resourceHint,
    label: turn.label,
  })
  if (turn.reveal != null && turn.reveal !== false) {
    beats.push({ kind: 'show', content: turn.reveal })
  }
  return beats
}

function PrepareView({
  counters,
  editor,
  picture,
  prepare,
  question,
  turns,
  onStart,
  resume,
  startButton,
}: Props & {
  onStart: (button: HTMLButtonElement) => void
  resume?: boolean
  // 「終わる」の幕が縮んでいく先
  startButton?: Ref<HTMLButtonElement>
}) {
  const symbol =
    counters?.mode === 'times'
      ? '×'
      : counters?.mode === 'sub' || counters?.mode === 'borrow'
        ? '−'
        : '＋'
  const learning = counters
    ? counters.mode === 'count'
      ? `${counters.a}このおはじきを、一緒に数えます。`
      : `${counters.a}${symbol}${counters.b}を、おはじきを使って一緒に考えます。`
    : prepare.goal
  return (
    <div className={styles.prepare}>
      {/* ステージ：今日の問題の図を大きく出し、その下で数を変えられるようにする */}
      <div className={styles.stage}>
        {picture == null && editor == null ? (
          <Oyajii className={styles.stageMascot} />
        ) : (
          <>
            {picture}
            {editor}
          </>
        )}
      </div>

      {/* 大事なこと：大きく太く */}
      <header className={styles.prepareHeading}>
        <h2 className={styles.prepareTitle}>この学習でやること</h2>
        <p className={styles.learning}>{learning}</p>
      </header>
      {/* 始める前に手もとにそろえるもの */}
      <section className={styles.prepareHeading}>
        <h2 className={styles.prepareTitle}>用意するもの</h2>
        {/* list-style をなくすと、Safari の読み上げでリストと伝わらなくなるため、role で補う */}
        <ul className={styles.materials} role="list">
          {prepare.materials.map((material) => (
            <li key={material}>{material}</li>
          ))}
        </ul>
      </section>
      {/* 台本の流れ：番号つきのステップを縦に並べ、線でつなぐ */}
      <section className={styles.prepareHeading}>
        <h2 className={styles.prepareTitle}>教え方の流れ</h2>
        <ol className={styles.steps} role="list">
          {prepare.steps.map((step, i) => (
            <li key={step}>
              <span className={styles.stepNumber} aria-hidden="true">
                {i + 1}
              </span>
              <span className={styles.stepText}>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* それ以外：小さく細く、たたんだ行に置く */}
      {prepare.sayPreview !== false && (
        <details className={styles.extraNote}>
          <summary>声かけを先に読んでおく</summary>
          <p className={styles.flowLabel}>1. 問題を出す</p>
          <p className={styles.flowText}>{question.say}</p>
          <p className={styles.flowLabel}>2. 順番に声をかける</p>
          <ol className={styles.flow}>
            {turns.map((turn) => (
              <li key={turn.say}>{turn.say}</li>
            ))}
          </ol>
        </details>
      )}

      <p className={styles.startHelp}>台本を見ながら、そのまま教えられます。</p>
      <div className={styles.actions}>
        <button
          className={styles.primary}
          type="button"
          ref={startButton}
          onClick={(event) => onStart(event.currentTarget)}
        >
          {resume ? '途中から台本にもどる' : '台本をはじめる'}
        </button>
      </div>
    </div>
  )
}

// 画面の見出し。何をする画面かを、アイコンと短い言葉で示す（アイコンは読み上げない）
const HEADINGS = {
  do: ['✋', 'すること'],
  say: ['💬', 'こう声がけしよう'],
  show: ['📝', '解説を確認する'],
  finish: ['🎉', 'おしまい'],
} as const

// ページの下の「次」のボタンに出す、次のページの名前。セリフは出さず、何をする画面かだけを示す
function nextLabel(beat: Beat) {
  return beat.kind === 'say' && beat.label ? beat.label : HEADINGS[beat.kind][1]
}

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
      return heading
    case 'finish':
      return heading
  }
}

// 1画面の中身。行動は1つだけにして、それ以外の情報は出さない。active は、今出しているページか
function BeatView({ beat, active }: { beat: Beat; active: boolean }) {
  switch (beat.kind) {
    case 'do':
      return <p className={styles.main}>{beat.text}</p>
    case 'say':
      return <TeachingStep step={beat} active={active} />
    case 'show':
      return <div className={styles.reference}>{beat.content}</div>
    case 'finish':
      return <p className={styles.main}>解き方の説明はここまでです。</p>
  }
}

// おしまいの後に戻る先。この問題が置かれている分類（一覧）のページで、どこにも置かれていなければホーム
function useMenuLink() {
  const { crumbs } = useLoaderData<ReturnType<typeof loadProblem>>()
  const parent = crumbs.at(-1)
  return parent
    ? { url: parent.url, label: '単元一覧にもどる' }
    : { url: '/', label: 'ホームにもどる' }
}

// 保存しておいた進み具合を読む。台本を直した後などで、今の台本に合わない位置があれば使わない。
// 最後まで終えた問題は、次に開いたときに準備の画面から始める
function loadProgress(
  keys: { started: string; history: string },
  script: Turn[],
): { started: boolean; history: Position[] } {
  const fresh = { started: false, history: [START] }
  try {
    const started: unknown = JSON.parse(
      sessionStorage.getItem(keys.started) ?? 'false',
    )
    const history: unknown = JSON.parse(
      sessionStorage.getItem(keys.history) ?? 'null',
    )
    const valid =
      Array.isArray(history) &&
      history.length > 0 &&
      history.every(
        (position: Position) =>
          position &&
          Number.isInteger(position.turn) &&
          position.turn >= 0 &&
          position.turn <= script.length &&
          Number.isInteger(position.beat) &&
          position.beat >= 0 &&
          position.beat <
            (position.turn === script.length
              ? 1
              : beatsOf(script[position.turn]).length),
      )
    if (typeof started !== 'boolean') return fresh
    if (!valid) return { started, history: [START] }
    if (history.at(-1).turn === script.length) return fresh
    return { started, history }
  } catch {
    // プライベートブラウズなどで読めないときは、はじめから
    return fresh
  }
}

// 準備や一覧を見直しても、同じタブでは台本の続きへ戻れる。
export function TeachingScript({
  prepare,
  question,
  turns,
  editor,
  picture,
  counters,
  renderVisual,
  flow,
  flowStatus,
  help,
}: Props) {
  const location = useLocation()
  // flow の進み具合。保存が読めないときは、はじめから
  const readFlowStatus = (): FlowStatus => {
    try {
      return flowStatus?.() ?? 'start'
    } catch {
      return 'start'
    }
  }
  // 台本を開いているかはページごと、進み具合は問題ごとに保存する
  const keys = {
    started: 'teaching-started:' + location.pathname,
    history: 'teaching-progress:' + location.pathname + ':' + question.say,
  }
  const [saved] = useState(() => loadProgress(keys, [question, ...turns]))
  // flow を最後まで終えたあとに開き直したら、準備の画面から
  const [started, setStarted] = useState(
    () => saved.started && !(flow && readFlowStatus() === 'finished'),
  )
  // 戻るボタンのために、通ってきた位置をすべて覚えておく
  const [history, setHistory] = useState<Position[]>(saved.history)
  // 準備の画面で問題の数字を変えたら、その問題の進み具合を読み直す。
  // 部品ごと作り直すと、準備の画面で開いていた折りたたみの欄が閉じてしまうため
  const [historyKey, setHistoryKey] = useState(keys.history)
  if (historyKey !== keys.history) {
    setHistoryKey(keys.history)
    setHistory(loadProgress(keys, [question, ...turns]).history)
  }
  // 使い方のページ。ページを分けない台本を最初のページから始めるときだけ、最初のページの前に置く
  // （ページを分けた台本（flow）では、LessonSlides が置く）
  const guide = useScriptGuide(started && !flow, history.length === 1)
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  // 指を離してから、ページを送り終えるまで
  const [moving, setMoving] = useState(false)
  const [slideWidth, setSlideWidth] = useState(320)
  const carousel = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const sliding = useRef(false)
  // 横にスワイプした直後（0.4秒以内）のクリックは、ボタンに届けない
  const swipedAt = useRef(0)
  const gesture = useRef<{
    id: number
    x: number
    y: number
    axis: 'x' | 'y' | null
    // 指を捕まえたか（「次」のボタンの上からは、横に動いてから捕まえる）
    captured: boolean
  } | null>(null)
  const menu = useMenuLink()
  const startButton = useRef<HTMLButtonElement>(null)
  // 幕は、準備と台本のどちらの画面でも、外側の div の最初の子に置く。
  // 同じ位置に置くと、幕が出ている間に画面を切り替えても、幕が作り直されずに動き続ける
  const [curtain, setCurtain] = useState<Curtain | null>(null)
  const play = (next: Curtain) => {
    // 幕が出ている間に、もう一度押されても何もしない
    if (curtain) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      next.swap()
    else setCurtain(next)
  }
  const curtainView = curtain && (
    <ScriptCurtain
      curtain={curtain}
      returnTo={startButton}
      onDone={() => setCurtain(null)}
    />
  )

  // 教える台本には確認・発展を混ぜず、問題から手順へ順番に進む。
  const script: Turn[] = [question, ...turns]
  const FINISH = script.length
  const sectionOf = (turn: number): Section =>
    turn === FINISH ? 'finish' : turn === 0 ? 'question' : 'guide'
  const beatsAt = ({ turn }: Position): Beat[] =>
    turn === FINISH ? [{ kind: 'finish' }] : beatsOf(script[turn])
  const position = history[history.length - 1]
  const index = position.turn
  const section = sectionOf(index)
  const beats = beatsAt(position)
  const beat = beats[position.beat]
  const totalBeats = script.reduce(
    (total, turn) => total + beatsOf(turn).length,
    0,
  )
  // おしまいの画面まで来たら、画面が自動で消えるように戻す
  useWakeLock(started && beat.kind !== 'finish')

  useEffect(() => {
    try {
      sessionStorage.setItem(keys.started, JSON.stringify(started))
      sessionStorage.setItem(keys.history, JSON.stringify(history))
    } catch {
      // プライベートブラウズなどで保存できないときは、続きから再開できないだけなので何もしない
    }
  }, [keys.started, keys.history, started, history])
  // 戻るボタンなどでほかの画面へ移ったら、次に開いたときは準備の画面から（台本の進み具合は残す）。
  // 再読み込みでは部品が外れないので、台本を開いたまま読み直せる
  useEffect(() => {
    const key = keys.started
    return () => {
      try {
        sessionStorage.setItem(key, 'false')
      } catch {
        // 保存できないときは、もともと続きから再開できないので何もしない
      }
    }
  }, [keys.started])

  const ask = (turn: number): Position => ({ turn, beat: 0 })
  const go = (next: Position) => {
    setHistory([...history, next])
  }
  const advance = () =>
    position.beat < beats.length - 1
      ? go({ ...position, beat: position.beat + 1 })
      : go(ask(index + 1))
  const back = () => {
    if (history.length > 1) setHistory(history.slice(0, -1))
    // 最初のページの前に使い方のページがあれば、そこへ戻る
    else if (guide.present) guide.revisit()
    else setStarted(false)
  }
  // 使い方のページからは、台本の進み具合を変えずに、最初のページへ進む
  const forward = () => (guide.showing ? guide.pass() : advance())
  const canAdvance = guide.showing || beat.kind !== 'finish'
  const canBack = !guide.showing && (history.length > 1 || guide.present)
  // 1ページずつ並べたカード（最後は、おしまい）
  const cards = [
    ...script.map((turn) => beatsOf(turn)),
    [{ kind: 'finish' } as Beat],
  ].flatMap((turnBeats, turnIndex) =>
    turnBeats.map((cardBeat, beatIndex) => ({
      cardBeat,
      turnIndex,
      beatIndex,
    })),
  )
  const activeCardIndex = cards.findIndex(
    (card) => card.turnIndex === index && card.beatIndex === position.beat,
  )
  // 使い方のページを置くときは、カードはその分だけ後ろへずれる
  const guideOffset = guide.present ? 1 : 0
  const activePanel = guide.showing ? 0 : activeCardIndex + guideOffset
  const panelStyle = (panel: number) => {
    const offset = panel - activePanel
    return {
      transform:
        'translateX(calc(' + offset * 100 + '% + ' + offset * 12 + 'px))',
    }
  }
  // refocus は、ページの中のボタン（「次」・「はじめる」）で送るとき。
  // ページが替わると台本の中身を作り直してボタンが消えるので、台本の領域へフォーカスを戻す（続けて ← → で送れる）
  const swipe = async (delta: number, refocus = false) => {
    if (sliding.current || !(delta < 0 ? canAdvance : canBack)) {
      setDragX(0)
      return
    }
    const element = track.current
    if (!element) return
    sliding.current = true
    // 送っている間は、入ってくるページを薄くしない
    setMoving(true)
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    const width = element.getBoundingClientRect().width + 12
    const animation = element.animate(
      [
        { transform: getComputedStyle(element).transform },
        { transform: 'translateX(' + (delta < 0 ? -width : width) + 'px)' },
      ],
      {
        duration: reduced ? 0 : 300,
        easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
        fill: 'forwards',
      },
    )
    try {
      await animation.finished
      flushSync(() => {
        setDragX(0)
        if (delta < 0) forward()
        else back()
      })
      if (refocus) carousel.current?.focus({ preventScroll: true })
    } finally {
      animation.cancel()
      sliding.current = false
      setMoving(false)
    }
  }

  // 準備の画面へ戻る（台本の進み具合は残る）
  const toPrepare = () => {
    setStarted(false)
    window.scrollTo(0, 0)
  }
  // 「終わる」。幕を下ろして、準備の画面へ戻る。reset は、幕で隠れている間に台本を最初に戻すとき
  const finish = (reset?: () => void) =>
    play({
      kind: 'finish',
      swap: () => {
        reset?.()
        toPrepare()
      },
    })
  // 台本の左上の「×」。台本が薄れて、準備の画面に入れ替わる（index.css の ::view-transition）。
  // 対応していないブラウザでは、すぐに切り替える
  const leave = () => {
    if (curtain) return
    if ('startViewTransition' in document)
      document.startViewTransition(() => flushSync(toPrepare))
    else toPrepare()
  }
  const close = (
    <button
      className={styles.close}
      type="button"
      aria-label="準備にもどる"
      onClick={leave}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <path d="M6 6l12 12M18 6 6 18" />
      </svg>
    </button>
  )
  // 台本の右上の「困ったら」。「今日はここまで」は、「終わる」と同じ幕で準備の画面へ戻る（進み具合は残す）
  const helpButton = (
    <ScriptHelp help={help} point={prepare.point} onStop={() => finish()} />
  )

  if (!started)
    return (
      <div className={styles.lessonPage}>
        {curtainView}
        <PrepareView
          counters={counters}
          editor={editor}
          picture={picture}
          prepare={prepare}
          question={question}
          turns={turns}
          startButton={startButton}
          onStart={(button) =>
            play({
              kind: 'start',
              from: button,
              swap: () => {
                setStarted(true)
                window.scrollTo(0, 0)
              },
            })
          }
          resume={flow ? readFlowStatus() === 'middle' : history.length > 1}
        />
      </div>
    )

  if (flow)
    return (
      <div
        className={`${styles.script} ${styles.lessonPage}`}
        data-script-running
      >
        {curtainView}
        {close}
        {helpButton}
        <ScriptControls.Provider value={{ finish: () => finish() }}>
          {flow}
        </ScriptControls.Provider>
      </div>
    )

  return (
    // data-script-running がある間は、画面全体を橙にし、上の帯と見出しを隠す（index.css）
    <div
      className={`${styles.script} ${styles.lessonPage}`}
      data-script-running
    >
      {curtainView}
      {close}
      {helpButton}
      <div
        className={styles.pageDots}
        role="img"
        aria-label={
          guide.showing
            ? `台本の進み具合 ${GUIDE_TITLE}`
            : `台本の進み具合 ${activeCardIndex + 1} / ${totalBeats + 1}ページ`
        }
      >
        {/* 使い方のページは、台本のページの数に入れず、左に小さな点で出す */}
        {guide.present && <span aria-hidden="true" data-guide data-done />}
        {Array.from({ length: totalBeats + 1 }, (_, i) => (
          <span
            key={i}
            aria-hidden="true"
            data-current={!guide.showing && i === activeCardIndex}
            data-done={!guide.showing && i < activeCardIndex}
          />
        ))}
      </div>
      {/* 画面が替わったことを、読み上げで伝える */}
      <p className={styles.srOnly} aria-live="polite">
        {guide.showing ? GUIDE_TITLE : announcement(beat)}
      </p>
      <div className={styles.carouselFrame}>
        <div
          className={styles.carousel}
          ref={carousel}
          role="region"
          aria-roledescription="カルーセル"
          aria-label="声かけの台本"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.target !== event.currentTarget || sliding.current) return
            if (event.key === 'ArrowLeft' && canBack) {
              event.preventDefault()
              back()
            } else if (event.key === 'ArrowRight' && canAdvance) {
              event.preventDefault()
              forward()
            }
          }}
          onPointerDown={(event) => {
            if (!event.isPrimary || event.button !== 0 || sliding.current)
              return
            const control = (event.target as Element).closest(
              'summary, button, a, input, select, textarea, [role="button"]',
            )
            // ページの下の「次」・「はじめる」のボタンの上からは、横に動いたときだけ送る。
            // 親指を置きやすい場所なので。ただのタップは、捕まえずにそのままボタンに届ける
            const onPageButton = !!control?.hasAttribute('data-page-button')
            if (control && !onPageButton) return
            setSlideWidth(
              (track.current?.getBoundingClientRect().width ?? 320) + 12,
            )
            gesture.current = {
              id: event.pointerId,
              x: event.clientX,
              y: event.clientY,
              axis: null,
              captured: !onPageButton,
            }
            if (!onPageButton)
              event.currentTarget.setPointerCapture(event.pointerId)
          }}
          onPointerMove={(event) => {
            const start = gesture.current
            if (!start || start.id !== event.pointerId) return
            const dx = event.clientX - start.x
            const dy = event.clientY - start.y
            // 小さな指ぶれでは決めず、一度決めた方向は指を離すまで保つ。
            if (start.axis === null) {
              if (Math.max(Math.abs(dx), Math.abs(dy)) < 8) return
              start.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
              if (start.axis === 'x') {
                if (!start.captured) {
                  event.currentTarget.setPointerCapture(event.pointerId)
                  start.captured = true
                }
                setDragging(true)
              }
            }
            if (start.axis !== 'x') return
            const allowed = dx < 0 ? canAdvance : canBack
            const distance = Math.max(-slideWidth, Math.min(slideWidth, dx))
            setDragX(allowed ? distance : distance * 0.12)
          }}
          onPointerUp={(event) => {
            const start = gesture.current
            if (!start || start.id !== event.pointerId) return
            gesture.current = null
            if (start.axis === 'x') swipedAt.current = event.timeStamp
            const dx = event.clientX - start.x
            // アニメーションの開始位置を読むまではドラッグ時の transform を保つ。
            if (
              start.axis === 'x' &&
              Math.abs(dx) >= Math.min(55, slideWidth * 0.2)
            )
              void swipe(dx)
            else setDragX(0)
            setDragging(false)
          }}
          onPointerCancel={() => {
            gesture.current = null
            setDragging(false)
            if (!sliding.current) setDragX(0)
          }}
          onClickCapture={(event) => {
            if (event.timeStamp - swipedAt.current > 400) return
            event.preventDefault()
            event.stopPropagation()
          }}
          onLostPointerCapture={(event) => {
            // 「次」のボタンから台本の領域へ指を捕まえ直すと、ボタンから「指を失った」が伝わってくるので、
            // 台本の領域自身のものだけを見る
            if (event.target !== event.currentTarget) return
            gesture.current = null
            setDragging(false)
            if (!sliding.current) setDragX(0)
          }}
        >
          {/* ページが替わるたびに作り直して、送り終えたときに動きが残らないようにする */}
          <div
            className={styles.dragTrack}
            ref={track}
            key={history.length + (guide.showing ? '-guide' : '')}
            data-dragging={dragging}
            // 指で動かしている間と、送っている間は、となりのページを薄くしない
            data-moving={dragging || moving}
            style={{ transform: `translateX(${dragX}px)` }}
          >
            {guide.present && (
              <div
                className={styles.panel}
                data-active={guide.showing}
                style={panelStyle(0)}
                aria-hidden={!guide.showing}
                inert={!guide.showing}
              >
                <ScriptGuideSlide onStart={() => void swipe(-1, true)} />
              </div>
            )}
            {cards.map(({ cardBeat, turnIndex, beatIndex }, cardIndex) => {
              const active =
                !guide.showing &&
                turnIndex === index &&
                beatIndex === position.beat
              const next = cards[cardIndex + 1]?.cardBeat
              return (
                <div
                  className={styles.panel}
                  key={turnIndex + '-' + beatIndex}
                  data-active={active}
                  style={panelStyle(cardIndex + guideOffset)}
                  aria-hidden={!active}
                  inert={!active}
                >
                  {turnIndex === 0 &&
                    beatIndex === 0 &&
                    !question.sayContent && (
                      <div className={styles.firstQuestion}>
                        {question.show}
                      </div>
                    )}
                  <div className={styles.readingContent}>
                    {cardBeat.kind !== 'say' && (
                      <h2 className={styles.heading}>
                        <span aria-hidden="true">
                          {HEADINGS[cardBeat.kind][0]}{' '}
                        </span>

                        {HEADINGS[cardBeat.kind][1]}
                      </h2>
                    )}
                    <BeatView beat={cardBeat} active={active} />
                  </div>
                  {turnIndex < script.length && !counters && renderVisual && (
                    <div className={styles.reference}>
                      {renderVisual(turnIndex)}
                    </div>
                  )}
                  {next && (
                    <NextPageButton
                      label={nextLabel(next)}
                      onClick={() => void swipe(-1, true)}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
        <PageEdges
          canBack={canBack}
          canNext={canAdvance}
          onBack={() => void swipe(1)}
          onNext={() => void swipe(-1)}
        />
      </div>
      {counters && section !== 'finish' && (
        <CounterDisplay
          problem={counters}
          step={Math.min(index, turns.length)}
        />
      )}

      {beat.kind === 'finish' && (
        <div className={styles.actions} data-stack>
          <Link className={styles.primary} to={menu.url} viewTransition>
            {menu.label}
          </Link>
          <button
            type="button"
            onClick={() => finish(() => setHistory([START]))}
          >
            終わる
          </button>
        </div>
      )}
    </div>
  )
}
