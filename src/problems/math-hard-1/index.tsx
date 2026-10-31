// 大学祭の数学（難しい）第1問。台本の書き方は src/problems/sample にそろえる
import { useLocation } from 'react-router'
import { TeachingScript } from '../../components/TeachingScript'
import { LessonSlides, type LessonSlide } from '../../components/LessonSlides'
import { SpokenWords } from '../../components/SpokenWords'
import { TeachingPoints } from '../../components/TeachingPoints'
import { pagedFlow } from '../../components/pagedFlow'
import { useScriptControls } from '../../components/scriptControls'
import flowStyles from '../../components/AdditionFlow.module.css'
import figureQuestion from './images/figure-1.webp'
import figureDiagonal from './images/figure-6.webp'
import figureRectangle from './images/figure-7.webp'
// 4・5ページ目は同じ図を使う
import figureCenter from './images/figure-8.webp'
import figureDimensions from './images/figure-9.webp'
import figureArea from './images/figure-4.webp'
import figureWhiteArea from './images/figure-10.webp'
import styles from './math-hard-1.module.css'

const QUESTION_TEXT =
  '白い部分の面積は72㎠です。ピンクの部分の面積は何㎠でしょうか？'

// 子どもに読み上げるセリフ。台本のページと準備画面の「声かけを先に読んでおく」の両方で使う
const words = {
  diagonal:
    'まず、左上にあるピンクの三角形に注目してみよう。点線を引くと長方形ができるよ。',
  rectangle:
    '長方形をななめの線で分けると、同じ大きさの三角形が2つできるんだ。だから、このピンクと白の三角形は同じ面積だよ。',
  center:
    '他の三角形も同じように分けられるよ。つまり、ピンクと白の三角形の合計面積は同じなんだ。',
  pink: 'でも、真ん中に小さな長方形が残っているね。まずはこの長方形の面積を求めてみよう。',
  dimensions: '横の長さは8−4で4cm。縦の長さは7−5で2cmになるよ。',
  area: '長方形の面積は、4×2で8㎠だね。',
  whiteArea:
    '白い部分の面積72㎠から8㎠を引くと白い三角形の面積は64㎠になるね。',
  answer:
    '白とピンクの三角形は同じ面積だったね。だからピンクの部分の面積は64㎠になるね',
}

// 台本のページ。左へスワイプで次、右へで前
const pages = [
  'read',
  'diagonal',
  'rectangle',
  'center',
  'pink',
  'dimensions',
  'area',
  'whiteArea',
  'answer',
] as const
type Page = (typeof pages)[number]

const flow = pagedFlow('math-hard-1', pages)

function Figure({ src, alt }: { src: string; alt: string }) {
  return <img className={styles.figure} src={src} alt={alt} draggable={false} />
}

function MathHardFlow() {
  // 最後のページの「終わる」で、準備の画面へ戻る
  const { finish } = useScriptControls()
  const { page, next, back } = flow.usePages()

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
      stage: (
        <Figure
          src={figureDiagonal}
          alt="左上のピンクの三角形に点線を引いて、長方形を作った図"
        />
      ),
      content: (
        <>
          <TeachingPoints
            collapsible
            note="まずは4つある三角形のうち1つに注目して補助線を引いてみましょう"
          />
          <SpokenWords>{words.diagonal}</SpokenWords>
        </>
      ),
    },
    rectangle: {
      id: 'rectangle',
      title: 'ピンクと白の三角形の面積をくらべましょう',
      stage: (
        <Figure
          src={figureRectangle}
          alt="点線の長方形が、同じ印を付けたピンクと白の三角形に分かれた図"
        />
      ),
      content: (
        <>
          <TeachingPoints
            collapsible
            note="長方形の性質を利用して、白とピンクの三角形の面積が同じことを確認しましょう"
          />
          <SpokenWords>{words.rectangle}</SpokenWords>
        </>
      ),
    },
    center: {
      id: 'center',
      title: 'ほかの三角形も同じように考えましょう',
      stage: (
        <Figure
          src={figureCenter}
          alt="4つのピンクの三角形と、同じ面積の白い三角形に同じ印を付けた図"
        />
      ),
      content: (
        <>
          <TeachingPoints
            collapsible
            note="すべての白とピンクの三角形の面積が同じであり、合計面積も同じことを確認しましょう"
          />
          <SpokenWords>{words.center}</SpokenWords>
        </>
      ),
    },
    pink: {
      id: 'pink',
      title: '真ん中に残った長方形に注目しましょう',
      stage: (
        <Figure
          src={figureCenter}
          alt="4つのピンクの三角形と、同じ面積の白い三角形に同じ印を付けた図"
        />
      ),
      content: (
        <>
          <TeachingPoints
            collapsible
            note="残った真ん中の長方形に注目しましょう"
          />
          <SpokenWords>{words.pink}</SpokenWords>
        </>
      ),
    },
    dimensions: {
      id: 'dimensions',
      title: '長方形の横と縦の長さを求めましょう',
      stage: (
        <Figure
          src={figureDimensions}
          alt="真ん中の長方形の横に4cm、縦に2cmと書いた図"
        />
      ),
      content: (
        <>
          <TeachingPoints
            collapsible
            note="図より、長方形の辺の長さを確認しましょう"
          />
          <SpokenWords>{words.dimensions}</SpokenWords>
        </>
      ),
    },
    area: {
      id: 'area',
      title: '長方形の面積を求めましょう',
      stage: <Figure src={figureArea} alt="真ん中の長方形に8㎠と書いた図" />,
      content: (
        <>
          <TeachingPoints collapsible note="長方形の面積を求めましょう" />
          <SpokenWords>{words.area}</SpokenWords>
        </>
      ),
    },
    whiteArea: {
      id: 'whiteArea',
      title: '白い三角形の面積を求めましょう',
      stage: (
        <Figure
          src={figureWhiteArea}
          alt="白い部分から真ん中の長方形を除いた、4つの白い三角形をぬった図"
        />
      ),
      content: (
        <>
          <TeachingPoints
            collapsible
            note="長方形を除いた白い部分の面積を求めましょう"
          />
          <SpokenWords>{words.whiteArea}</SpokenWords>
        </>
      ),
    },
    // 最後のページ：声かけを終えたら準備の画面へ戻る
    answer: {
      id: 'answer',
      title: 'ピンクの部分の面積を確かめましょう',
      stage: <Figure src={figureQuestion} alt="数学の問題に使う図形" />,
      content: (
        <>
          <TeachingPoints
            collapsible
            note="白い三角形とピンクの三角形は同じ面積なので、白い三角形の面積がそのままピンクの部分の面積になることを確認しましょう"
          />
          <SpokenWords>{words.answer}</SpokenWords>
          <button className={flowStyles.finish} type="button" onClick={finish}>
            終わる
          </button>
        </>
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
        { say: words.dimensions },
        { say: words.area },
        { say: words.whiteArea },
        { say: words.answer },
      ]}
    />
  )
}
