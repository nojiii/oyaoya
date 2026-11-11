// 大学祭の算数（易しい）第1問。台本の書き方は src/problems/sample にそろえる
import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'
import { TeachingScript } from '../../components/TeachingScript'
import {
  LessonSlides,
  RevealHint,
  type LessonSlide,
} from '../../components/LessonSlides'
import { SpokenWords } from '../../components/SpokenWords'
import { TeachingPoints } from '../../components/TeachingPoints'
import { pagedFlow } from '../../components/pagedFlow'
import { useScriptControls } from '../../components/scriptControls'
import flowStyles from '../../components/AdditionFlow.module.css'
import { TapeDiagram as TapeDiagram1 } from './TapeDiagram1'
import { TapeDiagram as TapeDiagram2 } from './TapeDiagram2'
import { TapeDiagram as TapeDiagram3 } from './TapeDiagram3'
import styles from './math-easy-1.module.css'

const LIST_PRICE = 1200
const DISCOUNT_RATE = 20
const DISCOUNT = (LIST_PRICE * DISCOUNT_RATE) / 100
const SALE_PRICE = LIST_PRICE - DISCOUNT

const QUESTION_TEXT = `定価${LIST_PRICE}円のノートセットが、${DISCOUNT_RATE}％引きで売られています。代金はいくらですか？`

// 子どもに読み上げるセリフ。台本のページと準備画面の「声かけを先に読んでおく」の両方で使う
const words = {
  whole:
    'まず20%っていうのは、全部で100個あったらそのうちの20個という意味なんだ。例えば100円の20%は20円だよ。つまり、全体を10個に分けたうちの2個分なんだ。',
  discount:
    'さっき20%は10個に分けたうちの2個分って説明したね。まず1200円を10個に分けてみよう。1200÷10で1個分は120円になるね。',
  price:
    '20%は10個のうち2個だったね。1個120円だから、2個だと120×2で240円になるね。',
  subtract:
    '240円安くなることがわかったね。問題では20%引きって言ってたから、もとの1200円から240円を引いてみよう',
  ask: 'じゃあ、計算してみよう。代金はいくらになったかな？',
  right: `正解！ ${LIST_PRICE}円のノートセットが、${SALE_PRICE}円で買えるね！`,
  wrong: `おしい！ ${LIST_PRICE}円から${DISCOUNT}円安くなるんだったね。払うお金はいくらかな？ もう一度、一緒に計算してみよう。`,
}

// 台本のページ。左へスワイプで次、右へで前
const pages = [
  'read',
  'whole',
  'discount',
  'price',
  'subtract',
  'answer',
] as const
type Page = (typeof pages)[number]

const flow = pagedFlow('math-easy-1', pages)

// ノートセットの絵に描く3冊。左上の位置・傾き・表紙の色（クラス名）。最後の1冊がいちばん手前
const NOTEBOOKS = [
  { x: 30, y: 24, angle: -12, cover: 'coverBlue' },
  { x: 106, y: 24, angle: 12, cover: 'coverPink' },
  { x: 68, y: 16, angle: 0, cover: 'coverAccent' },
] as const

// 3冊のノートを重ねた絵。枠線は使わず、表紙・背・名前の札を色の面だけで描く
function Notebooks() {
  return (
    <svg className={styles.notebooks} viewBox="0 0 220 150" aria-hidden="true">
      {NOTEBOOKS.map(({ x, y, angle, cover }) => (
        <g
          key={cover}
          transform={`rotate(${angle} ${x + 42} ${y + 56}) translate(${x} ${y})`}
        >
          <rect className={styles[cover]} width="84" height="112" rx="8" />
          <rect className={styles.spine} width="14" height="112" rx="4" />
          <rect x="26" y="22" width="46" height="28" rx="4" fill="#fff" />
          <rect className={styles.line} x="32" y="30" width="34" height="4" />
          <rect className={styles.line} x="32" y="38" width="22" height="4" />
        </g>
      ))}
    </svg>
  )
}

// 問題の値札。準備の画面と、台本の最初のページのステージに置く
function PriceTag() {
  return (
    <div
      className={styles.priceTag}
      role="img"
      aria-label={`ノートセット。定価${LIST_PRICE}円、${DISCOUNT_RATE}％引き`}
    >
      <Notebooks />
      <strong className={styles.price}>
        定価 <b>{LIST_PRICE}</b>円
      </strong>
      <span className={styles.discount}>{DISCOUNT_RATE}％引き</span>
    </div>
  )
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
        {/* 1行では幅に収まらないので、「＝」の前で2行に分ける */}
        <span>
          {LIST_PRICE}円 − {DISCOUNT}円
        </span>
        <span>
          ＝{' '}
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
        </span>
      </p>
      {!visible && <RevealHint />}
    </>
  )
}

function MathEasyFlow() {
  // 最後のページの「終わる」で、準備の画面へ戻る
  const { finish } = useScriptControls()
  const { page, revealed, reveal, next, back } = flow.usePages()
  // 答えのページは「？」で答えを見てから次へ進める
  const canNext = page !== 'answer'

  const slides: Record<Page, LessonSlide> = {
    read: {
      id: 'read',
      title: '問題を読んでみましょう',
      stage: <PriceTag />,
      content: (
        <>
          <TeachingPoints
            note={`まずは、下の問題を**ゆっくり読み上げましょう**。\n\n定価（${LIST_PRICE}円）と何％引き（${DISCOUNT_RATE}％）かを、お子さんに紙に書いてもらうと、あとで見返せます。`}
          />
          <p className={flowStyles.problem}>{QUESTION_TEXT}</p>
        </>
      ),
    },
    whole: {
      id: 'whole',
      title: '20％引きとはどういうことなのか考えましょう',
      stage: <TapeDiagram1 step="price" />,
      content: (
        <>
          <TeachingPoints
            collapsible
            note="100%のうち20%は10個のうち2個であることを伝えましょう。図を見せてもよいかもしれません。"
          />
          <SpokenWords>{words.whole}</SpokenWords>
        </>
      ),
    },
    discount: {
      id: 'discount',
      title: '20％分はいくらか考えましょう',
      stage: <TapeDiagram2 step="price" />,
      content: (
        <>
          <TeachingPoints
            collapsible
            note="1200円を10等分して1個の金額を求めましょう。"
          />
          <SpokenWords>{words.discount}</SpokenWords>
        </>
      ),
    },
    price: {
      id: 'price',
      title: '代金を求める式を考えましょう',
      stage: <TapeDiagram3 step="price" />,
      content: (
        <>
          <TeachingPoints
            collapsible
            note="20%は2個分なので120円を2倍にしましょう"
          />
          <SpokenWords>{words.price}</SpokenWords>
        </>
      ),
    },
    subtract: {
      id: 'subtract',
      title: '値引き額を定価から引きましょう',
      stage: <TapeDiagram3 step="price" />,
      content: (
        <>
          <TeachingPoints
            collapsible
            note="20%引きの意味を教えて全体の金額である1200円から引きましょう。"
          />
          <SpokenWords>{words.subtract}</SpokenWords>
        </>
      ),
    },
    // 答えのページ：答えは先に言わず、お子さんが答えてから「？」で見る
    answer: {
      id: 'answer',
      title: '答えを確認しましょう！',
      stage: <Equation visible={revealed} onReveal={reveal} />,
      content: (
        <div className={flowStyles.answer} aria-live="polite">
          {revealed ? (
            <>
              <TeachingPoints
                collapsible
                note={`**${DISCOUNT}円と答えていたら**、安くなった分と払う代金が入れかわっています。「${LIST_PRICE}円のノートが${DISCOUNT}円安くなったら、払うのはいくら？」と聞き直しましょう。\n\nほかの数のときは、お子さんが立てた式（${LIST_PRICE}−${DISCOUNT}か${LIST_PRICE}×0.8）を紙に書いて、一緒に計算し直します。`}
              />
              <SpokenWords title={`${SALE_PRICE}円と答えたら`}>
                {words.right}
              </SpokenWords>
              <SpokenWords title="ちがう答えだったら" minor>
                {words.wrong}
              </SpokenWords>
              <button
                className={flowStyles.finish}
                type="button"
                onClick={finish}
              >
                終わる
              </button>
            </>
          ) : (
            <>
              <TeachingPoints
                collapsible
                note="お子さんが答えてから、「？」を押して確かめましょう。**答えを先に言わない**ようにします。"
              />
              <SpokenWords>{words.ask}</SpokenWords>
            </>
          )}
        </div>
      ),
      onReveal: revealed ? undefined : reveal,
    },
  }

  return (
    <LessonSlides
      label="算数 易しい 第1問の台本"
      slides={pages.map((page) => slides[page])}
      currentId={page}
      totalKnown
      canNext={canNext}
      onNext={next}
      onBack={back}
    />
  )
}

export default function MathEasy1() {
  const location = useLocation()
  return (
    <TeachingScript
      flow={<MathEasyFlow />}
      flowStatus={() => flow.status(location.pathname)}
      // 準備の画面のステージに大きく出す値札
      picture={<PriceTag />}
      prepare={{
        goal: '20％引きの意味を考えて、ノートセットの代金を求めます。',
        steps: [
          '問題を読む',
          '20％引きの意味を考える',
          '値引き額を求める',
          '定価から引いて代金を出す',
          '答えを確かめる',
        ],
        point: `値引き額を求めて、定価から引きます。80％分を直接求める考え方（${LIST_PRICE}×0.8）でも正解です。`,
      }}
      // 「声かけを先に読んでおく」に出す。台本のページと同じ words を使う
      question={{ say: QUESTION_TEXT }}
      turns={[
        { say: words.whole },
        { say: words.discount },
        { say: words.price },
        { say: words.subtract },
        { say: words.ask },
        { say: `（答えたら）${words.right}` },
      ]}
    />
  )
}
