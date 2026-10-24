import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { counterGroups, type CounterProblem } from './counterModel'
import styles from './VisualPlayground.module.css'
import { visualSlots, nearestEmptySlot } from './visualSlots'
import { counterPrompt } from './counterPrompt'

type Piece = {
  id: number
  x: number
  y: number
  green: boolean
  side: 'left' | 'right'
  removed?: boolean
}

export function VisualPlayground({
  children,
  problem,
  step,
  diagram,
  apples = false,
  showOpenHint = true,
  showIntroduction = false,
}: {
  children: ReactNode
  problem?: CounterProblem
  step: number
  diagram?: ReactNode
  apples?: boolean
  showOpenHint?: boolean
  showIntroduction?: boolean
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const introduction = useRef<HTMLDialogElement>(null)
  const introductionTitle = useId()
  const introductionDescription = useId()
  const preview = useRef<HTMLDivElement>(null)
  const closing = useRef(false)
  const board = useRef<HTMLDivElement>(null)
  const drag = useRef<{
    id: number
    pointer: number
    startX: number
    startY: number
    dx: number
    dy: number
    rect: DOMRect
    node: HTMLButtonElement
    frame: number | null
  } | null>(null)
  const nextId = useRef(0)
  const title = useId()
  const hint = useId()
  const [pieces, setPieces] = useState<Piece[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [countedIds, setCountedIds] = useState<number[]>([])
  const [questionKey, setQuestionKey] = useState('')
  const [hasPointed, setHasPointed] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const addition = problem?.mode === 'add' || problem?.mode === 'carry'
  const subtraction = problem?.mode === 'sub' || problem?.mode === 'borrow'
  const split = addition || subtraction
  const orangeCount = pieces.filter((piece) => piece.side === 'left').length
  const greenCount = pieces.length - orangeCount
  const interactive = !!problem || apples
  const invitationPiece = addition
    ? pieces.find((piece) => piece.green)
    : pieces[0]
  const operationHint = subtraction
    ? 'おはじきを みぎへ うごかしてみよう'
    : addition
      ? 'みぎの おはじきを ひだりへ うごかしてみよう'
      : 'おはじきを さわって かぞえてみよう'
  const moved = subtraction
    ? greenCount
    : addition
      ? pieces.filter((piece) => piece.green && piece.side === 'left').length
      : countedIds.length
  const targetCount = split ? problem.b : pieces.length
  const progressKey = `${problem?.mode}-${problem?.a}-${problem?.b}-${moved}-${pieces.map((piece) => piece.side).join(',')}-${countedIds.join(',')}`
  const wrongSide =
    addition && pieces.some((piece) => !piece.green && piece.side === 'right')
  const completed =
    (addition || subtraction) &&
    !wrongSide &&
    moved === targetCount &&
    questionKey === progressKey
  const readyToCount = addition && completed
  const prompt = wrongSide
    ? 'ちゃいろの おはじきは、ひだりに もどしてみよう。'
    : counterPrompt(
        problem,
        moved,
        pieces.length,
        questionKey === progressKey,
        apples,
      )
  useEffect(() => {
    if (!interactive || moved !== targetCount) return
    const timer = window.setTimeout(() => setQuestionKey(progressKey), 950)
    return () => window.clearTimeout(timer)
  }, [interactive, moved, targetCount, progressKey])
  const slots = visualSlots(pieces.length, split)
  const arrange = (items: Piece[]) => {
    const places = visualSlots(items.length, split)
    const indexes = { left: 0, right: 0 }
    return items.map((item, i) => {
      const available = split
        ? places.filter((slot) => slot.side === item.side)
        : places
      return { ...item, ...available[split ? indexes[item.side]++ : i] }
    })
  }
  const cancelDrag = () => {
    const active = drag.current
    if (!active) return
    if (active.frame !== null) cancelAnimationFrame(active.frame)
    active.node.style.transform = ''
    delete active.node.dataset.dragging
    drag.current = null
  }
  useEffect(
    () => () => {
      const active = drag.current
      if (active?.frame != null) cancelAnimationFrame(active.frame)
    },
    [],
  )
  const reset = () => {
    setCountedIds([])
    setHasPointed(false)
    setQuestionKey('')
    const groups =
      addition && problem
        ? [{ count: problem.a }, { count: problem.b }]
        : subtraction && problem
          ? [{ count: problem.a }]
          : problem
            ? counterGroups(problem, step)
            : [{ count: 5 }]
    setPieces(
      arrange(
        groups.flatMap((group, index) =>
          Array.from({ length: Math.max(0, group.count) }, () => ({
            id: nextId.current++,
            x: 0,
            y: 0,
            green: index % 2 === 1,
            side: index % 2 === 1 ? ('right' as const) : ('left' as const),
            removed: 'removed' in group && group.removed === true,
          })),
        ),
      ),
    )
    setSelected(null)
  }
  const move = (id: number, x: number, y: number, width = 1, height = 1) => {
    setPieces((items) => {
      const slot = nearestEmptySlot(
        visualSlots(items.length, split),
        items.filter((item) => item.id !== id),
        x,
        y,
        width,
        height,
      )
      return slot
        ? items.map((item) => (item.id === id ? { ...item, ...slot } : item))
        : items
    })
  }
  const open = () => {
    const origin = preview.current?.getBoundingClientRect()
    const target = dialog.current
    if (!target || target.open) return
    reset()
    setHasInteracted(false)
    target.showModal()
    if (
      !origin ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return
    const destination = target.getBoundingClientRect()
    target.animate(
      [
        {
          transform: `translate(${origin.left - destination.left}px, ${origin.top - destination.top}px) scale(${origin.width / destination.width}, ${origin.height / destination.height})`,
          borderRadius: '24px',
          opacity: 0.65,
        },
        {
          transform: 'translate(0, 0) scale(1)',
          borderRadius: '0px',
          opacity: 1,
        },
      ],
      { duration: 380, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    )
  }
  const close = () => {
    cancelDrag()
    const target = dialog.current
    if (!target?.open || closing.current) return
    const origin = preview.current?.getBoundingClientRect()
    if (
      !origin ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      target.close()
      return
    }
    closing.current = true
    target.getAnimations().forEach((animation) => animation.cancel())
    const destination = target.getBoundingClientRect()
    const animation = target.animate(
      [
        {
          transform: 'translate(0, 0) scale(1)',
          borderRadius: '0px',
          opacity: 1,
        },
        {
          transform: `translate(${origin.left - destination.left}px, ${origin.top - destination.top}px) scale(${origin.width / destination.width}, ${origin.height / destination.height})`,
          borderRadius: '24px',
          opacity: 0.45,
        },
      ],
      {
        duration: 300,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        fill: 'forwards',
      },
    )
    animation.onfinish = () => {
      target.close()
      animation.cancel()
      closing.current = false
    }
  }
  return (
    <>
      <div
        ref={preview}
        role="button"
        tabIndex={0}
        aria-haspopup="dialog"
        title="子どもに見せる"
        className={styles.preview}
        onClick={() => {
          if (showIntroduction) introduction.current?.showModal()
          else open()
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            if (showIntroduction) introduction.current?.showModal()
            else open()
          }
        }}
      >
        {children}
        {showOpenHint && (
          <span className={styles.openHint}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              role="img"
              aria-label="大きく表示"
            >
              <path d="M8 3H3v5M16 3h5v5M21 16v5h-5M8 21H3v-5" />
            </svg>
          </span>
        )}
      </div>
      {showIntroduction && (
        <dialog
          ref={introduction}
          className={styles.introduction}
          aria-labelledby={introductionTitle}
          aria-describedby={introductionDescription}
          onPointerDown={(event) => event.stopPropagation()}
          onPointerMove={(event) => event.stopPropagation()}
          onPointerUp={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <h2 id={introductionTitle}>おはじきを使ってみましょう</h2>
          <div id={introductionDescription}>
            <p>
              お子さんにスマホ画面を見せながら、一緒におはじきを動かしてみましょう。
            </p>
            <p>
              {subtraction
                ? '画面の案内に合わせて取り分け、最後に残った数を考えてみましょう。'
                : '画面の案内に合わせて動かし、最後に全部で何こあるか考えてみましょう。'}
            </p>
          </div>
          <div className={styles.introductionActions}>
            <button
              type="button"
              className={styles.introductionPrimary}
              onClick={() => {
                introduction.current?.close()
                open()
              }}
            >
              おはじき画面へ
            </button>
            <button type="button" onClick={() => introduction.current?.close()}>
              もどる
            </button>
          </div>
        </dialog>
      )}
      <dialog
        ref={dialog}
        className={styles.dialog}
        data-addition={addition}
        aria-labelledby={title}
        onCancel={(event) => {
          event.preventDefault()
          close()
        }}
        onClose={() => {
          closing.current = false
          dialog.current
            ?.getAnimations()
            .forEach((animation) => animation.cancel())
        }}
        onPointerDown={(event) => event.stopPropagation()}
        onPointerMove={(event) => event.stopPropagation()}
        onPointerUp={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <h2 id={title}>
            {interactive ? 'うごかして かんがえよう' : 'いっしょに みてみよう'}
          </h2>
          <button
            type="button"
            className={styles.iconButton}
            onClick={close}
            aria-label="もどる"
            title="もどる"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m10 5-7 7 7 7M3 12h18" />
            </svg>
          </button>
        </header>
        {interactive ? (
          <>
            <p
              id={hint}
              className={styles.prompt}
              aria-live="polite"
              aria-atomic="true"
            >
              <span key={prompt}>{prompt}</span>
              {readyToCount && (
                <small className={styles.countingHint}>
                  1こずつ かぞえてみよう。
                </small>
              )}
            </p>
            <div className={styles.toolbar}>
              <p
                className={styles.operationHint}
                data-hidden={hasInteracted}
                aria-hidden={hasInteracted}
              >
                {operationHint}
              </p>
              {!split && <output aria-live="polite">{pieces.length}こ</output>}
              <button
                type="button"
                className={styles.iconButton}
                onClick={() => {
                  setHasInteracted(true)
                  reset()
                }}
                aria-label="もとにもどす"
                title="もとにもどす"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 10a9 9 0 1 1 2 8M3 4v6h6" />
                </svg>
              </button>
            </div>
            <div
              ref={board}
              className={styles.board}
              style={{
                minHeight: addition
                  ? Math.max(
                      280,
                      Math.ceil(((slots.length / 4 - 1) * 44) / 0.64),
                    )
                  : Math.max(
                      360,
                      (Math.max(...slots.map((slot) => slot.y)) > 0
                        ? Math.ceil(slots.length / (split ? 4 : 5))
                        : 5) * 76,
                    ),
              }}
              aria-label={
                apples ? 'りんごを動かす広場' : 'おはじきを動かす広場'
              }
            >
              {split && (
                <div className={styles.mats}>
                  <div className={styles.orangeMat}>
                    <output
                      aria-live="polite"
                      aria-label={`${subtraction ? 'のこり' : '左のわく'} ${orangeCount}こ`}
                    >
                      <strong key={orangeCount} className={styles.count}>
                        {orangeCount}
                      </strong>
                    </output>
                  </div>
                  <span aria-hidden="true" />
                  <div
                    className={subtraction ? styles.takenMat : styles.greenMat}
                  >
                    {subtraction ? (
                      <span className={styles.takenLabel}>とったぶん</span>
                    ) : (
                      <output
                        aria-live="polite"
                        aria-label={`右のわく ${greenCount}こ`}
                      >
                        <strong key={greenCount} className={styles.count}>
                          {greenCount}
                        </strong>
                      </output>
                    )}
                  </div>
                </div>
              )}
              {slots.map((slot, i) => (
                <span
                  key={i}
                  className={styles.slot}
                  aria-hidden="true"
                  style={{ left: slot.x + '%', top: slot.y + '%' }}
                />
              ))}
              {pieces.map((piece, i) => (
                <button
                  type="button"
                  key={piece.id}
                  className={`${styles.piece} ${apples ? styles.apple : ''} ${piece.green ? styles.green : ''} ${piece.removed ? styles.removed : ''}`}
                  style={{ left: `${piece.x}%`, top: `${piece.y}%` }}
                  aria-label={`${i + 1}こめの${apples ? 'りんご' : 'おはじき'}${piece.removed ? '（とったぶん）' : ''}`}
                  data-invitation={
                    !hasInteracted && piece.id === invitationPiece?.id
                  }
                  aria-pressed={selected === piece.id}
                  onClick={() => setHasInteracted(true)}
                  aria-describedby={hint}
                  onFocus={() => setSelected(piece.id)}
                  onPointerDown={(event) => {
                    if (drag.current || event.button !== 0) return
                    setHasInteracted(true)
                    if (readyToCount) setHasPointed(true)
                    if (!split)
                      setCountedIds((ids) =>
                        ids.includes(piece.id) ? ids : [...ids, piece.id],
                      )
                    event.currentTarget
                      .getAnimations()
                      .forEach((animation) => animation.cancel())
                    drag.current = {
                      id: piece.id,
                      pointer: event.pointerId,
                      startX: event.clientX,
                      startY: event.clientY,
                      dx: 0,
                      dy: 0,
                      rect: board.current!.getBoundingClientRect(),
                      node: event.currentTarget,
                      frame: null,
                    }
                    event.currentTarget.dataset.dragging = 'true'
                    setSelected(piece.id)
                    event.currentTarget.setPointerCapture(event.pointerId)
                  }}
                  onPointerMove={(event) => {
                    const active = drag.current
                    if (
                      !active ||
                      active.id !== piece.id ||
                      active.pointer !== event.pointerId
                    )
                      return
                    active.dx = event.clientX - active.startX
                    active.dy = event.clientY - active.startY
                    if (active.frame !== null) return
                    active.frame = requestAnimationFrame(() => {
                      active.node.style.transform =
                        'translate(-50%, -50%) translate3d(' +
                        active.dx +
                        'px, ' +
                        active.dy +
                        'px, 0)'
                      active.frame = null
                    })
                  }}
                  onPointerUp={(event) => {
                    const active = drag.current
                    if (!active || active.pointer !== event.pointerId) return
                    const x =
                      piece.x +
                      ((event.clientX - active.startX) / active.rect.width) *
                        100
                    const y =
                      piece.y +
                      ((event.clientY - active.startY) / active.rect.height) *
                        100
                    const slot = nearestEmptySlot(
                      slots,
                      pieces.filter((item) => item.id !== piece.id),
                      x,
                      y,
                      active.rect.width,
                      active.rect.height,
                    )
                    move(piece.id, x, y, active.rect.width, active.rect.height)
                    cancelDrag()
                    if (
                      slot &&
                      !window.matchMedia('(prefers-reduced-motion: reduce)')
                        .matches
                    ) {
                      active.node.animate(
                        [
                          {
                            transform: `translate(-50%, -50%) translate3d(${((x - slot.x) * active.rect.width) / 100}px, ${((y - slot.y) * active.rect.height) / 100}px, 0)`,
                          },
                          {
                            transform:
                              'translate(-50%, -50%) translate3d(0, 0, 0)',
                          },
                        ],
                        { duration: 110, easing: 'ease-out' },
                      )
                    }
                  }}
                  onPointerCancel={cancelDrag}
                  onLostPointerCapture={cancelDrag}
                >
                  {apples ? '🍎' : ''}
                </button>
              ))}
              {readyToCount && !hasPointed && pieces[0] && (
                <svg
                  className={styles.pointingHand}
                  viewBox="0 0 40 48"
                  fill="none"
                  aria-hidden="true"
                  style={{
                    left: 'calc(' + pieces[0].x + '% + 5px)',
                    top: 'calc(' + pieces[0].y + '% + 5px)',
                  }}
                >
                  <path
                    d="M14 24V10a4 4 0 0 1 8 0v11l2-1c2-1 5 0 5 3 4-1 6 1 6 4v8c0 6-4 10-10 10h-3c-4 0-7-2-9-5L5 29c-2-4 3-7 6-4l3 3"
                    fill="#fffdf8"
                    stroke="#80522f"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
              {!pieces.length && <p className={styles.empty}>0こ</p>}
            </div>
            {completed && (
              <section
                className={styles.countingFinish}
                aria-label="かぞえたあとの おはなし"
              >
                <div className={styles.countingWords} role="status">
                  <p>
                    {subtraction ? 'のこりは ' : 'ぜんぶで '}
                    <strong>
                      {subtraction ? orangeCount : pieces.length}
                      <small>こ</small>
                    </strong>
                    だね。
                  </p>
                </div>
                <div className={styles.continueGuide}>
                  <button type="button" onClick={close}>
                    おうちのひとにもどす <span aria-hidden="true">→</span>
                  </button>
                  <p>おうちのひとにスマホをわたしてね</p>
                </div>
              </section>
            )}
          </>
        ) : (
          <div className={styles.largeDiagram}>{diagram}</div>
        )}
      </dialog>
    </>
  )
}
