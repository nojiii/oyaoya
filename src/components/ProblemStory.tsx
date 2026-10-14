import { useEffect, useRef, useState, type ReactNode } from 'react'
import styles from './ProblemStory.module.css'

// 1ステップ進むのに必要なスクロール量（画面の高さを100としたときの長さ）
const STEP_LENGTH = 60

// 章の中身。steps は文章で、スクロールに合わせて1つずつ入れ替わる。
// visual は図で、今のステップ番号（0始まり）を受け取り、そのステップでの見た目を返す
export interface Chapter {
  steps: ReactNode[]
  visual?: (step: number) => ReactNode
}

interface Props {
  question: Chapter
  howToSolve: Chapter
  howToTeach: Chapter
  examplePhrases: Chapter
}

function clamp(value: number) {
  return Math.min(1, Math.max(0, value))
}

// 教え方の図（何番目のポイントか）
function pointNumber(step: number) {
  return (
    <p className={styles.point}>
      ポイント
      {/* key を変えて、数字が変わるたびにアニメーションをやり直す */}
      <span className={styles.pointNumber} key={step}>
        {step + 1}
      </span>
    </p>
  )
}

// 声掛け例の図（おやじいが吹き出しで話す）
function mascot() {
  return <img className={styles.mascot} src="/mascot.png" alt="おやじい" />
}

interface ChapterViewProps extends Chapter {
  heading: string
  // 文章を吹き出しの見た目にする
  bubble?: boolean
}

function ChapterView({ heading, bubble, steps, visual }: ChapterViewProps) {
  const chapterRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState(0)
  const count = steps.length

  useEffect(() => {
    const chapter = chapterRef.current
    const stage = stageRef.current
    if (!chapter || !stage) return

    const update = () => {
      const rect = chapter.getBoundingClientRect()
      const view = stage.offsetHeight
      // パネルが画面に固定されている間にスクロールできる距離
      const pinned = chapter.offsetHeight - view
      // 最初のステップは章が画面に入ってくる間も見えているので、固定中の持ち分は半分にする
      const next = Math.round((-rect.top / pinned) * (count - 0.5))
      setStep(Math.min(count - 1, Math.max(0, next)))

      // パネルが固定位置からどれだけ離れているか。入ってくる途中は -1〜0、固定中は 0、
      // 出ていく途中は 0〜1。CSSがこの値でパネルを薄く・小さくする。
      // 毎フレーム変わるので、描き直しを起こさないよう state ではなくCSS変数で渡す
      const top = rect.top + window.scrollY
      const below =
        document.documentElement.scrollHeight - (top + chapter.offsetHeight)
      // ページを開いた時点で見えている章は、入りの演出をしない（最初から薄くなってしまうため）。
      // 後ろに1画面ぶんの続きがない章も、同じ理由で出の演出をしない
      const entering = top >= view ? clamp(rect.top / view) : 0
      const leaving = below >= view ? clamp((view - rect.bottom) / view) : 0
      chapter.style.setProperty('--offset', String(leaving - entering))
    }

    // スクロールのたびに計算せず、画面を描き直すタイミングに1回だけ計算する
    let frame = requestAnimationFrame(update)
    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(update)
    }
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [count])

  return (
    <section
      className={styles.chapter}
      ref={chapterRef}
      // 章の高さ = 1画面 + ステップ数ぶんのスクロール量。この高さの間、中身が画面に固定される
      style={{ height: `${100 + (count - 0.5) * STEP_LENGTH}svh` }}
    >
      <div className={styles.stage} ref={stageRef}>
        <div className={styles.panel}>
          <h2 className={styles.heading}>{heading}</h2>
          {visual && <div className={styles.visual}>{visual(step)}</div>}
          <div className={styles.steps} data-bubble={bubble}>
            {steps.map((body, i) => (
              <div
                className={styles.step}
                key={i}
                data-state={i === step ? 'active' : i < step ? 'past' : 'next'}
              >
                {body}
              </div>
            ))}
          </div>
          {count > 1 && (
            <div className={styles.dots} aria-hidden="true">
              {steps.map((_, i) => (
                <span className={styles.dot} key={i} data-active={i === step} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

// ページの一番上にいる間だけ出す、スクロールをうながす案内
function ScrollHint() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY < 16)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <p className={styles.hint} data-visible={visible} aria-hidden="true">
      スクロールして すすむ
      <span className={styles.hintArrow}>↓</span>
    </p>
  )
}

// スクロールで読み進める問題ページの構成（問題 → 解き方 → 教え方 → 声掛け例）。
// 章ごとに1枚のパネルが現れて画面に固定され、スクロールに合わせて文章が1つずつ入れ替わる。
// 見出しはここに1回だけ書き、各問題は章の中身だけを渡す
export function ProblemStory({
  question,
  howToSolve,
  howToTeach,
  examplePhrases,
}: Props) {
  return (
    <>
      <ScrollHint />
      <ChapterView heading="問題" {...question} />
      <ChapterView heading="解き方" {...howToSolve} />
      <ChapterView heading="教え方" visual={pointNumber} {...howToTeach} />
      <ChapterView
        heading="声掛け例"
        visual={mascot}
        bubble
        {...examplePhrases}
      />
      <p className={styles.end}>
        <button
          className={styles.restart}
          type="button"
          onClick={() => window.scrollTo(0, 0)}
        >
          ↑ さいしょに もどる
        </button>
      </p>
    </>
  )
}
