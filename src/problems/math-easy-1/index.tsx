import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import {
  TeachingScript,
  type FlowStatus,
} from '../../components/TeachingScript'
import { LessonSlides, type LessonSlide } from '../../components/LessonSlides'
import { SpokenWords } from '../../components/SpokenWords'
import { TeachingPoints } from '../../components/TeachingPoints'
import { useScriptControls } from '../../components/scriptControls'
import flowStyles from '../../components/AdditionFlow.module.css'
import styles from './math-easy-1.module.css'
import bandImage from './images/band-1.webp'
import answerImage from './images/band-2.webp'
import explanationImage from './images/band-3.webp'

const LIST_PRICE = 1200
const DISCOUNT_RATE = 20
const DISCOUNT = (LIST_PRICE * DISCOUNT_RATE) / 100
const SALE_PRICE = LIST_PRICE - DISCOUNT
const pages = ['read', 'discount', 'answer', 'explain', 'check'] as const
type Page = (typeof pages)[number]

const words = {
  read: '定価1200円のノートセットが、20％引きで売られています。代金はいくらですか？',
  discount:
    '20%引きってことは全体を1としたときそこから0.2引くってことは分かる？',
  ask: 'じゃあ全体が1200円の時20％はいくらになるかな？',
  right: `1200円の20％は${DISCOUNT}円です。1200円から${DISCOUNT}円を引くと、代金は${SALE_PRICE}円です。`,
  explain: 'じゃあ20%引きされたノートはいくらになるかな？',
  check: '答えを確認しましょう！',
}

const storageKey = (pathname: string) => `math-easy-1-flow:v2:${pathname}`

function readPage(raw: string | null): Page | null {
  try {
    const saved = JSON.parse(raw ?? 'null') as { page?: string } | null
    return pages.find((page) => page === saved?.page) ?? null
  } catch {
    return null
  }
}

function flowStatus(raw: string | null): FlowStatus {
  const page = readPage(raw)
  if (!page || page === 'read') return 'start'
  return page === 'check' ? 'finished' : 'middle'
}

function PriceCard({ discounted = false }: { discounted?: boolean }) {
  return (
    <div
      className={styles.priceCard}
      role="img"
      aria-label="ノートセットの価格"
    >
      <span className={styles.notebook}>ノートセット</span>
      <strong>{discounted ? SALE_PRICE : LIST_PRICE}円</strong>
      {discounted && <small>{DISCOUNT_RATE}％引き</small>}
    </div>
  )
}

function BandImage({
  src = bandImage,
  alt = '20％引きのノートセットを表した図',
}: {
  src?: string
  alt?: string
}) {
  return <img className={styles.figure} src={src} alt={alt} draggable={false} />
}

function Equation({
  visible,
  onReveal,
}: {
  visible: boolean
  onReveal: () => void
}) {
  const equation = useRef<HTMLParagraphElement>(null)
  const wasVisible = useRef(visible)

  useEffect(() => {
    if (visible && !wasVisible.current)
      equation.current?.focus({ preventScroll: true })
    wasVisible.current = visible
  }, [visible])

  return (
    <div className={styles.equationGroup}>
      <p
        className={`${flowStyles.equation} ${styles.equation}`}
        ref={equation}
        tabIndex={-1}
        aria-live="polite"
      >
        {LIST_PRICE}円 − {DISCOUNT}円 ={' '}
        {visible ? (
          <em>{SALE_PRICE}円</em>
        ) : (
          <button
            className={flowStyles.reveal}
            type="button"
            onClick={onReveal}
          >
            ？
          </button>
        )}
      </p>
      <p className={styles.hiddenHint}>お子さんが答えたら、「？」をタップ</p>
    </div>
  )
}

function MathEasyFlow() {
  const { finish } = useScriptControls()
  const key = storageKey(useLocation().pathname)
  const [page, setPage] = useState<Page>(
    () => readPage(sessionStorage.getItem(key)) ?? 'read',
  )
  const [revealed, setRevealed] = useState(false)
  const index = pages.indexOf(page)

  useEffect(() => {
    sessionStorage.setItem(key, JSON.stringify({ page }))
  }, [key, page])

  const go = (next: Page | undefined) => {
    if (!next) return
    setPage(next)
    setRevealed(false)
  }

  const slides: Record<Page, LessonSlide> = {
    read: {
      id: 'read',
      title: '問題を読んでみましょう',
      stage: <PriceCard />,
      content: <p className={flowStyles.problem}>{words.read}</p>,
    },
    discount: {
      id: 'discount',
      title: '20%引きとはどういうことなのか考えましょう',
      stage: <BandImage />,
      content: (
        <>
          <SpokenWords>{words.discount}</SpokenWords>
          <TeachingPoints
            folded
            note="20%引きは、なぜ 1 - 0.2 で計算できるのかを教えましょう。分かりずらそうなときは図形を見せて説明してあげましょう。"
          />
        </>
      ),
    },
    answer: {
      id: 'answer',
      title: '代金を確認しましょう',
      stage: <BandImage src={answerImage} alt="20％引きの代金を表した図" />,
      content: (
        <>
          <SpokenWords>{words.ask}</SpokenWords>
          <TeachingPoints
            folded
            note="ここで1200×0.2がすんなり出てこない場合は慌てず1つ前に戻りましょう"
          />
        </>
      ),
    },
    explain: {
      id: 'explain',
      section: 'たしかめ',
      title: 'どうしてその答えになったかな？',
      stage: (
        <BandImage src={explanationImage} alt="20％引きの計算方法を表した図" />
      ),
      content: (
        <>
          <SpokenWords>{words.explain}</SpokenWords>
          <TeachingPoints
            folded
            note="全体から割引分を引く計算の仕方を確認しましょう"
          />
        </>
      ),
    },
    check: {
      id: 'check',
      title: '',
      stage: <Equation visible={revealed} onReveal={() => setRevealed(true)} />,
      content: (
        <>
          <p className={flowStyles.problem}>{words.check}</p>
          {revealed && (
            <button
              className={flowStyles.finish}
              type="button"
              onClick={finish}
            >
              終わる
            </button>
          )}
        </>
      ),
    },
  }

  return (
    <LessonSlides
      label="数学 易しい 第1問"
      slides={pages.map((page) => slides[page])}
      currentId={page}
      totalKnown
      canNext
      onNext={() => go(pages[index + 1])}
      onBack={() => go(pages[index - 1])}
    />
  )
}

export default function MathEasy1() {
  const location = useLocation()
  return (
    <TeachingScript
      flow={<MathEasyFlow />}
      flowStatus={() =>
        flowStatus(sessionStorage.getItem(storageKey(location.pathname)))
      }
      picture={<PriceCard />}
      prepare={{
        goal: words.read,
        materials: ['ノートセットの絵', '電卓'],
        point: '値引き額を求めて、定価から引きます。',
        avoid: ['最初に答えを言うこと', '値引き額と支払う代金を混同すること'],
      }}
      question={{ say: words.read }}
      turns={[
        { say: words.discount },
        { say: words.ask },
        { say: words.right },
        { say: words.explain },
        { say: words.check },
      ]}
    />
  )
}
