import { useEffect, useRef, useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import styles from './TeachingScript.module.css'
import flowStyles from './AdditionFlow.module.css'

export interface LessonSlide {
  id: string
  title: string
  content: ReactNode
}

// 足し算の分岐でも、既存のスライドと同じ見た目・操作を使う。
export function LessonSlides({
  label,
  slides,
  currentId,
  totalKnown,
  nextLabel,
  canNext,
  onNext,
  onBack,
}: {
  // 読み上げで伝える、台本の名前（例: 足し算の台本）
  label: string
  slides: LessonSlide[]
  currentId: string
  totalKnown: boolean
  nextLabel?: string
  canNext: boolean
  onNext: () => void
  onBack: () => void
}) {
  const index = slides.findIndex((slide) => slide.id === currentId)
  const canBack = index > 0
  const track = useRef<HTMLDivElement>(null)
  const previousId = useRef(currentId)
  useEffect(() => {
    if (previousId.current === currentId) return
    previousId.current = currentId
    track.current
      ?.querySelector<HTMLElement>('[data-active="true"] h2')
      ?.focus({ preventScroll: true })
  }, [currentId])
  const sliding = useRef(false)
  const [moving, setMoving] = useState(false)
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const gesture = useRef<{
    id: number
    x: number
    y: number
    width: number
    axis: 'x' | 'y' | null
  } | null>(null)
  const pageLabel = totalKnown
    ? `${index + 1} / ${slides.length}ページ`
    : `${index + 1}ページ`

  const navigate = async (direction: -1 | 1) => {
    if (sliding.current || !(direction === 1 ? canNext : canBack)) {
      setDragX(0)
      return
    }
    const element = track.current
    if (!element) return
    sliding.current = true
    setMoving(true)
    const width = element.getBoundingClientRect().width + 12
    const animation = element.animate(
      [
        { transform: getComputedStyle(element).transform },
        { transform: `translateX(${-direction * width}px)` },
      ],
      {
        duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 0
          : 300,
        easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
        fill: 'forwards',
      },
    )
    try {
      await animation.finished
      flushSync(() => {
        setDragX(0)
        if (direction === 1) onNext()
        else onBack()
      })
    } finally {
      animation.cancel()
      sliding.current = false
      setMoving(false)
    }
  }

  return (
    <>
      <div
        className={styles.pageDots}
        role="img"
        aria-label={`台本の進み具合 ${pageLabel}`}
      >
        {slides.map((slide, i) => (
          <span
            key={slide.id}
            aria-hidden="true"
            data-current={i === index}
            data-done={i < index}
          />
        ))}
      </div>
      <p className={flowStyles.pageCount} aria-live="polite">
        {pageLabel}
      </p>
      <div className={styles.carouselFrame}>
        <div
          className={styles.carousel}
          role="region"
          aria-roledescription="カルーセル"
          aria-label={label}
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.target !== event.currentTarget) return
            if (event.key === 'ArrowLeft') {
              event.preventDefault()
              void navigate(-1)
            } else if (event.key === 'ArrowRight') {
              event.preventDefault()
              void navigate(1)
            }
          }}
          onPointerDown={(event) => {
            if (!event.isPrimary || event.button !== 0 || sliding.current)
              return
            if (
              (event.target as Element).closest(
                'button, a, input, select, textarea, summary, [role="button"]',
              )
            )
              return
            gesture.current = {
              id: event.pointerId,
              x: event.clientX,
              y: event.clientY,
              width: (track.current?.getBoundingClientRect().width ?? 320) + 12,
              axis: null,
            }
            event.currentTarget.setPointerCapture(event.pointerId)
          }}
          onPointerMove={(event) => {
            const start = gesture.current
            if (!start || start.id !== event.pointerId) return
            const dx = event.clientX - start.x
            const dy = event.clientY - start.y
            if (start.axis === null) {
              if (Math.max(Math.abs(dx), Math.abs(dy)) < 8) return
              start.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
              if (start.axis === 'x') setDragging(true)
            }
            if (start.axis !== 'x') return
            const distance = Math.max(-start.width, Math.min(start.width, dx))
            setDragX((dx < 0 ? canNext : canBack) ? distance : distance * 0.12)
          }}
          onPointerUp={(event) => {
            const start = gesture.current
            if (!start || start.id !== event.pointerId) return
            gesture.current = null
            const dx = event.clientX - start.x
            if (
              start.axis === 'x' &&
              Math.abs(dx) >= Math.min(55, start.width * 0.2)
            )
              void navigate(dx < 0 ? 1 : -1)
            else setDragX(0)
            setDragging(false)
          }}
          onPointerCancel={() => {
            gesture.current = null
            setDragging(false)
            if (!sliding.current) setDragX(0)
          }}
          onLostPointerCapture={() => {
            gesture.current = null
            setDragging(false)
            if (!sliding.current) setDragX(0)
          }}
        >
          <div
            className={styles.dragTrack}
            ref={track}
            data-dragging={dragging}
            style={{ transform: `translateX(${dragX}px)` }}
          >
            {slides.map((slide, i) => (
              <section
                className={`${styles.panel} ${flowStyles.slide}`}
                key={slide.id}
                data-slide={slide.id}
                data-active={i === index}
                role="group"
                aria-roledescription="スライド"
                aria-label={slide.title}
                aria-hidden={i !== index}
                inert={i !== index}
                style={{
                  transform: `translateX(calc(${(i - index) * 100}% + ${(i - index) * 12}px))`,
                }}
              >
                <h2 className={flowStyles.title} tabIndex={-1}>
                  {slide.title}
                </h2>
                {slide.content}
              </section>
            ))}
          </div>
        </div>
        <div
          className={styles.pagination}
          role="group"
          aria-label={`台本 ${pageLabel}`}
        >
          {([-1, 1] as const).map((direction) => (
            <button
              key={direction}
              className={styles.pageButton}
              type="button"
              aria-label={direction === -1 ? '前のページ' : '次のページ'}
              disabled={moving || !(direction === -1 ? canBack : canNext)}
              onClick={() => void navigate(direction)}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d={direction === -1 ? 'm15 5-7 7 7 7' : 'm9 5 7 7-7 7'}
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ))}
        </div>
      </div>
      <div className={flowStyles.navigation}>
        <button
          type="button"
          disabled={!canBack || moving}
          onClick={() => void navigate(-1)}
        >
          戻る
        </button>
        {nextLabel && (
          <button
            className={flowStyles.primary}
            type="button"
            disabled={!canNext || moving}
            onClick={() => void navigate(1)}
          >
            {nextLabel}
          </button>
        )}
      </div>
    </>
  )
}
