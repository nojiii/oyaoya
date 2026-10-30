// 大学祭の数学（難しい）第1問。台本の書き方は src/problems/sample にそろえる
import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'
import { TeachingScript } from '../../components/TeachingScript'
import { LessonSlides, type LessonSlide } from '../../components/LessonSlides'
import { SpokenWords } from '../../components/SpokenWords'
import { TeachingPoints } from '../../components/TeachingPoints'
import { pagedFlow } from '../../components/pagedFlow'
import { useScriptControls } from '../../components/scriptControls'
import flowStyles from '../../components/AdditionFlow.module.css'
import figureQuestion from './images/figure-1.webp'
import figureDiagonal from './images/figure-2.webp'
import figureRectangle from './images/figure-3.webp'
import figureCenter from './images/figure-4.webp'
import figurePink from './images/figure-5.webp'
import styles from './math-hard-1.module.css'

const QUESTION_TEXT =
  '白い部分の面積は72㎠です。ピンクの部分の面積は何㎠でしょうか？'

// 子どもに読み上げるセリフ。台本のページと準備画面の「声かけを先に読んでおく」の両方で使う
const words = {
  diagonal:
    '長方形に対角線を引くと面積を均等に分けられるのはわかる？それを使って補助線を引いてみよう',
  rectangle: 'この真ん中に出来た長方形は何×何になるかな？',
  center: '真ん中の長方形は何㎠になるかな？',
  pink: '真ん中の長方形以外の白い部分はピンクの部分と同じだよね？そしたら白い三角形の面積を求めたらピンクの面積もでるんじゃない？',
}

// 台本のページ。左へスワイプで次、右へで前
const pages = [
  'read',
  'diagonal',
  'rectangle',
  'center',
  'pink',
  'answer',
] as const
type Page = (typeof pages)[number]

const flow = pagedFlow('math-hard-1', pages)

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
        72㎠ − 8㎠ ＝{' '}
        {visible ? (
          <em>64㎠</em>
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

function MathHardFlow() {
  // 最後のページの「終わる」で、準備の画面へ戻る
  const { finish } = useScriptControls()
  const { page, revealed, reveal, next, back } = flow.usePages()

  const slides: Record<Page, LessonSlide> = {
    read: {
      id: 'read',
      title: 'まずは問題を読んで、図をよく見てみましょう',
      stage: <Figure src={figureQuestion} alt="数学の問題に使う図形" />,
      content: (
        <>
          <TeachingPoints note="まずは、下の問題をお子さんと**一緒に読みましょう**" />
          <p className={flowStyles.problem}>{QUESTION_TEXT}</p>
        </>
      ),
    },
    diagonal: {
      id: 'diagonal',
      title: '補助線を引いてみましょう',
      stage: <Figure src={figureDiagonal} alt="対角線を引いた図形" />,
      content: (
        <>
          <SpokenWords>{words.diagonal}</SpokenWords>
          <TeachingPoints
            folded
            note="長方形の対角線の性質をしっかりと確認し、それを活かせるように補助線を引きましょう"
          />
        </>
      ),
    },
    rectangle: {
      id: 'rectangle',
      title: '長方形の情報を整理しましょう',
      stage: (
        <Figure src={figureRectangle} alt="補助線によってできた長方形の図" />
      ),
      content: (
        <>
          <SpokenWords>{words.rectangle}</SpokenWords>
          <TeachingPoints
            folded
            note={
              '補助線によってできた長方形の情報を整理しましょう\n\n面積を分けて考えると、複雑な図形でも計算しやすくなります。'
            }
          />
        </>
      ),
    },
    center: {
      id: 'center',
      title: '真ん中の長方形の面積を計算しましょう',
      stage: <Figure src={figureCenter} alt="真ん中の長方形の面積を考える図" />,
      content: (
        <>
          <SpokenWords>{words.center}</SpokenWords>
          <TeachingPoints folded note="真ん中の長方形の面積を計算しましょう" />
        </>
      ),
    },
    pink: {
      id: 'pink',
      title: 'ピンクの部分の面積を求めましょう',
      stage: (
        <Figure src={figurePink} alt="白い三角形とピンクの部分を考える図" />
      ),
      content: (
        <>
          <SpokenWords>{words.pink}</SpokenWords>
          <TeachingPoints
            folded
            note="この長方形を除いた白い部分とピンクの部分は同じ面積になるはずです。これより、ピンクの色の面積を求めましょう"
          />
        </>
      ),
    },
    // 最後のページ：答えは先に言わず、お子さんが答えてから「？」で見る。見たら「終わる」で準備の画面へ戻る
    answer: {
      id: 'answer',
      title: '答えを確認しましょう！',
      stage: <Equation visible={revealed} onReveal={reveal} />,
      content: revealed && (
        <button className={flowStyles.finish} type="button" onClick={finish}>
          終わる
        </button>
      ),
    },
  }

  return (
    <LessonSlides
      label="数学 難しい 第1問の台本"
      slides={pages.map((page) => slides[page])}
      currentId={page}
      totalKnown
      canNext={page !== 'answer'}
      onNext={next}
      onBack={back}
    />
  )
}

export default function MathHard1() {
  const location = useLocation()
  return (
    <TeachingScript
      flow={<MathHardFlow />}
      flowStatus={() => flow.status(location.pathname)}
      // 準備の画面のステージに大きく出す図
      picture={<Figure src={figureQuestion} alt="数学の問題に使う図形" />}
      prepare={{
        goal: '図形の面積を分けて考え、ピンクの部分の面積を求めます。',
        materials: ['紙と鉛筆', '問題の図形'],
        point:
          'すぐに答えを出そうとせず、図形をいくつかの部分に分けて考えます。',
        avoid: [
          '図形全体の面積と一部分の面積を混同すること',
          '単位（㎠）を書き忘れること',
        ],
      }}
      // 「声かけを先に読んでおく」に出す。台本のページと同じ words を使う
      question={{ say: QUESTION_TEXT }}
      turns={[
        { say: words.diagonal },
        { say: words.rectangle },
        { say: words.center },
        { say: words.pink },
      ]}
    />
  )
}
