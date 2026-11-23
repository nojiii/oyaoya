import { useRef, type PointerEvent } from 'react'
import { flushSync } from 'react-dom'
import type { CounterSide } from './counterModel'
import styles from './CounterGather.module.css'

type Drag = {
  pointer: number
  startX: number
  // まん中の線に着くまでに動ける量（左のおさらは正、右のおさらは負）
  limit: number
  dx: number
}

const SIDE_NAME = { left: 'ひだり', right: 'みぎ' } as const
const EASING = 'cubic-bezier(0.22, 1, 0.36, 1)'

const reducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

// 10までのたし算の広場。台本の「両手で一緒にまん中へ寄せる」と同じく、
// a このおさらと b このおさらを、それぞれ指でまん中へ寄せる。片方を、もう片方へ運ぶことはできない。
// 両方がまん中に着いたら1つのおさらにまとめ、さわった順に 1、2、3… と数字を出す（数えた跡）
export function CounterGather({
  a,
  b,
  apples = false,
  gathered,
  countedIds,
  onArrive,
  onCount,
  onInteract,
  describedBy,
}: {
  a: number
  b: number
  apples?: boolean
  gathered: CounterSide[]
  countedIds: number[]
  onArrive: (side: CounterSide) => void
  onCount: (id: number) => void
  onInteract: () => void
  describedBy?: string
}) {
  const board = useRef<HTMLDivElement>(null)
  const plates = useRef<Record<CounterSide, HTMLDivElement | null>>({
    left: null,
    right: null,
  })
  const drags = useRef<Record<CounterSide, Drag | null>>({
    left: null,
    right: null,
  })
  const merged = gathered.includes('left') && gathered.includes('right')
  const object = apples ? 'りんご' : 'おはじき'
  // 左のおさらは 0 〜 a−1、右のおさらは a 〜 a+b−1
  const groups: { side: CounterSide; ids: number[] }[] = [
    { side: 'left', ids: Array.from({ length: a }, (_, i) => i) },
    { side: 'right', ids: Array.from({ length: b }, (_, i) => a + i) },
  ]

  const limitOf = (side: CounterSide, plate: HTMLDivElement) => {
    const area = board.current!.getBoundingClientRect()
    const rect = plate.getBoundingClientRect()
    const center = area.left + area.width / 2
    // おさらどうしの間は、列の間（CSS の column-gap）と同じだけあける
    const gap = parseFloat(getComputedStyle(board.current!).columnGap) / 2 || 0
    return side === 'left'
      ? center - gap - rect.right
      : center + gap - rect.left
  }

  const slideBack = (plate: HTMLDivElement, dx: number) => {
    plate.style.transform = ''
    if (!dx || reducedMotion()) return
    plate.animate(
      [{ transform: `translateX(${dx}px)` }, { transform: 'translateX(0)' }],
      { duration: 220, easing: EASING },
    )
  }

  // まん中に着ける。おさらは CSS の並び（data-arrived）でまん中へ動くので、
  // 指を離した位置から、着いた位置へすべらせる。両方が着いたら、おはじきを1つのおさらへ集める
  const arrive = (side: CounterSide) => {
    const plate = plates.current[side]
    if (!plate || !board.current) return
    const before = new Map<string, DOMRect>()
    board.current
      .querySelectorAll<HTMLElement>('[data-piece]')
      .forEach((node) =>
        before.set(node.dataset.piece!, node.getBoundingClientRect()),
      )
    const plateBefore = plate.getBoundingClientRect()
    plate.style.transform = ''
    flushSync(() => onArrive(side))
    if (reducedMotion()) return
    const animate = (node: Element, from: DOMRect, duration: number) => {
      const to = node.getBoundingClientRect()
      const dx = from.left - to.left
      const dy = from.top - to.top
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return
      node.animate(
        [
          { transform: `translate(${dx}px, ${dy}px)` },
          { transform: 'translate(0, 0)' },
        ],
        { duration, easing: EASING },
      )
    }
    if (plate.isConnected) {
      animate(plate, plateBefore, 240)
      return
    }
    // 1つにまとめたおさら：2つのおさらの大きさから縮め、おはじきは元の場所から集める
    const together = board.current.querySelector<HTMLElement>('[data-merged]')
    if (together) {
      const color = getComputedStyle(together).backgroundColor
      together.animate(
        [
          { boxShadow: `0 0 0 24px ${color}` },
          { boxShadow: `0 0 0 0 ${color}` },
        ],
        { duration: 360, easing: EASING },
      )
    }
    board.current
      .querySelectorAll<HTMLElement>('[data-piece]')
      .forEach((node) => {
        const from = before.get(node.dataset.piece!)
        if (from) animate(node, from, 380)
      })
  }

  const dragHandlers = (side: CounterSide) => {
    const done = gathered.includes(side)
    const end = (event: PointerEvent<HTMLDivElement>, cancelled: boolean) => {
      const drag = drags.current[side]
      if (!drag || drag.pointer !== event.pointerId) return
      drags.current[side] = null
      const plate = event.currentTarget
      delete plate.dataset.dragging
      // 半分ほど寄せたら、まん中に着ける
      if (!cancelled && drag.limit && drag.dx / drag.limit >= 0.5) arrive(side)
      else slideBack(plate, drag.dx)
    }
    return {
      onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
        if (done || drags.current[side] || event.button !== 0) return
        onInteract()
        const plate = event.currentTarget
        plate.getAnimations().forEach((animation) => animation.cancel())
        drags.current[side] = {
          pointer: event.pointerId,
          startX: event.clientX,
          limit: limitOf(side, plate),
          dx: 0,
        }
        plate.dataset.dragging = 'true'
        plate.setPointerCapture(event.pointerId)
      },
      onPointerMove: (event: PointerEvent<HTMLDivElement>) => {
        const drag = drags.current[side]
        if (!drag || drag.pointer !== event.pointerId) return
        const raw = event.clientX - drag.startX
        // まん中の線をこえない。外側へも動かない
        drag.dx =
          side === 'left'
            ? Math.min(Math.max(raw, 0), Math.max(drag.limit, 0))
            : Math.max(Math.min(raw, 0), Math.min(drag.limit, 0))
        event.currentTarget.style.transform = `translateX(${drag.dx}px)`
      },
      onPointerUp: (event: PointerEvent<HTMLDivElement>) => end(event, false),
      onPointerCancel: (event: PointerEvent<HTMLDivElement>) =>
        end(event, true),
      onLostPointerCapture: (event: PointerEvent<HTMLDivElement>) =>
        end(event, true),
    }
  }

  const piece = (id: number, index: number, interactive: boolean) => {
    const order = countedIds.indexOf(id)
    const className = `${styles.piece} ${id >= a ? styles.second : ''} ${apples ? styles.apple : ''}`
    if (!interactive)
      return (
        <span key={id} className={className} data-piece={id} aria-hidden="true">
          {apples ? '🍎' : ''}
        </span>
      )
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
            : `${index + 1}こめの${object}`
        }
        aria-describedby={describedBy}
        onClick={() => onCount(id)}
      >
        {order >= 0 ? order + 1 : apples ? '🍎' : ''}
      </button>
    )
  }

  return (
    <div
      ref={board}
      className={styles.board}
      data-merged={merged || undefined}
      aria-label={`${object}を まん中へ よせる広場`}
    >
      {merged ? (
        <div
          className={`${styles.plate} ${styles.together}`}
          data-merged
          role="group"
          aria-label={`まん中で ひとつに なった${object}`}
        >
          <div className={styles.pieces}>
            {[...groups[0].ids, ...groups[1].ids].map((id, index) =>
              piece(id, index, true),
            )}
          </div>
          {/* 合わせた数は、お子さんが数えるので出さない */}
          <span className={styles.count}>？こ</span>
        </div>
      ) : (
        <>
          <span className={styles.middle} aria-hidden="true">
            <span>まん中</span>
          </span>
          {groups.map(({ side, ids }) => {
            const done = gathered.includes(side)
            return (
              <div
                key={side}
                ref={(node) => {
                  plates.current[side] = node
                }}
                className={styles.plate}
                data-side={side}
                data-arrived={done || undefined}
                role={done ? 'group' : 'button'}
                tabIndex={done ? undefined : 0}
                aria-label={`${SIDE_NAME[side]}の ${object} ${ids.length}こ${done ? '（まん中に よせた）' : '。まん中へ よせる'}`}
                aria-describedby={describedBy}
                onKeyDown={(event) => {
                  if (done || (event.key !== 'Enter' && event.key !== ' '))
                    return
                  event.preventDefault()
                  onInteract()
                  arrive(side)
                }}
                {...dragHandlers(side)}
              >
                <div className={styles.pieces}>
                  {ids.map((id, index) => piece(id, index, false))}
                </div>
                <span className={styles.count}>{ids.length}こ</span>
                {!done && (
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
                    <path d="m9 6 6 6-6 6" />
                  </svg>
                )}
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
