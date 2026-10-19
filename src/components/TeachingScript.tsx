import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Link, useLocation, useLoaderData } from 'react-router'
import { useHomeUrl } from '../pages/festival'
import type { loadProblem } from '../pages/loaders'
import styles from './TeachingScript.module.css'
import { CounterDisplay, type CounterProblem } from './CounterDisplay'

// つまずいたときに出すヒント。上から順に、少しずつ手助けを大きくする
interface Hint {
  // 声をかける前に、親がすること
  do?: string
  // 親が言うこと
  say: string
  // 親がヒントを確認するための図
  show?: ReactNode
}

// 台本の1ステップ。親が言うこと（say）を中心に、必要なものだけを書く。
// 「する → 声をかける」の順に台本を出す
export interface Turn {
  // 親がお子さんに言うこと
  say: string
  // 声をかける前に、親がすること（準備）
  do?: string
  how?: string
  avoid?: string[]
  // 親が確認する問題や参考図。子どもには読み聞かせたり、実物で伝える
  show?: ReactNode
  // セリフに続けて親が確認する解説図
  reveal?: ReactNode
  // 親が確認する答えのめやす
  expect?: string
  // なぜこう言うのか。台本の下に表示する
  why?: ReactNode
  // 補足のヒント
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

// 答えを待つステップ（問題と確かめ）。正解のめやすは必ず書く
type Asked = Turn & { expect: string }

interface Props {
  renderVisual?: (step: number) => ReactNode
  counters?: CounterProblem
  editor?: ReactNode
  prepare: Prepare
  // 教える問題。台本の上部に常時表示する
  question: Asked
  // 順番に読み上げる、解き方の台本
  turns: Turn[]
  // 台本とは別のセクションに表示する確認・発展
  check: Asked[]
}

type Section = 'question' | 'guide' | 'finish'

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
  beats.push({ kind: 'say', say: turn.say })
  if (turn.reveal != null && turn.reveal !== false) {
    beats.push({ kind: 'show', content: turn.reveal })
  }
  return beats
}

function GuideIcon({ kind }: { kind: 'prepare' | 'script' | 'together' }) {
  const paths = {
    prepare: 'M8 4H5v16h14V4h-3M9 3h6v4H9zM8 12l2 2 5-5M8 17h8',
    script: 'M4 4h16v12H9l-5 4V4zM8 8h8M8 12h5',
    together:
      'M10 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0M20 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0M2 20v-3a5 5 0 0 1 10 0v3M12 20v-3a5 5 0 0 1 10 0v3',
  }
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[kind]} />
    </svg>
  )
}

function PrepareView({
  counters,
  editor,
  prepare,
  question,
  turns,
  onStart,
  resume,
}: Props & { onStart: () => void; resume?: boolean }) {
  const guideId = useId()
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
      <header className={styles.prepareHeading}>
        <h2 className={styles.prepareTitle}>この学習でやること</h2>
        <p className={styles.learning}>{learning}</p>
      </header>
      {editor && (
        <details className={styles.numberEditor}>
          <summary>問題の数字を変更</summary>
          {editor}
        </details>
      )}
      <section className={styles.quickGuide} aria-labelledby={guideId}>
        <h2 id={guideId}>使い方は3ステップ</h2>
        <ol className={styles.guideSteps}>
          <li>
            <span className={styles.stepNumber}>1</span>
            <GuideIcon kind="prepare" />
            <div>
              <h3>準備する</h3>
              <p>この画面で、今日の問題と教え方を確認します。</p>
            </div>
          </li>
          <li>
            <span className={styles.stepNumber}>2</span>
            <GuideIcon kind="script" />
            <div>
              <h3>台本を見て教える</h3>
              <p>「台本」でセリフを読み、お子さんに声をかけます。</p>
            </div>
          </li>
          <li>
            <span className={styles.stepNumber}>3</span>
            <GuideIcon kind="together" />
            <div>
              <h3>一緒に確かめる</h3>
              <p>
                {counters
                  ? '台本の下からおはじき画面を開き、一緒に動かして考えます。'
                  : '台本の図や身近なものを使って、一緒に答えを考えます。'}
              </p>
            </div>
          </li>
        </ol>
      </section>
      <section className={styles.teachingPoints}>
        <h2>今日の教え方のポイント</h2>
        <ul>
          <li>
            {counters
              ? '一緒におはじきを動かして考える'
              : '図や身近なものを使って、一緒に考える'}
          </li>
          <li>すぐに答えを教えず、お子さんが考えるのを待つ</li>
        </ul>
        <details className={styles.extraNote}>
          <summary>詳しい教え方・気をつけたいこと</summary>
          <div>{prepare.point}</div>
          <ul>
            {prepare.avoid.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
          <p>
            {counters
              ? 'おはじきはアプリに用意しています。実物の準備はいりません。'
              : `用意するもの：${prepare.materials.join('・')}`}
          </p>
        </details>
      </section>
      <details className={styles.extraNote}>
        <summary>声かけを先に読んでおく</summary>
        <p className={styles.flowLabel}>1. 問題を出す</p>
        <p className={styles.flowText}>{question.say}</p>
        <p className={styles.flowLabel}>2. 解き方を順番に教える</p>
        <ol className={styles.flow}>
          {turns.map((turn) => (
            <li key={turn.say}>{turn.say}</li>
          ))}
        </ol>
      </details>
      <p className={styles.startHelp}>台本を見ながら、そのまま教えられます。</p>
      <div className={styles.actions}>
        <button className={styles.primary} type="button" onClick={onStart}>
          {resume ? '途中から台本にもどる' : '台本をはじめる'}
        </button>
      </div>
    </div>
  )
}

// 画面の見出し。何をする画面かを、アイコンと短い言葉で示す（アイコンは読み上げない）
const HEADINGS = {
  do: ['✋', 'すること'],
  say: ['💬', 'お子さんへの声かけ'],
  show: ['📝', '解説を確認する'],
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
      return heading
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
      return (
        <>
          {beat.say && (
            <div className={styles.speech}>
              <img className={styles.mascot} src="/mascot.png" alt="" />
              <div>
                {beat.label && <p className={styles.label}>{beat.label}</p>}
                <p className={styles.bubble}>{beat.say}</p>
              </div>
            </div>
          )}
        </>
      )
    case 'show':
      return <div className={styles.reference}>{beat.content}</div>
    case 'finish':
      return <p className={styles.main}>解き方の説明はここまでです。</p>
  }
}

// おしまいの後に戻る先。この問題が置かれている分類（一覧）のページで、どこにも置かれていなければホーム
function useMenuLink() {
  const { crumbs } = useLoaderData<ReturnType<typeof loadProblem>>()
  const homeUrl = useHomeUrl()
  const parent = crumbs.at(-1)
  return parent
    ? { url: parent.url, label: '単元一覧にもどる' }
    : { url: homeUrl, label: 'ホームにもどる' }
}

// 準備や一覧を見直しても、同じタブでは台本の続きへ戻れる。
export function TeachingScript({
  prepare,
  question,
  turns,
  check,
  editor,
  counters,
  renderVisual,
}: Props) {
  const location = useLocation()
  const storageKey =
    'teaching-progress:' + location.pathname + ':' + question.say
  const [saved] = useState(() => {
    try {
      const value = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null')
      const script = [question, ...turns]
      if (
        value &&
        typeof value.started === 'boolean' &&
        Array.isArray(value.history) &&
        value.history.length > 0 &&
        value.history.every(
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
      )
        return value as { started: boolean; history: Position[] }
    } catch {
      /* Storage can be unavailable in private browsing. */
    }
    return { started: false, history: [START] }
  })
  const [started, setStarted] = useState(saved.started)
  // 戻るボタンのために、通ってきた位置をすべて覚えておく
  const [history, setHistory] = useState<Position[]>(saved.history)
  // カルーセルを進めると右から、戻すと左から入れる
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')
  const [dragX, setDragX] = useState(0)
  const gesture = useRef<{ id: number; x: number; y: number } | null>(null)
  const swipeHintId = useId()
  const actions = useRef<HTMLDivElement>(null)
  const menu = useMenuLink()

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
  const currentBeat =
    section === 'finish'
      ? totalBeats
      : script
          .slice(0, index)
          .reduce((total, turn) => total + beatsOf(turn).length, 0) +
        position.beat +
        1
  const currentTurn = script[index]
  const activeQuestion = question
  const reason = currentTurn?.why ?? prepare.point
  // おしまいの画面まで来たら、画面が自動で消えるように戻す
  useWakeLock(started && beat.kind !== 'finish')

  // 問題ごとに進み具合を保存する。
  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({ started, history }))
    } catch {
      /* Storage is optional. */
    }
  }, [storageKey, started, history])

  const ask = (turn: number): Position => ({ turn, beat: 0 })
  const go = (next: Position) => {
    setHistory([...history, next])
    setDirection('forward')
  }
  const advance = () =>
    position.beat < beats.length - 1
      ? go({ ...position, beat: position.beat + 1 })
      : go(ask(index + 1))
  const finish = () => go(ask(FINISH))
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
  const canAdvance = beat.kind !== 'finish'
  const canBack = history.length > 1
  const swipe = (delta: number) => {
    if (delta < 0 && canAdvance) advance()
    if (delta > 0 && canBack) back()
  }

  const navigation = (
    <nav className={styles.pageNavigation} aria-label="学習ページの移動">
      <Link to={menu.url} viewTransition>
        <span aria-hidden="true">‹</span> 単元一覧
      </Link>
      <button
        type="button"
        aria-current={!started ? 'page' : undefined}
        onClick={() => {
          setStarted(false)
          window.scrollTo(0, 0)
        }}
      >
        準備
      </button>
      <button
        type="button"
        aria-current={started ? 'page' : undefined}
        onClick={() => {
          setStarted(true)
          window.scrollTo(0, 0)
        }}
      >
        台本
      </button>
    </nav>
  )

  if (!started)
    return (
      <>
        {navigation}
        <PrepareView
          counters={counters}
          editor={editor}
          prepare={prepare}
          question={question}
          turns={turns}
          check={check}
          onStart={() => {
            setStarted(true)
            window.scrollTo(0, 0)
          }}
          resume={history.length > 1}
        />
      </>
    )

  return (
    // data-script-running がある間は、ページのパンくずリストと見出しを隠す（index.css）
    <div className={styles.script} data-script-running>
      {navigation}
      <section className={styles.question} aria-label="取り組む問題">
        <h2>問題</h2>
        {editor && (
          <details className={styles.numberEditor}>
            <summary>問題の数字を変更</summary>
            {editor}
          </details>
        )}
        <div>{activeQuestion.show ?? <p>{activeQuestion.say}</p>}</div>
      </section>
      <Progress
        section={section}
        current={currentBeat}
        total={totalBeats}
        onFinish={finish}
      />
      {/* 画面が替わったことを、読み上げで伝える */}
      <p className={styles.srOnly} aria-live="polite">
        {announcement(beat)}
      </p>
      <div
        className={styles.carousel}
        role="region"
        aria-roledescription="カルーセル"
        aria-label="声かけの台本"
        aria-describedby={swipeHintId}
        onPointerDown={(event) => {
          if (!event.isPrimary || event.button !== 0) return
          if (
            (event.target as Element).closest(
              'summary, button, a, input, select, textarea',
            )
          )
            return
          gesture.current = {
            id: event.pointerId,
            x: event.clientX,
            y: event.clientY,
          }
          event.currentTarget.setPointerCapture(event.pointerId)
        }}
        onPointerMove={(event) => {
          const start = gesture.current
          if (!start || start.id !== event.pointerId) return
          const dx = event.clientX - start.x
          const dy = event.clientY - start.y
          if (Math.abs(dx) <= Math.abs(dy)) {
            setDragX(0)
            return
          }
          const allowed = dx < 0 ? canAdvance : canBack
          setDragX(allowed ? Math.max(-160, Math.min(160, dx)) : dx * 0.12)
        }}
        onPointerUp={(event) => {
          const start = gesture.current
          gesture.current = null
          setDragX(0)
          if (!start || start.id !== event.pointerId) return
          const dx = event.clientX - start.x
          const dy = event.clientY - start.y
          if (Math.abs(dx) >= 55 && Math.abs(dx) > Math.abs(dy) * 1.4) swipe(dx)
        }}
        onPointerCancel={() => {
          gesture.current = null
          setDragX(0)
        }}
        onLostPointerCapture={() => {
          gesture.current = null
          setDragX(0)
        }}
      >
        <div
          className={styles.dragTrack}
          style={{ transform: `translateX(${dragX}px)` }}
        >
          <div
            className={styles.panel}
            key={history.length}
            data-direction={direction}
          >
            <div className={styles.readingContent}>
              <h2 className={styles.heading}>
                {beat.kind !== 'say' && (
                  <span aria-hidden="true">{HEADINGS[beat.kind][0]} </span>
                )}
                {HEADINGS[beat.kind][1]}
              </h2>
              <BeatView beat={beat} />
              {canAdvance && (
                <div
                  className={styles.pageCue}
                  aria-hidden="true"
                  data-invite={history.length === 1}
                >
                  <svg
                    width="40"
                    height="24"
                    viewBox="0 0 40 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M30 12H7m6-6-6 6 6 6M34 9v6" />
                  </svg>
                  <span>左へスワイプして次へ</span>
                </div>
              )}
            </div>
            {currentTurn && (
              <aside className={styles.panelNotes} aria-label="教え方">
                {currentTurn.how && (
                  <details className={styles.extraNote}>
                    <summary>教え方のヒント</summary>
                    <div>{currentTurn.how}</div>
                  </details>
                )}
                {!counters && renderVisual?.(index)}
                {beat.kind === 'say' && currentTurn.do && (
                  <details className={styles.extraNote}>
                    <summary>声をかける前の準備</summary>
                    <div>{currentTurn.do}</div>
                  </details>
                )}
                <details className={styles.extraNote}>
                  <summary>このセリフの理由</summary>
                  <div>{reason}</div>
                </details>
                {!!currentTurn.avoid?.length && (
                  <details className={styles.extraNote}>
                    <summary>避けたい声かけ</summary>
                    <ul>
                      {currentTurn.avoid.map((text) => (
                        <li key={text}>{text}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </aside>
            )}
          </div>
        </div>
      </div>
      <div
        className={styles.pagination}
        role="group"
        aria-label={`台本 ${currentBeat} / ${totalBeats}ページ`}
      >
        <button
          type="button"
          onClick={back}
          disabled={!canBack}
          aria-label="前のページへ"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m14 6-6 6 6 6" />
          </svg>
        </button>
        <div className={styles.pageDots} aria-hidden="true">
          {Array.from({ length: totalBeats }, (_, i) => (
            <span
              key={i}
              data-current={i === currentBeat - 1}
              data-done={i < currentBeat - 1}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={advance}
          disabled={!canAdvance}
          aria-label="次のページへ"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m10 6 6 6-6 6" />
          </svg>
        </button>
      </div>
      <p className={styles.swipeHint} id={swipeHintId}>
        {beat.kind === 'finish'
          ? '台本はここまでです'
          : '左へスワイプで次へ。右へスワイプで前のページへ。'}
      </p>
      {counters && section !== 'finish' && (
        <CounterDisplay
          problem={counters}
          step={Math.min(index, turns.length)}
        />
      )}

      <div
        className={styles.actions}
        ref={actions}
        data-stack={beat.kind === 'finish'}
      >
        {beat.kind === 'finish' ? (
          <>
            <Link
              className={styles.primary}
              to={menu.url}
              key="primary"
              viewTransition
            >
              {menu.label}
            </Link>
            <button type="button" onClick={start}>
              もういちど はじめから
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={back}>
              ‹ もどる
            </button>
            <button type="button" className={styles.primary} onClick={advance}>
              {index === script.length - 1 && position.beat === beats.length - 1
                ? '学習をおえる'
                : '次へ ›'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

const SECTION_NAMES = {
  question: '問題',
  guide: 'いっしょに解く',
  finish: 'おしまい',
}

function Progress({
  section,
  current,
  total,
  onFinish,
}: {
  section: Section
  current: number
  total: number
  onFinish: () => void
}) {
  return (
    <div className={styles.progress}>
      <div className={styles.progressStatus}>
        <span>
          {section === 'finish'
            ? 'おしまい'
            : `${SECTION_NAMES[section]} · ${current} / ${total}`}
        </span>
        <progress
          value={current}
          max={total}
          aria-label={`台本の進み具合 ${current} / ${total}`}
        />
      </div>
      {section !== 'finish' && (
        <button className={styles.back} type="button" onClick={onFinish}>
          おわる
        </button>
      )}
    </div>
  )
}
