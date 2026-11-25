import { useRef, type CSSProperties, type PointerEvent } from 'react'
import { flushSync } from 'react-dom'
import styles from './CounterJoin.module.css'

type Drag = {
  pointer: number
  startX: number
  // 左のおさらに届くまでに動ける量（左へ動かすので負）
  limit: number
  dx: number
  // 少しでも指をすべらせたら、タップではなくドラッグとして扱う
  moved: boolean
}

const EASING = 'cubic-bezier(0.22, 1, 0.36, 1)'
// これより短い動きは、指のぶれとしてタップにする
const TAP_SLOP = 6

const reducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

// 10までのたし算の広場。左のおさら（はじめのかず a こ）は動かさず、
// 右のおさら（たすかず b こ）をまとまりのまま左へ動かして、左のおさらに足す。
// 指で左へ動かしても、さわるだけでもよい。足すと2まいのおさらが1まいになり、
// 中では a このまとまりと b このまとまりが並んだまま残る。そのあと、さわった順に 1、2、3… と数字を出す（数えた跡）
export function CounterJoin({
  a,
  b,
  apples = false,
  joined,
  countedIds,
  onJoin,
  onCount,
  onInteract,
  describedBy,
}: {
  a: number
  b: number
  apples?: boolean
  joined: boolean
  countedIds: number[]
  onJoin: () => void
  onCount: (id: number) => void
  onInteract: () => void
  describedBy?: string
}) {
  const board = useRef<HTMLDivElement>(null)
  const base = useRef<HTMLDivElement>(null)
  const drag = useRef<Drag | null>(null)
  const object = apples ? 'りんご' : 'おはじき'
  // 左のおさらは 0 〜 a−1、右のおさらは a 〜 a+b−1
  const leftIds = Array.from({ length: a }, (_, i) => i)
  const rightIds = Array.from({ length: b }, (_, i) => a + i)

  // 右のおさらの左の端が、左のおさらの右の端（とその間のすきま）に着くまでの量
  const limitOf = (plate: HTMLElement) => {
    const left = base.current!.getBoundingClientRect()
    const gap = parseFloat(getComputedStyle(board.current!).columnGap) || 0
    return Math.min(left.right + gap - plate.getBoundingClientRect().left, 0)
  }

  // 足す。おはじきは React が並べ直すので、足す前の位置から、着いた位置へすべらせる。
  // 左のおさらは、右へのびて1まいになる
  const join = (keyboard: boolean) => {
    const area = board.current
    const plate = base.current
    if (!area || !plate) return
    const before = new Map<string, DOMRect>()
    area
      .querySelectorAll<HTMLElement>('[data-piece]')
      .forEach((node) =>
        before.set(node.dataset.piece!, node.getBoundingClientRect()),
      )
    const plateBefore = plate.getBoundingClientRect()
    flushSync(onJoin)
    // キーボードで足したときは、数える最初のおはじきへフォーカスを移す
    if (keyboard)
      plate.querySelector<HTMLElement>('button[data-piece]')?.focus()
    if (reducedMotion()) return
    const plateAfter = plate.getBoundingClientRect()
    if (Math.abs(plateAfter.width - plateBefore.width) > 0.5)
      plate.animate(
        [
          { width: `${plateBefore.width}px` },
          { width: `${plateAfter.width}px` },
        ],
        { duration: 320, easing: EASING },
      )
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
        { duration: 320, easing: EASING },
      )
    })
  }

  const slideBack = (plate: HTMLElement, dx: number) => {
    plate.style.transform = ''
    if (!dx || reducedMotion()) return
    plate.animate(
      [{ transform: `translateX(${dx}px)` }, { transform: 'translateX(0)' }],
      { duration: 220, easing: EASING },
    )
  }

  const end = (event: PointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const current = drag.current
    if (!current || current.pointer !== event.pointerId) return
    drag.current = null
    const plate = event.currentTarget
    delete plate.dataset.dragging
    // さわるだけ（動かさずに離した）か、半分ほど動かしたら足す
    if (
      !cancelled &&
      (!current.moved || (current.limit && current.dx / current.limit >= 0.5))
    ) {
      join(false)
      return
    }
    slideBack(plate, current.dx)
  }

  const piece = (id: number) => {
    const className = `${styles.piece} ${id >= a ? styles.second : ''} ${apples ? styles.apple : ''}`
    if (!joined)
      return (
        <span key={id} className={className} data-piece={id} aria-hidden="true">
          {apples ? '🍎' : ''}
        </span>
      )
    const order = countedIds.indexOf(id)
    return (
      <button
        type="button"
        key={id}
        className={className}
        data-piece={id}
        data-counted={order >= 0 || undefined}
        aria-label={
          order >= 0
            ? `${order + 1}とかぞえた${object}`
            : `${id + 1}こめの${object}`
        }
        aria-describedby={describedBy}
        onClick={() => onCount(id)}
      >
        {order >= 0 ? order + 1 : apples ? '🍎' : ''}
      </button>
    )
  }

  // まとまり。3こずつ並べる（数が3こより少ないときは、その数だけの幅にする）
  const cluster = (ids: number[]) => (
    <div
      className={styles.pieces}
      style={
        { '--cols': Math.min(Math.max(ids.length, 1), 3) } as CSSProperties
      }
    >
      {ids.map(piece)}
    </div>
  )

  return (
    <div
      ref={board}
      className={styles.board}
      data-joined={joined || undefined}
      aria-label={`${object}を たす広場`}
    >
      <div
        ref={base}
        className={styles.plate}
        data-side="left"
        role="group"
        aria-label={
          joined ? `ひとつに なった${object}` : `ひだりの ${object} ${a}こ`
        }
      >
        <div className={styles.clusters}>
          {cluster(leftIds)}
          {joined && cluster(rightIds)}
        </div>
        {/* 足した数は、お子さんが数えるので出さない */}
        <span className={styles.count}>{joined ? '？こ' : `${a}こ`}</span>
      </div>
      {!joined && (
        <div
          className={`${styles.plate} ${styles.mover}`}
          data-side="right"
          role="button"
          tabIndex={0}
          aria-label={`みぎの ${object} ${b}こ。ひだりへ たす`}
          aria-describedby={describedBy}
          onKeyDown={(event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return
            event.preventDefault()
            onInteract()
            join(true)
          }}
          onPointerDown={(event) => {
            if (drag.current || event.button !== 0) return
            onInteract()
            const plate = event.currentTarget
            plate.getAnimations().forEach((animation) => animation.cancel())
            drag.current = {
              pointer: event.pointerId,
              startX: event.clientX,
              limit: limitOf(plate),
              dx: 0,
              moved: false,
            }
            plate.setPointerCapture(event.pointerId)
          }}
          onPointerMove={(event) => {
            const current = drag.current
            if (!current || current.pointer !== event.pointerId) return
            const raw = event.clientX - current.startX
            if (!current.moved && Math.abs(raw) < TAP_SLOP) return
            current.moved = true
            // 左へだけ動き、左のおさらをこえない
            current.dx = Math.max(Math.min(raw, 0), current.limit)
            const plate = event.currentTarget
            plate.dataset.dragging = 'true'
            plate.style.transform = `translateX(${current.dx}px)`
          }}
          onPointerUp={(event) => end(event, false)}
          onPointerCancel={(event) => end(event, true)}
          onLostPointerCapture={(event) => end(event, true)}
        >
          {cluster(rightIds)}
          <span className={styles.count}>{b}こ</span>
          <svg
            className={styles.chevron}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m15 6-6 6 6 6" />
          </svg>
        </div>
      )}
    </div>
  )
}
