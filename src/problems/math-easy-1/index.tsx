// 大学祭の数学（易しい）第1問。台本の書き方は src/problems/sample にそろえる
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
import figureWhole from './images/band-1.webp'
import figureDiscount from './images/band-2.webp'
import figurePrice from './images/band-3.webp'
import styles from './math-easy-1.module.css'

const LIST_PRICE = 1200
const DISCOUNT_RATE = 20
const DISCOUNT = (LIST_PRICE * DISCOUNT_RATE) / 100
const SALE_PRICE = LIST_PRICE - DISCOUNT

const QUESTION_TEXT = `定価${LIST_PRICE}円のノートセットが、${DISCOUNT_RATE}％引きで売られています。代金はいくらですか？`

// 子どもに読み上げるセリフ。台本のページと準備画面の「声かけを先に読んでおく」の両方で使う
const words = {
  whole: '20％引きってことは全体を1としたときそこから0.2引くってことは分かる？',
  discount: 'じゃあ全体が1200円の時20％はいくらになるかな？',
  price: 'じゃあ20％引きされたノートはいくらになるかな？',
}

// 台本のページ。左へスワイプで次、右へで前
const pages = ['read', 'whole', 'discount', 'price', 'answer'] as const
type Page = (typeof pages)[number]

// 進み具合は、同じタブの中で保存する（準備の画面へ戻ると、台本の部品は作り直されるため）
const storageKey = (pathname: string) => `math-easy-1-flow:v1:${pathname}`

function readPage(raw: string | null): Page | null {
  try {
    const saved = JSON.parse(raw ?? 'null') as { page?: string } | null
    return pages.find((page) => page === saved?.page) ?? null
  } catch {
    // 古い形式や壊れた保存内容は使わない
    return null
  }
}

// 準備の画面で、続きがあるかを決める。最後のページまで進んだら、終えたものとして扱う
function flowStatus(raw: string | null): FlowStatus {
  const page = readPage(raw)
  if (!page || page === 'read') return 'start'
  return page === 'answer' ? 'finished' : 'middle'
}

// 問題の値札。準備の画面と、台本の最初のページのステージに置く
function PriceTag() {
  return (
    <div
      className={styles.priceTag}
      role="img"
      aria-label={`ノートセット。定価${LIST_PRICE}円、${DISCOUNT_RATE}％引き`}
    >
      <span className={styles.item}>ノートセット</span>
      <strong className={styles.price}>
        定価 <b>{LIST_PRICE}</b>円
      </strong>
      <span className={styles.discount}>{DISCOUNT_RATE}％引き</span>
    </div>
  )
}

function Figure({ src, alt }: { src: string; alt: string }) {
  return <img className={styles.figure} src={src} alt={alt} draggable={false} />
}

// ステージに置く式。お子さんが答えてから「？」を押して、答えを見る
function Equation({
  visible,
  onReveal,
}: {
  visible: boolean
  onReveal: () => void
}) {
  // 「？」を押すとボタンが消えるので、答えの出た式へフォーカスを移す
  const equation = useRef<HTMLParagraphElement>(null)
  const wasVisible = useRef(visible)
  useEffect(() => {
    if (visible && !wasVisible.current)
      equation.current?.focus({ preventScroll: true })
    wasVisible.current = visible
  }, [visible])
  return (
    <>
      <p
        className={`${flowStyles.equation} ${styles.equation}`}
        aria-live="polite"
        ref={equation}
        tabIndex={-1}
      >
        {LIST_PRICE}円 − {DISCOUNT}円 ＝{' '}
        {visible ? (
          <em>{SALE_PRICE}円</em>
        ) : (
          <button
            className={flowStyles.reveal}
            type="button"
            aria-label="答えを見る"
            onClick={onReveal}
          >
            ？
          </button>
        )}
      </p>
      {!visible && (
        <p className={flowStyles.revealHint}>
          お子さんが答えたら、「？」をタップ
        </p>
      )}
    </>
  )
}

function MathEasyFlow() {
  // 最後のページの「終わる」で、準備の画面へ戻る
  const { finish } = useScriptControls()
  const key = storageKey(useLocation().pathname)
  const [page, setPage] = useState<Page>(() => {
    try {
      const saved = readPage(sessionStorage.getItem(key))
      // 最後のページまで終えたあとは、最初から
      if (saved && saved !== 'answer') return saved
    } catch {
      // 読めないときは、最初から
    }
    return 'read'
  })
  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify({ page }))
    } catch {
      // 保存できなくても、この画面で学習を続けられる
    }
  }, [key, page])
  // 「？」で答えを見たか。ページを送ると、見る前に戻す
  const [revealed, setRevealed] = useState(false)
  const index = pages.indexOf(page)
  const go = (next: Page | undefined) => {
    if (!next) return
    setPage(next)
    setRevealed(false)
  }

  const slides: Record<Page, LessonSlide> = {
    read: {
      id: 'read',
      title: '問題を読んでみましょう',
      stage: <PriceTag />,
      content: (
        <>
          <TeachingPoints note="まずは、下の問題をお子さんと**一緒に読みましょう**" />
          <p className={flowStyles.problem}>{QUESTION_TEXT}</p>
        </>
      ),
    },
    whole: {
      id: 'whole',
      title: '20％引きとはどういうことなのか考えましょう',
      stage: (
        <Figure
          src={figureWhole}
          alt="全体の1（100％）を、0.8（80％）と0.2（20％）に分けた帯の図"
        />
      ),
      content: (
        <>
          <SpokenWords>{words.whole}</SpokenWords>
          <TeachingPoints
            folded
            note="20％引きは、全体（1）から0.2の分を引くことだと確かめましょう。分かりづらそうなときは、図を見せて説明してあげましょう。"
          />
        </>
      ),
    },
    discount: {
      id: 'discount',
      title: '20％分はいくらか考えましょう',
      stage: (
        <Figure
          src={figureDiscount}
          alt="1200円（100％）の帯のうち、20％の部分が？円になっている図"
        />
      ),
      content: (
        <>
          <SpokenWords>{words.discount}</SpokenWords>
          <TeachingPoints
            folded
            note="ここで1200×0.2がすんなり出てこない場合は、慌てず1つ前に戻りましょう"
          />
        </>
      ),
    },
    price: {
      id: 'price',
      title: '代金を求めましょう',
      stage: (
        <Figure
          src={figurePrice}
          alt="1200円（100％）の帯のうち、20％の部分が240円、80％の部分が？円になっている図"
        />
      ),
      content: (
        <>
          <SpokenWords>{words.price}</SpokenWords>
          <TeachingPoints
            folded
            note="全体から割引分を引く計算の仕方を確認しましょう"
          />
        </>
      ),
    },
    // 最後のページ：答えは先に言わず、お子さんが答えてから「？」で見る。見たら「終わる」で準備の画面へ戻る
    answer: {
      id: 'answer',
      title: '答えを確認しましょう！',
      stage: <Equation visible={revealed} onReveal={() => setRevealed(true)} />,
      content: revealed && (
        <button className={flowStyles.finish} type="button" onClick={finish}>
          終わる
        </button>
      ),
    },
  }

  return (
    <LessonSlides
      label="数学 易しい 第1問の台本"
      slides={pages.map((page) => slides[page])}
      currentId={page}
      totalKnown
      canNext={page !== 'answer'}
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
      // 準備の画面のステージに大きく出す値札
      picture={<PriceTag />}
      prepare={{
        goal: '20％引きの意味を考えて、ノートセットの代金を求めます。',
        materials: ['紙と鉛筆'],
        point: '値引き額を求めて、定価から引きます。',
        avoid: ['最初に答えを言うこと', '値引き額と支払う代金を混同すること'],
      }}
      // 「声かけを先に読んでおく」に出す。台本のページと同じ words を使う
      question={{ say: QUESTION_TEXT }}
      turns={[
        { say: words.whole },
        { say: words.discount },
        { say: words.price },
      ]}
    />
  )
}
