import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import styles from './TeachingScript.module.css'
import flowStyles from './AdditionFlow.module.css'
import { Oyajii } from './Oyajii'

export interface LessonSlide {
  id: string
  title: string
  // 台本の区切り（たしかめ など）。書いたページだけ、見出しの上に小さく出す
  section?: string
  // ページの上のステージに置く「見るもの」（図・問題・式など）。なければキャラクターを置く
  stage?: ReactNode
  content: ReactNode
  // 答えを見る前のページだけに渡す、答えを出す処理（ステージの「？」と同じもの）。
  // あると、「次」の行の代わりに「答えを見る」ボタンを置き、ページに来たときと、
  // 左へめくろうとしたときに、押して答えを見ることを吹き出しで知らせる（ほかのページはスワイプで進むため）
  onReveal?: () => void
}

// 押して答えを見ることを知らせるとき、押す場所（「？」と「答えを見る」）を小さく揺らす
const SHAKE: Keyframe[] = [
  { transform: 'translateX(0)' },
  { transform: 'translateX(-6px)' },
  { transform: 'translateX(6px)' },
  { transform: 'translateX(-4px)' },
  { transform: 'translateX(0)' },
]

// 答えを見る「？」の下に置く札。押して答えを見ることを示す
export function RevealHint({ className = '' }: { className?: string }) {
  return (
    <p className={`${flowStyles.revealHint} ${className}`}>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
        <circle cx="12" cy="12" r="8" />
      </svg>
      押して答えを見る
    </p>
  )
}

// 足し算の分岐でも、既存のスライドと同じ見た目・操作を使う。
// 前へ・次へのボタンは置かず、左右のスワイプ（キーボードでは ← →）だけで送る。
// 答えを見る前のページ（onReveal）だけは、押して答えを出してから送る
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
  // 吹き出しを出しているページ。3.5秒で消す
  const [pointed, setPointed] = useState<string | null>(null)
  const pointTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const point = useCallback((id: string) => {
    setPointed(id)
    clearTimeout(pointTimer.current)
    pointTimer.current = setTimeout(() => setPointed(null), 3500)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    track.current
      ?.querySelectorAll<HTMLElement>(
        `:scope > [data-active="true"] :is(.${flowStyles.reveal}, .${flowStyles.revealAction})`,
      )
      .forEach((element) => element.animate(SHAKE, { duration: 360 }))
  }, [])
  useEffect(() => () => clearTimeout(pointTimer.current), [])
  // 答えを見る前のページに来たら、ここは押して答えを見ることを知らせる
  const revealing = slides[index]?.onReveal !== undefined
  useEffect(() => {
    if (!revealing) return
    const timer = setTimeout(() => point(currentId), 350)
    return () => clearTimeout(timer)
  }, [currentId, revealing, point])
  // 送れない向きにめくったとき。答えを見る前のページなら、もう一度知らせる
  const blocked = () => {
    if (revealing) point(currentId)
  }
  const sliding = useRef(false)
  // 横にスワイプした直後（0.4秒以内）のクリックは、ボタンに届けない（送ると同時に方法を選ばないように）
  const swipedAt = useRef(0)
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  // 横に送っている間の、台本の枠の高さ。隣のページは今のページに重ねて置いている（AdditionFlow.module.css）ので、
  // 枠が今のページの高さのままだと、長い隣のページは下が切れて見え、送り終えた瞬間に伸びる。
  // 送っている間だけ、前後のページの高い方まで枠を広げておく
  const [reach, setReach] = useState<number | null>(null)
  const measureReach = () => {
    const pages = [...(track.current?.children ?? [])].slice(
      Math.max(0, index - 1),
      index + 2,
    )
    setReach(
      Math.max(...pages.map((page) => page.getBoundingClientRect().height)),
    )
  }
  const swipeArea = useRef<HTMLDivElement>(null)
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
    const element = swipeArea.current
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
  // 今のページで、まだ送れない（方法を選ぶ前など）ときは、ページの下の「次」の行を隠しておく
  const waiting = (i: number) => i === index && !canNext

  const navigate = async (direction: -1 | 1) => {
    if (sliding.current || !(direction === 1 ? canNext : canBack)) {
      setDragX(0)
      if (direction === 1 && !canNext) blocked()
      return
    }
    const element = track.current
    if (!element) return
    sliding.current = true
    // ← → で送るときは、ドラッグを通らないので、ここで枠を広げる
    flushSync(measureReach)
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
        setReach(null)
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
    else {
      if (!sliding.current) setDragX(0)
      if (dx < 0 && !canNext) blocked()
    }
  }

  return (
    // スワイプは、台本の枠の中だけでなく、画面の左右の余白・進み具合・「次」の行・その下の空きからも受ける。
    // 親指は画面の端や下のほうから動かし始めることが多いため
    <div
      className={styles.swipeArea}
      ref={swipeArea}
      onPointerDown={(event) => {
        if (!event.isPrimary || event.button !== 0 || sliding.current) return
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
            measureReach()
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
        // 指で触れると、ブラウザは触れた部品に指を割り当てる。スワイプの領域が指を捕まえ直すと、
        // その部品から「指を失った」が伝わってくるので、スワイプの領域自身のものだけを見る
        if (event.target !== event.currentTarget) return
        gesture.current = null
        setDragging(false)
        if (!sliding.current) setDragX(0)
      }}
    >
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
        >
          <div
            className={styles.dragTrack}
            ref={track}
            data-dragging={dragging}
            style={{
              transform: `translateX(${dragX}px)`,
              minHeight: reach ?? undefined,
            }}
            // 送らずに元の位置へ戻り終えたら、枠を今のページの高さに戻す
            onTransitionEnd={(event) => {
              if (event.target === event.currentTarget && !sliding.current)
                setReach(null)
            }}
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
                {/* ステージ：お子さんと一緒に見るもの */}
                <div className={flowStyles.stage}>
                  {slide.onReveal && (
                    // 見て分かるための吹き出し。同じことは「答えを見る」ボタンが伝えるので、読み上げない
                    <p
                      className={flowStyles.revealBubble}
                      data-show={i === index && pointed === slide.id}
                      aria-hidden="true"
                    >
                      <b>ここは、押して答えを見ます</b>
                      お子さんが答えたら「？」を押します
                    </p>
                  )}
                  {slide.stage ?? <Oyajii className={flowStyles.stageMascot} />}
                </div>
                <h2 className={flowStyles.title} tabIndex={-1}>
                  {slide.section && (
                    <span className={flowStyles.section}>{slide.section}</span>
                  )}
                  {slide.title}
                </h2>
                {slide.content}
                {slide.onReveal ? (
                  <RevealAction onReveal={slide.onReveal} />
                ) : (
                  <NextPage slide={slides[i + 1]} hidden={waiting(i)} />
                )}
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// 答えを見る前のページで、「次」の行の代わりに置くボタン。いつも「次」の行を見ている場所で、押して答えを見る。
// 教え方のポイントを開いたまま下まで読んでいても、ここで押せる。押したら、答えの出たステージを見えるところへ出す
function RevealAction({ onReveal }: { onReveal: () => void }) {
  const button = useRef<HTMLButtonElement>(null)
  return (
    <>
      <button
        className={flowStyles.revealAction}
        type="button"
        ref={button}
        onClick={() => {
          const stage = button.current
            ?.closest('section')
            ?.querySelector(`.${flowStyles.stage}`)
          onReveal()
          stage?.scrollIntoView?.({ block: 'nearest' })
        }}
      >
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
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        答えを見る
      </button>
      <p className={flowStyles.revealActionNote}>
        お子さんが答えたら押してください
      </p>
    </>
  )
}

// ページの下の「次」の行。ボタンではなく、左へスワイプした先を示す案内。
// ページの中に置いて、スワイプしている間もページといっしょに動かす。
// 送れないときも場所は空けておき、送れるようになったら浮かび上がらせる（ページの高さを変えない）
function NextPage({ slide, hidden }: { slide?: LessonSlide; hidden: boolean }) {
  if (!slide) return null
  return (
    <p className={flowStyles.next} data-hidden={hidden}>
      <span>
        次<b>{slide.title}</b>
      </span>
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
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </p>
  )
}
