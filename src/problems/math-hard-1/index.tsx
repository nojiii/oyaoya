// 大学祭の数学（難しい）第1問。台本の書き方は src/problems/sample にそろえる
import { useEffect, useState } from 'react'
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
import figureQuestion from './images/figure-1.webp'
import figureDiagonal from './images/figure-6.webp'
import figureRectangle from './images/figure-7.webp'
import figureCenter from './images/figure-8.webp'
import figurePink from './images/figure-8.webp'
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
  pink:
    'でも、真ん中に小さな長方形が残っているね。まずはこの長方形の面積を求めてみよう。',
  dimensions: '横の長さは8-4で4cm。縦の長さは7-5で2cmになるよ。',
  area: '長方形の面積は、4×2で8㎠だね。',
  whiteArea:
    '白い部分の面積72㎠から8㎠を引くと白い三角形の面積は64㎠になるね。',
}

// 台本のページ。左へスワイプで次、右へで前
const pages = [
  'read',
  'diagonal',
  'rectangle',
  'center',
  'pink',
  'dimensions',
  'placeholder7',
  'placeholder8',
  'answer',
] as const
type Page = (typeof pages)[number]

// 進み具合は、同じタブの中で保存する（準備の画面へ戻ると、台本の部品は作り直されるため）
const storageKey = (pathname: string) => `math-hard-1-flow:v1:${pathname}`

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

function Figure({ src, alt }: { src: string; alt: string }) {
  return <img className={styles.figure} src={src} alt={alt} draggable={false} />
}

function MathHardFlow() {
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
  const index = pages.indexOf(page)
  const go = (next: Page | undefined) => {
    if (!next) return
    setPage(next)
  }

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
            note="まずは4つある三角形のうち1つに注目して補助線を引いてみましょう"
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
              '長方形の性質を理由して白とピンクの三角形の面積が同じことを確認しましょう'
            }
          />
        </>
      ),
    },
    center: {
      id: 'center',
      title: '',
      stage: <Figure src={figureCenter} alt="真ん中の長方形の面積を考える図" />,
      content: (
        <>
          <SpokenWords>{words.center}</SpokenWords>
          <TeachingPoints
            folded
            note="全ての白とピンクの三角形の面積が同じであり、合計面積も同じことを確認しましょう"
          />
        </>
      ),
    },
    pink: {
      id: 'pink',
      title: '',
      stage: (
        <Figure src={figurePink} alt="白い三角形とピンクの部分を考える図" />
      ),
      content: (
        <>
          <SpokenWords>{words.pink}</SpokenWords>
          <TeachingPoints
            folded
            note="残った真ん中の長方形に注目しましょう"
          />
        </>
      ),
    },
    dimensions: {
      id: 'dimensions',
      title: '',
      stage: <Figure src={figureDimensions} alt="長方形の辺の長さを考える図" />,
      content: (
        <>
          <SpokenWords>{words.dimensions}</SpokenWords>
          <TeachingPoints folded note="図より、長方形の辺の長さを確認しましょう" />
        </>
      ),
    },
    placeholder7: {
      id: 'placeholder7',
      title: '',
      stage: <Figure src={figureArea} alt="長方形の面積を考える図" />,
      content: (
        <>
          <SpokenWords>{words.area}</SpokenWords>
          <TeachingPoints folded note="長方形の面積を求めましょう" />
        </>
      ),
    },
    placeholder8: {
      id: 'placeholder8',
      title: '',
      stage: <Figure src={figureWhiteArea} alt="白い三角形の面積を考える図" />,
      content: (
        <>
          <SpokenWords>{words.whiteArea}</SpokenWords>
          <TeachingPoints
            folded
            note="長方形を除いた白い部分の面積を求めましょう"
          />
        </>
      ),
    },
    // 最後のページ：声かけを終えたら準備の画面へ戻る
    answer: {
      id: 'answer',
      title: '',
      stage: <Figure src={figureQuestion} alt="数学の問題に使う図形" />,
      content: (
        <>
          <SpokenWords>
            白とピンクの三角形は同じ面積だったね。だからピンクの部分の面積は64㎠になるね
          </SpokenWords>
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
      onNext={() => go(pages[index + 1])}
      onBack={() => go(pages[index - 1])}
    />
  )
}

export default function MathHard1() {
  const location = useLocation()
  return (
    <TeachingScript
      flow={<MathHardFlow />}
      flowStatus={() =>
        flowStatus(sessionStorage.getItem(storageKey(location.pathname)))
      }
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
      ]}
    />
  )
}
