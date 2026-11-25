import { useRef, type MouseEvent, type PointerEvent } from 'react'
import { flushSync } from 'react-dom'
import styles from './CounterGather.module.css'

type Side = 'left' | 'right'

type Drag = {
  pointer: number
  startX: number
  startY: number
  dx: number
  dy: number
  // 少しでも指をすべらせたら、タップではなくドラッグとして扱う
  moved: boolean
}

const SIDE_NAME = { left: 'ひだり', right: 'みぎ' } as const
const EASING = 'cubic-bezier(0.22, 1, 0.36, 1)'
// これより短い動きは、指のぶれとしてタップにする
const DRAG_THRESHOLD = 6

const reducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

// 10までのたし算の広場。左に a このおさら、右に b このおさら、まん中に空のおさらを置き、
// おはじきを1こずつ、まん中のおさらへ寄せる（指でまん中まで運んでも、さわるだけでもよい）。
// 片方を、もう片方のおさらへ運ぶことはできない。
// 全部がまん中に着いたら1つのおさらにまとまったことにし、さわった順に 1、2、3… と数字を出す（数えた跡）
export function CounterGather({
  a,
  b,
  apples = false,
  gathered,
  countedIds,
  onGather,
  onCount,
  onInteract,
  describedBy,
}: {
  a: number
  b: number
  apples?: boolean
  // まん中へ寄せたおはじきの id（着いた順）。左のおさらは 0 〜 a−1、右のおさらは a 〜 a+b−1
  gathered: number[]
  countedIds: number[]
  onGather: (id: number) => void
  onCount: (id: number) => void
  onInteract: () => void
  describedBy?: string
}) {
  const board = useRef<HTMLDivElement>(null)
  const middle = useRef<HTMLDivElement>(null)
  const drags = useRef(new Map<number, Drag>())
  // ドラッグで動かしたあとに続けて届くクリックは、タップとして扱わない
  const dragged = useRef(new Set<number>())
  const merged = gathered.length >= a + b
  const object = apples ? 'りんご' : 'おはじき'
  const sideOf = (id: number): Side => (id < a ? 'left' : 'right')
  const remaining = (from: number, count: number) =>
    Array.from({ length: count }, (_, i) => from + i).filter(
      (id) => !gathered.includes(id),
    )

  // おはじきのまん中が、まん中のおさらの手前の端まで来たら、まん中に着いたことにする
  const reaches = (id: number, node: HTMLElement) => {
    const target = middle.current?.getBoundingClientRect()
    if (!target) return false
    const rect = node.getBoundingClientRect()
    const center = rect.left + rect.width / 2
    return sideOf(id) === 'left'
      ? center >= target.left
      : center <= target.right
  }

  // まん中のおさらへ移す。おはじきは React が並べ直すので、移す前の位置から、着いた位置へすべらせる。
  // まわりのおはじき（残ったおはじきの詰め直し）も同じようにすべらせる
  const gather = (id: number, keyboard: boolean) => {
    const area = board.current
    if (!area) return
    const before = new Map<string, DOMRect>()
    area
      .querySelectorAll<HTMLElement>('[data-piece]')
      .forEach((node) =>
        before.set(node.dataset.piece!, node.getBoundingClientRect()),
      )
    const last = gathered.length + 1 >= a + b
    flushSync(() => onGather(id))
    // キーボードで動かしたときは、同じおさらの次のおはじきへ（なければ、もう片方のおさらや数える段へ）フォーカスを移す
    if (keyboard)
      (
        area.querySelector<HTMLElement>(
          `[data-side="${sideOf(id)}"] [data-piece]`,
        ) ??
        area.querySelector<HTMLElement>(
          '[data-side] [data-piece], [data-middle] button[data-piece]',
        )
      )?.focus()
    if (reducedMotion()) return
    area.querySelectorAll<HTMLElement>('[data-piece]').forEach((node) => {
      const from = before.get(node.dataset.piece!)
      if (!from) return
      const to = node.getBoundingClientRect()
      const dx = from.left - to.left
      const dy = from.top - to.top
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return
      node.animate(
        [
          { transform: `translate(${dx}px, ${dy}px)` },
          { transform: 'translate(0, 0)' },
        ],
        {
          duration: node.dataset.piece === String(id) ? 300 : 220,
          easing: EASING,
        },
      )
    })
    // 最後の1こが着いたら、まん中のおさらを少しふくらませて、1つにまとまったことを見せる
    const plate = middle.current
    if (last && plate) {
      const color = getComputedStyle(plate).backgroundColor
      plate.animate(
        [
          { boxShadow: `0 0 0 0 ${color}` },
          { boxShadow: `0 0 0 10px ${color}` },
          { boxShadow: `0 0 0 0 ${color}` },
        ],
        { duration: 420, easing: EASING },
      )
    }
  }

  const slideBack = (node: HTMLElement, dx: number, dy: number) => {
    node.style.transform = ''
    if ((!dx && !dy) || reducedMotion()) return
    node.animate(
      [
        { transform: `translate(${dx}px, ${dy}px)` },
        { transform: 'translate(0, 0)' },
      ],
      { duration: 220, easing: EASING },
    )
  }

  const setOver = (over: boolean) => {
    if (!middle.current) return
    if (over) middle.current.dataset.over = 'true'
    else delete middle.current.dataset.over
  }

  const sourceHandlers = (id: number) => {
    const end = (
      event: PointerEvent<HTMLButtonElement>,
      cancelled: boolean,
    ) => {
      const drag = drags.current.get(id)
      if (!drag || drag.pointer !== event.pointerId) return
      drags.current.delete(id)
      setOver(false)
      // 動かさずに離したときは、続くクリック（タップ）で寄せる
      if (!drag.moved) return
      dragged.current.add(id)
      const node = event.currentTarget
      if (!cancelled && reaches(id, node)) {
        gather(id, false)
        return
      }
      delete node.dataset.dragging
      slideBack(node, drag.dx, drag.dy)
    }
    return {
      onPointerDown: (event: PointerEvent<HTMLButtonElement>) => {
        if (drags.current.has(id) || event.button !== 0) return
        onInteract()
        dragged.current.delete(id)
        const node = event.currentTarget
        node.getAnimations().forEach((animation) => animation.cancel())
        drags.current.set(id, {
          pointer: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          dx: 0,
          dy: 0,
          moved: false,
        })
        node.setPointerCapture(event.pointerId)
      },
      onPointerMove: (event: PointerEvent<HTMLButtonElement>) => {
        const drag = drags.current.get(id)
        if (!drag || drag.pointer !== event.pointerId) return
        drag.dx = event.clientX - drag.startX
        drag.dy = event.clientY - drag.startY
        if (!drag.moved && Math.hypot(drag.dx, drag.dy) < DRAG_THRESHOLD) return
        drag.moved = true
        const node = event.currentTarget
        node.dataset.dragging = 'true'
        node.style.transform = `translate(${drag.dx}px, ${drag.dy}px)`
        setOver(reaches(id, node))
      },
      onPointerUp: (event: PointerEvent<HTMLButtonElement>) =>
        end(event, false),
      onPointerCancel: (event: PointerEvent<HTMLButtonElement>) =>
        end(event, true),
      onLostPointerCapture: (event: PointerEvent<HTMLButtonElement>) =>
        end(event, true),
      // さわるだけでも、まん中へ寄せる（Enter・スペースでも同じ）
      onClick: (event: MouseEvent<HTMLButtonElement>) => {
        const keyboard = event.detail === 0
        if (!keyboard && dragged.current.delete(id)) return
        onInteract()
        gather(id, keyboard)
      },
    }
  }

  const className = (id: number) =>
    `${styles.piece} ${id >= a ? styles.second : ''} ${apples ? styles.apple : ''}`

  // まん中のおはじき。全部そろうまでは飾り、そろったら数えるボタンにする
  const middlePiece = (id: number, index: number) => {
    if (!merged)
      return (
        <span
          key={id}
          className={className(id)}
          data-piece={id}
          aria-hidden="true"
        >
          {apples ? '🍎' : ''}
        </span>
      )
    const order = countedIds.indexOf(id)
    return (
      <button
        type="button"
        key={id}
        className={className(id)}
        data-piece={id}
        data-counted={order >= 0 || undefined}
        aria-label={
          order >= 0
            ? `${order + 1}とかぞえた${object}`
            : `${index + 1}こめの${object}`
        }
        aria-describedby={describedBy}
        onClick={() => onCount(id)}
      >
        {order >= 0 ? order + 1 : apples ? '🍎' : ''}
      </button>
    )
  }

  // 左右のおさら。寄せずに残っているおはじきだけを並べる。下の「3こ」は、はじめの数のまま出しておく
  const plate = (side: Side, count: number, ids: number[]) => (
    <div
      className={styles.plate}
      data-side={side}
      data-empty={ids.length === 0 || undefined}
      role="group"
      aria-label={`${SIDE_NAME[side]}の おさら ${count}こ`}
    >
      <div className={styles.pieces}>
        {ids.map((id) => (
          <button
            type="button"
            key={id}
            className={className(id)}
            data-piece={id}
            aria-label={`${SIDE_NAME[side]}の ${object}。まん中へ よせる`}
            aria-describedby={describedBy}
            {...sourceHandlers(id)}
          >
            {apples ? '🍎' : ''}
          </button>
        ))}
      </div>
      <span className={styles.count}>{count}こ</span>
    </div>
  )

  return (
    <div
      ref={board}
      className={styles.board}
      aria-label={`${object}を まん中へ よせる広場`}
    >
      {plate('left', a, remaining(0, a))}
      <div
        ref={middle}
        className={`${styles.plate} ${styles.middle}`}
        data-middle
        data-merged={merged || undefined}
        role="group"
        aria-label={
          merged ? `まん中で ひとつに なった${object}` : 'まん中の おさら'
        }
      >
        <span className={styles.middleLabel} aria-hidden="true">
          まん中
        </span>
        <div className={styles.pieces}>
          {gathered.map((id, index) => middlePiece(id, index))}
        </div>
        {/* 合わせた数は、お子さんが数えるので出さない */}
        <span className={styles.count}>？こ</span>
      </div>
      {plate('right', b, remaining(a, b))}
    </div>
  )
}
