import { useLayoutEffect, useRef, type RefObject } from 'react'
import { createPortal, flushSync } from 'react-dom'
import styles from './ScriptCurtain.module.css'

// 準備の画面と台本を行き来するときの幕。
// start：押したボタンから橙が広がって画面を覆い、おやじいが「はじめましょう」と出てから台本が現れる。
// finish：台本の上に橙の幕が下りて「おつかれさまでした」と出てから、幕が「台本をはじめる」のボタンへ縮んで準備の画面が現れる
export interface Curtain {
  kind: 'start' | 'finish'
  // 幕が広がり始めるボタン（start）
  from?: Element | null
  // 幕で画面が隠れている間に、準備と台本を切り替える
  swap: () => void
}

const MESSAGES = {
  start: 'はじめましょう',
  finish: 'おつかれさまでした',
} as const

const EASE = 'cubic-bezier(0.22, 0.61, 0.36, 1)'

// 点 (x, y) から画面の四隅まで届く円の半径
function coverRadius(x: number, y: number) {
  return Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  )
}

function centerOf(element: Element | null | undefined) {
  const rect = element?.getBoundingClientRect()
  return rect
    ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    : { x: window.innerWidth / 2, y: window.innerHeight }
}

// 幕を1回出す。出し終えたら onDone。returnTo は、finish で幕が縮んでいく先（準備の画面の「台本をはじめる」）。
// 動きを減らす設定の人には出さない（TeachingScript で、幕を出さずにすぐ切り替える）
export function ScriptCurtain({
  curtain,
  returnTo,
  onDone,
}: {
  curtain: Curtain
  returnTo: RefObject<HTMLElement | null>
  onDone: () => void
}) {
  const sheet = useRef<HTMLDivElement>(null)
  const message = useRef<HTMLDivElement>(null)

  // 最初の描画の前に動きを付けて、幕が一瞬だけ全面に出るのを防ぐ
  useLayoutEffect(() => {
    const element = sheet.current
    const words = message.current
    if (!element || !words) return
    const running: Animation[] = []
    let cancelled = false
    const animate = (
      target: Element,
      keyframes: Keyframe[],
      options: KeyframeAnimationOptions,
    ) => {
      const animation = target.animate(keyframes, {
        easing: EASE,
        fill: 'forwards',
        ...options,
      })
      running.push(animation)
      return animation.finished
    }
    const circle = ({ x, y }: { x: number; y: number }, radius: number) =>
      `circle(${radius}px at ${x}px ${y}px)`
    const showMessage = (delay: number) =>
      animate(
        words,
        [
          { opacity: 0, transform: 'translateY(16px) scale(0.92)' },
          { opacity: 1, transform: 'none' },
        ],
        { duration: 320, delay },
      )
    const hold = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms))

    const run = async () => {
      if (curtain.kind === 'start') {
        const from = centerOf(curtain.from)
        await Promise.all([
          animate(
            element,
            [
              { clipPath: circle(from, 0) },
              { clipPath: circle(from, coverRadius(from.x, from.y)) },
            ],
            { duration: 480 },
          ),
          showMessage(260),
        ])
        await hold(360)
        // 一言が台本のセリフと重なって見えないように、先に消しておく
        await animate(words, [{ opacity: 1 }, { opacity: 0 }], {
          duration: 140,
        })
        if (cancelled) return
        flushSync(curtain.swap)
        // 台本は全面が橙なので、幕は消えるように薄くする
        await animate(element, [{ opacity: 1 }, { opacity: 0 }], {
          duration: 260,
        })
      } else {
        await animate(element, [{ opacity: 0 }, { opacity: 1 }], {
          duration: 220,
        })
        await showMessage(0)
        await hold(620)
        if (cancelled) return
        flushSync(curtain.swap)
        // 準備の画面を描いてから、「台本をはじめる」の位置へ幕を縮める
        const to = centerOf(returnTo.current)
        await Promise.all([
          animate(words, [{ opacity: 1 }, { opacity: 0 }], { duration: 160 }),
          animate(
            element,
            [
              { clipPath: circle(to, coverRadius(to.x, to.y)) },
              { clipPath: circle(to, 0) },
            ],
            { duration: 460, easing: 'cubic-bezier(0.55, 0, 0.45, 1)' },
          ),
        ])
      }
      if (!cancelled) onDone()
    }
    // 途中でページを離れたときは、動きを止める（finished は中止で失敗になる）
    run().catch(() => {})
    return () => {
      cancelled = true
      for (const animation of running) animation.cancel()
    }
    // 幕は1回ごとに作り直すので、最初の1回だけ動かす
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return createPortal(
    // 読み上げでは、切り替わった後の画面（台本の読み上げ・準備の画面）を伝えるので、幕は読まない
    <div className={styles.curtain} ref={sheet} aria-hidden="true">
      <div className={styles.message} ref={message}>
        <img
          className={styles.mascot}
          src="/mascot.png"
          alt=""
          draggable={false}
        />
        <p className={styles.words}>{MESSAGES[curtain.kind]}</p>
      </div>
    </div>,
    document.body,
  )
}
