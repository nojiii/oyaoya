import { useEffect, useRef, useState, type ReactNode } from 'react'
import styles from './StageFullscreen.module.css'

// 余白：左右は 24px ずつ、上下は「とじる」のボタンの分も空ける
const SIDE = 48
const ENDS = 160
// 小さな図を大きくしすぎない
const MAX_SCALE = 3

// 図の中で、実際に描かれているところ（丸・文字・色のついた面）の左右の広がり。
// 図の枠はステージの幅いっぱいに広がっていても、中身は狭いことがある（1列のおはじき など）ので、枠ではなく中身ではかる。
// 返す位置は、拡大する前の大きさ（current で割り戻す）で、図の真ん中からのずれ（offset）と幅
function paintedExtent(box: HTMLElement, current: number) {
  const frame = box.getBoundingClientRect()
  let left = Infinity
  let right = -Infinity
  for (const element of box.querySelectorAll('*')) {
    const painted =
      element.childElementCount === 0 ||
      // 子の要素があっても、直接書いた文字（式の「3 ＋ 4 ＝」など）や、色のついた面は描かれている
      [...element.childNodes].some(
        (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
      ) ||
      getComputedStyle(element).backgroundColor !== 'rgba(0, 0, 0, 0)'
    if (!painted) continue
    const rect = element.getBoundingClientRect()
    if (!rect.width) continue
    left = Math.min(left, rect.left)
    right = Math.max(right, rect.right)
  }
  if (!(right > left)) return null
  return {
    width: (right - left) / current,
    offset: ((left + right) / 2 - (frame.left + frame.right) / 2) / current,
  }
}

// ステージ（白い面）の図や式を、画面いっぱいに大きく出すボタンと、その画面。
// 台本の画面には、親が読む見出し・教え方のポイント・セリフも出ているので、お子さんに見せるときは、これで図だけを出す。
// ボタンはステージの右上に置く（ステージの中に置き、ステージの幅を測って、同じ並びのまま拡大する）。
// 拡大は、図のうち実際に描かれているところが、画面の幅か高さに収まるまで（最大で3倍）
export function StageFullscreen({ children }: { children: ReactNode }) {
  const trigger = useRef<HTMLButtonElement>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const content = useRef<HTMLDivElement>(null)
  // 開いている間の、図の幅（ステージの中と同じ幅で並べてから拡大する）。閉じている間は、図を作らない
  const [width, setWidth] = useState<number | null>(null)
  // 拡大の倍率と、描かれているところを画面の真ん中へ寄せる量（拡大する前の大きさで）
  const [view, setView] = useState({ scale: 1, offset: 0 })

  useEffect(() => {
    if (width === null) return
    const element = dialog.current
    if (element && !element.open) element.showModal()
    // いまの倍率（測った大きさを、拡大する前の大きさに割り戻すため）
    let applied = 1
    // 画面に収まる大きさにする。画面を回したときも測り直す
    const fit = () => {
      const box = content.current
      const height = (box?.getBoundingClientRect().height ?? 0) / applied
      if (!box || !height) return
      const painted = paintedExtent(box, applied)
      const next = {
        scale: Math.max(
          1,
          Math.min(
            (window.innerWidth - SIDE) / (painted?.width ?? width),
            (window.innerHeight - ENDS) / height,
            MAX_SCALE,
          ),
        ),
        offset: painted?.offset ?? 0,
      }
      applied = next.scale
      setView(next)
    }
    fit()
    window.addEventListener('resize', fit)
    // 開いている間は、後ろの台本をスクロールさせない
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('resize', fit)
      document.body.style.overflow = previous
    }
  }, [width])

  const open = () => {
    const stage = trigger.current?.parentElement
    if (!stage) return
    const style = getComputedStyle(stage)
    const inner =
      stage.clientWidth -
      (parseFloat(style.paddingLeft) || 0) -
      (parseFloat(style.paddingRight) || 0)
    setView({ scale: 1, offset: 0 })
    setWidth(inner > 0 ? inner : 320)
  }

  return (
    <>
      <button
        className={styles.trigger}
        type="button"
        ref={trigger}
        aria-haspopup="dialog"
        aria-label="図を全画面で見せる"
        onClick={open}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M8 3H3v5M16 3h5v5M21 16v5h-5M8 21H3v-5" />
        </svg>
        全画面
      </button>
      {width !== null && (
        <dialog
          className={styles.dialog}
          ref={dialog}
          aria-label="全画面の図"
          // 閉じたら、押した「全画面」のボタンへフォーカスを戻す
          onClose={() => {
            setWidth(null)
            trigger.current?.focus({ preventScroll: true })
          }}
          // 台本のページ送り（スワイプ・← →）に、この画面の操作を渡さない
          onPointerDown={(event) => event.stopPropagation()}
          onPointerMove={(event) => event.stopPropagation()}
          onPointerUp={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <button
            className={styles.close}
            type="button"
            autoFocus
            onClick={() => dialog.current?.close()}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
            とじる
          </button>
          <div
            className={styles.content}
            ref={content}
            // 拡大は zoom で行う（transform の scale では、端数の倍率のときに図の端が欠けたり残ったりして描かれる）。
            // 描かれているところを画面の真ん中へ寄せる量は、zoom の前の大きさで書く
            style={{
              width,
              zoom: view.scale,
              transform: `translateX(${-view.offset}px)`,
            }}
          >
            {children}
          </div>
        </dialog>
      )}
    </>
  )
}
