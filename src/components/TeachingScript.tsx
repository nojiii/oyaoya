import {
  lazy,
  Suspense,
  use,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  Link,
  useBlocker,
  useLoaderData,
  useParams,
  useSearchParams,
} from 'react-router'
import { useHomeUrl } from '../pages/festival'
import type { loadProblem } from '../pages/loaders'
import { FlowTreeContext } from './flowTreeContext'
import {
  createFlow,
  decodeActions,
  HEADINGS,
  type Beat,
  type Flow,
  type Action,
  type Position,
  type Script,
  type Section,
} from './scriptFlow'
import styles from './TeachingScript.module.css'

export type { Turn } from './scriptFlow'

// 動線の表示は、開発中の動線一覧（/debug）と ?debug=true でだけ使う。
// 本番のビルドに含めないよう、開発中だけ読み込む
const FlowViews = import.meta.env.DEV ? lazy(() => import('./FlowViews')) : null

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

interface Props extends Script {
  prepare: Prepare
}

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

function PrepareView({
  prepare,
  question,
  turns,
  check,
  onStart,
}: Props & { onStart: () => void }) {
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
        <summary>声掛けの流れを見る</summary>
        <p className={styles.flowLabel}>1. 問題を出す</p>
        <p className={styles.flowText}>{question.say}</p>
        <p className={styles.flowLabel}>
          2. むずかしそうなら、いっしょに解く（すぐ答えられたら とばす）
        </p>
        <ol className={styles.flow}>
          {turns.map((turn) => (
            <li key={turn.say}>{turn.say}</li>
          ))}
        </ol>
        <p className={styles.flowLabel}>3. わかったかを確かめる</p>
        <ul className={styles.flow}>
          {check.map((turn) => (
            <li key={turn.say}>{turn.say}</li>
          ))}
        </ul>
      </details>
      <div className={styles.actions}>
        <button className={styles.primary} type="button" onClick={onStart}>
          はじめる
        </button>
      </div>
    </div>
  )
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

// おしまいの後に戻る先。この問題が置かれている分類（一覧）のページで、どこにも置かれていなければホーム
function useMenuLink() {
  const { crumbs } = useLoaderData<ReturnType<typeof loadProblem>>()
  const homeUrl = useHomeUrl()
  const parent = crumbs.at(-1)
  return parent
    ? { url: parent.url, label: '一覧にもどる' }
    : { url: homeUrl, label: 'ホームにもどる' }
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

// 開発中だけ使う URL の指定。本番では、どちらも無いものとして扱う
// - ?flow=：操作の並びをたどった画面から始める（動線一覧から、途中の画面を開くため）
// - ?debug=true：PC の画面幅のとき、台本の横に動線を出す
function useDebugOptions(flow: Flow) {
  const [params, setParams] = useSearchParams()
  const text = import.meta.env.DEV ? params.get('flow') : null
  const actions = text === null ? null : decodeActions(text)
  const side = import.meta.env.DEV && params.get('debug') === 'true'
  // 台本の横の動線を開閉する。URL の ?debug=true も書き換えて、再読み込みや共有でも同じ状態で開けるようにする
  const toggleSide = () => {
    const next = new URLSearchParams(params)
    if (side) next.delete('debug')
    else next.set('debug', 'true')
    setParams(next, { replace: true, preventScrollReset: true })
  }
  return { start: actions && flow.replay(actions), side, toggleSide }
}

// 教えている最中に使う台本。親の行動を1画面に1つずつ出し、
// お子さんの反応（できた／つまずいた）に合わせて、ほめ言葉やヒントに切り替える。
// 流れは「問題 →（むずかしければ）いっしょに解く → 確かめ → おしまい」。
// すぐ答えられたお子さんは、いっしょに解く手順をとばして確かめへ進み、早く終われる。
// 動線一覧（開発用）の中では、台本の代わりに、通りうる画面の動線を描く
export function TeachingScript(props: Props) {
  const tree = use(FlowTreeContext)
  if (tree && FlowViews)
    return (
      <Suspense>
        <FlowViews script={props} problemId={tree.problemId} />
      </Suspense>
    )
  return <ScriptPlayer {...props} />
}

function ScriptPlayer({ prepare, question, turns, check }: Props) {
  const flow = createFlow({ question, turns, check })
  const debug = useDebugOptions(flow)
  const { problemId = '' } = useParams()
  const [started, setStarted] = useState(debug.start !== null)
  // 戻るボタンのために、通ってきた位置をすべて覚えておく
  const [history, setHistory] = useState<Position[]>(
    debug.start ?? [flow.START],
  )
  // 画面を、進むときは下から、戻るときは上から入れる
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')
  const dialog = useRef<HTMLDialogElement>(null)
  const actions = useRef<HTMLDivElement>(null)
  const menu = useMenuLink()

  const position = history[history.length - 1]
  const section = flow.sectionOf(position.turn)
  const beat = flow.beatsAt(position)[position.beat]
  // おしまいの画面まで来たら、画面が自動で消えるように戻す
  useWakeLock(started && beat.kind !== 'finish')

  // 台本の途中でページを離れると（iOS のスワイプで戻る など）はじめからになるので、離れる前に確かめる
  // （同じページのまま URL の ? や # だけが変わるとき、例えば動線の開閉は、進み具合が消えないので確かめない）
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      started &&
      beat.kind !== 'finish' &&
      currentLocation.pathname !== nextLocation.pathname,
  )

  // 押したボタンが次の画面で消えたとき（「つまずいた」など）は、
  // キーボードや読み上げで操作している人が迷わないよう、主なボタンへ移す
  useEffect(() => {
    if (document.activeElement === document.body)
      actions.current?.querySelector<HTMLElement>('button, a')?.focus()
  }, [history, started])

  // 操作して、次の画面へ進む（行き先は scriptFlow.ts の step が決める）
  const act = (action: Action) => {
    setHistory([
      ...history,
      flow.step(position, flow.visitedGuide(history), action),
    ])
    setDirection('forward')
  }
  const advance = () => act('next')

  const start = () => {
    setHistory([flow.START])
    setStarted(true)
    window.scrollTo(0, 0)
  }
  const back = () => {
    if (history.length > 1) setHistory(history.slice(0, -1))
    else setStarted(false)
    setDirection('back')
  }

  // 開発中だけ：?debug=true なら、PC の画面幅のとき、台本の横に動線を出す。
  // 今いる画面と通ってきた画面を目立たせ、動線の画面を押すと、台本がその画面へ移る
  const side = debug.side && FlowViews && (
    <aside className={styles.debugSide} aria-label="動線（開発用）">
      <Suspense>
        <FlowViews
          script={{ question, turns, check }}
          problemId={problemId}
          // 動線一覧のこの問題の位置を、別のタブで開く（台本の進み具合を消さないため）
          extra={
            <a
              href={`/debug#problem-${problemId}`}
              target="_blank"
              rel="noreferrer"
            >
              一覧で見る
            </a>
          }
          history={started ? history : undefined}
          onSelect={(node) => {
            setHistory(flow.replay(node.path))
            setStarted(true)
            setDirection('forward')
          }}
        />
      </Suspense>
    </aside>
  )

  const page = !started ? (
    <PrepareView
      prepare={prepare}
      question={question}
      turns={turns}
      check={check}
      onStart={start}
    />
  ) : (
    // data-script-running がある間は、ページのパンくずリストと見出しを隠す（index.css）
    <div className={styles.script} data-script-running>
      <Progress
        section={section}
        count={turns.length}
        current={position.turn - flow.GUIDE}
        onBack={back}
        onFinish={() => act('finish')}
      />
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
      {/* おしまいの画面は、ボタンの文字が長いので縦に並べる */}
      <div
        className={styles.actions}
        ref={actions}
        data-stack={beat.kind === 'finish'}
      >
        {/* 押したボタンが消えてフォーカスを失わないように、主なボタンは同じ key で残す */}
        {beat.kind === 'wait' ? (
          <>
            <button
              className={styles.primary}
              type="button"
              key="primary"
              onClick={() => act('done')}
            >
              {beat.done}
            </button>
            <button type="button" onClick={() => act('stuck')}>
              {beat.stuck}
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
          <>
            {/* 次の問題を選ぶことが多いので、一覧へ戻るほうを主なボタンにする */}
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

  return (
    <>
      {page}
      {side}
      {/* 開発中だけ：動線を開閉するボタン（PC の画面幅のときだけ出す） */}
      {import.meta.env.DEV && (
        <button
          className={styles.debugToggle}
          type="button"
          aria-pressed={debug.side}
          onClick={debug.toggleSide}
        >
          {debug.side ? '動線を閉じる' : '動線を見る'}
        </button>
      )}
    </>
  )
}

// 区切りの名前（いっしょに解く手順のときだけ、進み具合を点で出す）
const SECTION_NAMES = {
  question: '問題',
  guide: 'いっしょに解く',
  check: '確かめ',
  finish: 'おしまい',
}

function Progress({
  section,
  count,
  current,
  onBack,
  onFinish,
}: {
  section: Section
  count: number
  current: number
  onBack: () => void
  onFinish: () => void
}) {
  return (
    <div className={styles.progress}>
      <button className={styles.back} type="button" onClick={onBack}>
        ← もどる
      </button>
      <span className={styles.where}>
        {SECTION_NAMES[section]}
        {section === 'guide' && (
          <span className={styles.dots} aria-hidden="true">
            {Array.from({ length: count }, (_, i) => (
              <span className={styles.dot} key={i} data-done={i <= current} />
            ))}
          </span>
        )}
      </span>
      {/* わかったところで終われるように、おしまいの画面以外では いつでも出しておく */}
      {section !== 'finish' && (
        <button className={styles.back} type="button" onClick={onFinish}>
          おわる
        </button>
      )}
    </div>
  )
}
