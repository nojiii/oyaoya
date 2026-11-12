// 大学祭の算数（難しい）第1問。台本の書き方は src/problems/sample にそろえる
import { useLocation } from 'react-router'
import { TeachingScript } from '../../components/TeachingScript'
import { LessonSlides, type LessonSlide } from '../../components/LessonSlides'
import { SpokenWords } from '../../components/SpokenWords'
import { TeachingPoints } from '../../components/TeachingPoints'
import { pagedFlow } from '../../components/pagedFlow'
import { useScriptControls } from '../../components/scriptControls'
import flowStyles from '../../components/AdditionFlow.module.css'
import { AreaFigure } from './AreaFigure'

const QUESTION_TEXT =
  '白い部分の面積は72㎠です。灰色の部分の面積は何㎠でしょうか？'

// 子どもに読み上げるセリフ。台本のページと準備画面の「声かけを先に読んでおく」の両方で使う
const words = {
  diagonal:
    'まず、左上にある灰色の三角形に注目してみよう。点線を引くと長方形ができるよ。',
  rectangle:
    '長方形をななめの線で分けると、同じ大きさの三角形が2つできるんだ。だから、この灰色と白の三角形は同じ面積だよ。',
  center:
    '他の三角形も同じように分けられるよ。つまり、灰色と白の三角形の合計面積は同じなんだ。',
  remaining:
    'でも、真ん中に小さな長方形が残っているね。まずはこの長方形の面積を求めてみよう。',
  dimensions: '横の長さは8−4で4cm。縦の長さは7−5で2cmになるよ。',
  area: '長方形の面積は、4×2で8㎠だね。',
  whiteArea:
    '白い部分の面積72㎠から8㎠を引くと白い三角形の面積は64㎠になるね。',
  answer:
    '白と灰色の三角形は同じ面積だったね。だから灰色の部分の面積は64㎠になるね。',
}

// 台本のページ。左へスワイプで次、右へで前
const pages = [
  'read',
  'diagonal',
  'rectangle',
  'center',
  'remaining',
  'dimensions',
  'area',
  'whiteArea',
  'answer',
] as const
type Page = (typeof pages)[number]

const flow = pagedFlow('math-hard-1', pages)

// 問題の図。最初と最後のページ、準備の画面で使う
const questionFigure = <AreaFigure label="算数の問題に使う図形" area={72} />
// 4・5ページ目は同じ図を使う
const centerFigure = (
  <AreaFigure
    label="4つの灰色の三角形と、同じ面積の白い三角形に同じ印を付けた図"
    guides="all"
    marks="all"
  />
)

function MathHardFlow() {
  // 最後のページの「終わる」で、準備の画面へ戻る
  const { finish } = useScriptControls()
  const { page, next, back } = flow.usePages()

  const slides: Record<Page, LessonSlide> = {
    read: {
      id: 'read',
      title: 'まずは問題を読んで、図をよく見てみましょう',
      stage: questionFigure,
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
        <AreaFigure
          label="左上の灰色の三角形に点線を引いて、長方形を作った図"
          guides="corner"
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
      title: '灰色と白の三角形の面積をくらべましょう',
      stage: (
        <AreaFigure
          label="点線の長方形が、同じ印を付けた灰色と白の三角形に分かれた図"
          guides="corner"
          marks="corner"
        />
      ),
      content: (
        <>
          <TeachingPoints
            collapsible
            note="長方形の性質を利用して、白と灰色の三角形の面積が同じことを確認しましょう"
          />
          <SpokenWords>{words.rectangle}</SpokenWords>
        </>
      ),
    },
    center: {
      id: 'center',
      title: 'ほかの三角形も同じように考えましょう',
      stage: centerFigure,
      content: (
        <>
          <TeachingPoints
            collapsible
            note="すべての白と灰色の三角形の面積が同じであり、合計面積も同じことを確認しましょう"
          />
          <SpokenWords>{words.center}</SpokenWords>
        </>
      ),
    },
    remaining: {
      id: 'remaining',
      title: '真ん中に残った長方形に注目しましょう',
      stage: centerFigure,
      content: (
        <>
          <TeachingPoints
            collapsible
            note="残った真ん中の長方形に注目しましょう"
          />
          <SpokenWords>{words.remaining}</SpokenWords>
        </>
      ),
    },
    dimensions: {
      id: 'dimensions',
      title: '長方形の横と縦の長さを求めましょう',
      stage: (
        <AreaFigure
          label="真ん中の長方形の横に4cm、縦に2cmと書いた図"
          guides="all"
          sides
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
      stage: (
        <AreaFigure
          label="真ん中の長方形に8㎠と書いた図"
          guides="all"
          sides
          area={8}
        />
      ),
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
        <AreaFigure
          label="白い部分から真ん中の長方形を除いた、4つの白い三角形をぬった図"
          guides="all"
          marks="all"
          highlight
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
      title: '灰色の部分の面積を確かめましょう',
      stage: questionFigure,
      content: (
        <>
          <TeachingPoints
            collapsible
            note="白い三角形と灰色の三角形は同じ面積なので、白い三角形の面積がそのまま灰色の部分の面積になることを確認しましょう"
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
      label="算数 難しい 第1問の台本"
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
      picture={questionFigure}
      prepare={{
        goal: '図形の面積を分けて考え、灰色の部分の面積を求めます。',
        materials: ['紙と鉛筆', '問題の図形'],
        steps: [
          '問題と図を見る',
          '補助線を引く',
          '三角形の面積をくらべる',
          '真ん中の長方形の面積を求める',
          '灰色の部分の面積を確かめる',
        ],
        point:
          'すぐに答えを出そうとせず、図形をいくつかの部分に分けて考えます。',
      }}
      // 「声かけを先に読んでおく」に出す。台本のページと同じ words を使う
      question={{ say: QUESTION_TEXT }}
      turns={[
        { say: words.diagonal },
        { say: words.rectangle },
        { say: words.center },
        { say: words.remaining },
        { say: words.dimensions },
        { say: words.area },
        { say: words.whiteArea },
        { say: words.answer },
      ]}
    />
  )
}
