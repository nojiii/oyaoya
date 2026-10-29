import { useEffect, useRef, useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import styles from './TeachingScript.module.css'
import flowStyles from './AdditionFlow.module.css'

export interface LessonSlide {
  id: string
  title: string
  // ページの上のステージに置く「見るもの」（図・問題・式など）。なければキャラクターを置く
  stage?: ReactNode
  content: ReactNode
}

// 足し算の分岐でも、既存のスライドと同じ見た目・操作を使う。
// 前へ・次へのボタンは置かず、左右のスワイプ（キーボードでは ← →）だけで送る
export function LessonSlides({
  label,
  slides,
  currentId,
  totalKnown,
  canNext,
  onNext,
  onBack,
}: {
  // 読み上げで伝える、台本の名前（例: 足し算の台本）
  label: string
  slides: LessonSlide[]
  currentId: string
  totalKnown: boolean
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
    // ページの見出しへフォーカスを移す。ステージの中（閉じたダイアログなど）の見出しは選ばない
    track.current
      ?.querySelector<HTMLElement>('[data-active="true"] > h2')
      ?.focus({ preventScroll: true })
  }, [currentId])
  const sliding = useRef(false)
  // 横にスワイプした直後（0.4秒以内）のクリックは、ボタンに届けない（送ると同時に方法を選ばないように）
  const swipedAt = useRef(0)
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const carousel = useRef<HTMLDivElement>(null)
  const gesture = useRef<{
    id: number
    x: number
    y: number
    width: number
    axis: 'x' | 'y' | null
    // 最後に動いた横の量と、はじく速さを測るための最近の位置
    dx: number
    samples: { x: number; t: number }[]
  } | null>(null)
  // 横に送っていると決まったら、ブラウザに縦のスクロールを始めさせない。
  // 始めると指の操作が取り消され、ドラッグの途中でページが元に戻ってしまう
  useEffect(() => {
    const element = carousel.current
    if (!element) return
    const onTouchMove = (event: TouchEvent) => {
      if (gesture.current?.axis === 'x' && event.cancelable)
        event.preventDefault()
    }
    element.addEventListener('touchmove', onTouchMove, { passive: false })
    return () => element.removeEventListener('touchmove', onTouchMove)
  }, [])
  const pageLabel = totalKnown
    ? `${index + 1} / ${slides.length}ページ`
    : `${index + 1}ページ`
  // 次のページの名前。送れるときだけ、ページの下に送る向きと行き先として出す
  const following = canNext ? slides[index + 1] : undefined

  const navigate = async (direction: -1 | 1) => {
    if (sliding.current || !(direction === 1 ? canNext : canBack)) {
      setDragX(0)
      return
    }
    const element = track.current
    if (!element) return
    sliding.current = true
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
    }
  }

  // 指を離したとき：一定の距離を動かしたか、短くても素早くはじいたら送る。それ以外は元に戻す
  const release = (x: number, t: number) => {
    const start = gesture.current
    gesture.current = null
    setDragging(false)
    if (!start || start.axis !== 'x') {
      if (!sliding.current) setDragX(0)
      return
    }
    swipedAt.current = t
    const dx = x - start.x
    // はじく速さは、離す直前 0.1 秒の動きで測る。動きを止めてから離したときは、はじいたとみなさない
    const last = start.samples[start.samples.length - 1]
    const recent = start.samples.find((sample) => t - sample.t <= 100)
    const speed =
      recent && t - last.t <= 60 && last.t > recent.t
        ? (last.x - recent.x) / (last.t - recent.t)
        : 0
    const far = Math.abs(dx) >= Math.min(55, start.width * 0.2)
    const flick = Math.abs(dx) >= 20 && Math.abs(speed) >= 0.3 && speed * dx > 0
    if (far || flick) void navigate(dx < 0 ? 1 : -1)
    else if (!sliding.current) setDragX(0)
  }

  return (
    <>
      <div
        className={styles.pageDots}
        role="img"
        aria-label={`台本の進み具合 ${pageLabel}`}
      >
        {slides.map((slide, i) => (
          <span key={slide.id} aria-hidden="true" data-done={i <= index} />
        ))}
      </div>
      <p className={styles.srOnly} aria-live="polite">
        {pageLabel}
      </p>
      <div className={styles.carouselFrame}>
        <div
          className={styles.carousel}
          ref={carousel}
          role="region"
          aria-roledescription="カルーセル"
          aria-label={label}
          tabIndex={0}
          onKeyDown={(event) => {
            // ページを送ると見出しにフォーカスが移るので、台本の中のどこからでも ← → で送る。
            // 文字を入れる欄の上では、カーソルの移動を優先する
            if ((event.target as Element).closest('input, select, textarea'))
              return
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
            // 文字を入れる欄とリンクの上からは送らない。ボタンの上からは、横に動いたときだけ送る
            if ((event.target as Element).closest('a, input, select, textarea'))
              return
            gesture.current = {
              id: event.pointerId,
              x: event.clientX,
              y: event.clientY,
              width: (track.current?.getBoundingClientRect().width ?? 320) + 12,
              axis: null,
              dx: 0,
              samples: [{ x: event.clientX, t: event.timeStamp }],
            }
          }}
          onPointerMove={(event) => {
            const start = gesture.current
            if (!start || start.id !== event.pointerId) return
            // マウスのボタンを離したことが届かなかった（台本の外で離した）ときは、スワイプをやめる
            if (event.pointerType === 'mouse' && event.buttons === 0) {
              gesture.current = null
              setDragging(false)
              setDragX(0)
              return
            }
            const dx = event.clientX - start.x
            const dy = event.clientY - start.y
            if (start.axis === null) {
              if (Math.max(Math.abs(dx), Math.abs(dy)) < 6) return
              // 親指は弧を描くので、横よりやや縦に動いても（約50°まで）横のスワイプとみなす
              start.axis = Math.abs(dx) * 1.2 >= Math.abs(dy) ? 'x' : 'y'
              // 横に動いたと分かってから指を捕まえる。ただのタップは、そのままボタンに届く
              if (start.axis === 'x') {
                event.currentTarget.setPointerCapture(event.pointerId)
                setDragging(true)
              }
            }
            if (start.axis !== 'x') return
            start.dx = dx
            start.samples = [
              ...start.samples.filter(
                (sample) => event.timeStamp - sample.t <= 100,
              ),
              { x: event.clientX, t: event.timeStamp },
            ]
            const distance = Math.max(-start.width, Math.min(start.width, dx))
            setDragX((dx < 0 ? canNext : canBack) ? distance : distance * 0.12)
          }}
          onPointerUp={(event) => {
            if (gesture.current?.id !== event.pointerId) return
            release(event.clientX, event.timeStamp)
          }}
          onClickCapture={(event) => {
            if (event.timeStamp - swipedAt.current > 400) return
            event.preventDefault()
            event.stopPropagation()
          }}
          onPointerCancel={(event) => {
            // ブラウザに指の操作を取り消されても、それまでに横へ動かした分で判断する
            const start = gesture.current
            if (start?.id !== event.pointerId) return
            release(start.x + start.dx, event.timeStamp)
          }}
          onLostPointerCapture={(event) => {
            // 指で触れると、ブラウザは触れた部品に指を割り当てる。台本の領域が指を捕まえ直すと、
            // その部品から「指を失った」が伝わってくるので、台本の領域自身のものだけを見る
            if (event.target !== event.currentTarget) return
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
                {/* ステージ：お子さんと一緒に見るもの。キャラクターは将来 Rive の <canvas> に替える */}
                <div className={flowStyles.stage}>
                  {slide.stage ?? (
                    <img
                      className={flowStyles.stageMascot}
                      src="/mascot.png"
                      alt=""
                      draggable={false}
                    />
                  )}
                </div>
                <h2 className={flowStyles.title} tabIndex={-1}>
                  {slide.title}
                </h2>
                {slide.content}
              </section>
            ))}
          </div>
        </div>
      </div>
      {following && (
        <p className={flowStyles.next}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 12H5M11 6l-6 6 6 6" />
          </svg>
          <span>
            次<b>{following.title}</b>
          </span>
        </p>
      )}
    </>
  )
}
