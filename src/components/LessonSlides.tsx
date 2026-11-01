import { useEffect, useRef, useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import styles from './TeachingScript.module.css'
import flowStyles from './AdditionFlow.module.css'
import { Oyajii } from './Oyajii'
import { ScriptGuideSlide } from './ScriptGuide'
import { GUIDE_TITLE, useScriptGuide } from './scriptGuideState'
import { NextPageButton, PageEdges } from './ScriptPaging'

export interface LessonSlide {
  id: string
  title: string
  // 台本の区切り（たしかめ など）。書いたページだけ、見出しの上に小さく出す
  section?: string
  // ページの上のステージに置く「見るもの」（図・問題・式など）。なければキャラクターを置く
  stage?: ReactNode
  content: ReactNode
}

// 使い方のページ（ScriptGuide）を、台本の最初のページの前に置くときの id
const GUIDE_ID = 'scriptGuide'

const reducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

// 足し算の分岐でも、既存のスライドと同じ見た目・操作を使う。
// 左右のスワイプ（キーボードでは ← →）で送る。左右の端の矢印と、ページの下の「次」のボタンを押しても送れる。
// 初めて台本を開いたときは、最初のページの前に使い方のページを置く
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
  // 使い方のページ。台本を最初のページから始めるときだけ、最初のページの前に置く
  const guide = useScriptGuide(true, index === 0)
  // 並べるページ（使い方のページを置くときは、その分だけ後ろへずれる）と、今のページの位置
  const pages: LessonSlide[] = guide.present
    ? [{ id: GUIDE_ID, title: GUIDE_TITLE, content: null }, ...slides]
    : slides
  const position = guide.showing ? 0 : index + (guide.present ? 1 : 0)
  // 最後のページの先へは送らない（送ろうとすると、ページが動いてから戻ってしまう）
  const canForward = guide.showing || (canNext && position < pages.length - 1)
  const canBack = position > 0
  const track = useRef<HTMLDivElement>(null)
  const activeId = pages[position]?.id ?? currentId
  const previousId = useRef(activeId)
  useEffect(() => {
    if (previousId.current === activeId) return
    previousId.current = activeId
    // ページの見出しへフォーカスを移す。ステージの中（閉じたダイアログなど）の見出しは選ばない
    track.current
      ?.querySelector<HTMLElement>('[data-active="true"] > h2')
      ?.focus({ preventScroll: true })
  }, [activeId])
  const sliding = useRef(false)
  // 横にスワイプした直後（0.4秒以内）のクリックは、ボタンに届けない（送ると同時に方法を選ばないように）
  const swipedAt = useRef(0)
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  // ページを送る動きの間（指を離してから、送り終えるまで）
  const [navigating, setNavigating] = useState(false)
  // 横に送っている間の、台本の枠の高さ。隣のページは今のページに重ねて置いている（AdditionFlow.module.css）ので、
  // 枠が今のページの高さのままだと、長い隣のページは下が切れて見え、送り終えた瞬間に伸びる。
  // 送っている間だけ、前後のページの高い方まで枠を広げておく
  const [reach, setReach] = useState<number | null>(null)
  const measureReach = () => {
    const near = [...(track.current?.children ?? [])].slice(
      Math.max(0, position - 1),
      position + 2,
    )
    setReach(
      Math.max(...near.map((page) => page.getBoundingClientRect().height)),
    )
  }
  // 送らずに元の位置へ戻す。戻る動きがないとき（動きを減らす設定、または動かしていない）は、
  // 動き終わりの合図（transitionend）が来ないので、枠の高さもここで戻す
  const settle = () => {
    setDragX(0)
    if (dragX === 0 || reducedMotion()) setReach(null)
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
  // 使い方のページは、台本のページの数に入れない
  const pageLabel = guide.showing
    ? GUIDE_TITLE
    : totalKnown
      ? `${index + 1} / ${slides.length}ページ`
      : `${index + 1}ページ`
  // 今のページで、まだ送れない（方法を選ぶ前など）ときは、ページの下の「次」のボタンを隠しておく
  const waiting = (i: number) => i === position && !canForward

  const navigate = async (direction: -1 | 1) => {
    if (sliding.current) {
      setDragX(0)
      return
    }
    if (!(direction === 1 ? canForward : canBack)) {
      settle()
      return
    }
    const element = track.current
    if (!element) return
    sliding.current = true
    // ← → で送るときは、ドラッグを通らないので、ここで枠を広げる
    flushSync(() => {
      measureReach()
      setNavigating(true)
    })
    const width = element.getBoundingClientRect().width + 12
    const animation = element.animate(
      [
        { transform: getComputedStyle(element).transform },
        { transform: `translateX(${-direction * width}px)` },
      ],
      {
        duration: reducedMotion() ? 0 : 300,
        easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
        fill: 'forwards',
      },
    )
    try {
      await animation.finished
      flushSync(() => {
        setDragX(0)
        setReach(null)
        // 使い方のページと台本の最初のページの間は、台本の進み具合を変えずに行き来する
        if (direction === 1) {
          if (guide.showing) guide.pass()
          else onNext()
        } else if (guide.present && index === 0) guide.revisit()
        else onBack()
      })
    } finally {
      animation.cancel()
      sliding.current = false
      setNavigating(false)
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
    else if (!sliding.current) settle()
  }

  return (
    // スワイプは、台本の枠の中だけでなく、画面の左右の余白・進み具合・「次」のボタン・その下の空きからも受ける。
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
          if (!sliding.current) settle()
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
        setDragX((dx < 0 ? canForward : canBack) ? distance : distance * 0.12)
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
        if (!sliding.current) settle()
      }}
    >
      <div
        className={styles.pageDots}
        role="img"
        aria-label={`台本の進み具合 ${pageLabel}`}
      >
        {guide.present && <span aria-hidden="true" data-guide data-done />}
        {slides.map((slide, i) => (
          <span
            key={slide.id}
            aria-hidden="true"
            data-done={!guide.showing && i <= index}
          />
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
            // 指で動かしている間と、送っている間は、となりのページを薄くしない
            data-moving={dragging || navigating}
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
            {pages.map((slide, i) => (
              <section
                className={`${styles.panel} ${flowStyles.slide}`}
                key={slide.id}
                data-slide={slide.id}
                data-active={i === position}
                role="group"
                aria-roledescription="スライド"
                aria-label={slide.title}
                aria-hidden={i !== position}
                inert={i !== position}
                style={{
                  transform: `translateX(calc(${(i - position) * 100}% + ${(i - position) * 12}px))`,
                }}
              >
                {slide.id === GUIDE_ID ? (
                  <ScriptGuideSlide onStart={() => void navigate(1)} />
                ) : (
                  <>
                    {/* ステージ：お子さんと一緒に見るもの */}
                    <div className={flowStyles.stage}>
                      {slide.stage ?? (
                        <Oyajii className={flowStyles.stageMascot} />
                      )}
                    </div>
                    <h2 className={flowStyles.title} tabIndex={-1}>
                      {slide.section && (
                        <span className={flowStyles.section}>
                          {slide.section}
                        </span>
                      )}
                      {slide.title}
                    </h2>
                    {slide.content}
                    {pages[i + 1] && (
                      <NextPageButton
                        label={pages[i + 1].title}
                        hidden={waiting(i)}
                        onClick={() => void navigate(1)}
                      />
                    )}
                  </>
                )}
              </section>
            ))}
          </div>
        </div>
        <PageEdges
          canBack={canBack}
          canNext={canForward}
          onBack={() => void navigate(-1)}
          onNext={() => void navigate(1)}
        />
      </div>
    </div>
  )
}
