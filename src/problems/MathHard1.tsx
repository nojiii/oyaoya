import { useState, type ReactNode } from 'react'
import { TeachingScript, type Turn } from '../components/TeachingScript'
import additionStyles from '../components/AdditionFlow.module.css'
import styles from '../components/TeachingScript.module.css'

const questionImage = Object.entries(
  import.meta.glob('./images/*', {
    eager: true,
    query: '?url',
    import: 'default',
  }),
).find(([path]) => path.endsWith('(1).png'))?.[1] as string | undefined

const guideImage = Object.entries(
  import.meta.glob('./images/*', {
    eager: true,
    query: '?url',
    import: 'default',
  }),
).find(([path]) => path.endsWith('(2).png'))?.[1] as string | undefined

const nextGuideImage = Object.entries(
  import.meta.glob('./images/*', {
    eager: true,
    query: '?url',
    import: 'default',
  }),
).find(([path]) => path.endsWith('(3).png'))?.[1] as string | undefined

const answerGuideImage = Object.entries(
  import.meta.glob('./images/*', {
    eager: true,
    query: '?url',
    import: 'default',
  }),
).find(([path]) => path.endsWith('(4).png'))?.[1] as string | undefined

const finalGuideImage = Object.entries(
  import.meta.glob('./images/*', {
    eager: true,
    query: '?url',
    import: 'default',
  }),
).find(([path]) => path.endsWith('(5).png'))?.[1] as string | undefined

const QUESTION_TEXT =
  '白い部分の面積は72㎠です。ピンクの部分の面積は何㎠でしょうか？'

function FigureImage() {
  return questionImage ? (
    <img
      src={questionImage}
      alt="数学の問題に使う図形"
      style={{ maxWidth: '100%', maxHeight: '320px', objectFit: 'contain' }}
    />
  ) : (
    <p>図形(1).pngを読み込めませんでした。</p>
  )
}

function GuideImage() {
  return guideImage ? (
    <img
      src={guideImage}
      alt="対角線を引いた図形"
      style={{ maxWidth: '100%', maxHeight: '320px', objectFit: 'contain' }}
    />
  ) : (
    <p>図形(2).pngを読み込めませんでした。</p>
  )
}

function NextGuideImage() {
  return nextGuideImage ? (
    <img
      src={nextGuideImage}
      alt="補助線によってできた長方形の図"
      style={{ maxWidth: '100%', maxHeight: '320px', objectFit: 'contain' }}
    />
  ) : (
    <p>図形(3).pngを読み込めませんでした。</p>
  )
}

function AnswerGuideImage() {
  return answerGuideImage ? (
    <img
      src={answerGuideImage}
      alt="真ん中の長方形の面積を考える図"
      style={{ maxWidth: '100%', maxHeight: '320px', objectFit: 'contain' }}
    />
  ) : (
    <p>図形(4).pngを読み込めませんでした。</p>
  )
}

function FinalGuideImage() {
  return finalGuideImage ? (
    <img
      src={finalGuideImage}
      alt="白い三角形とピンクの部分を考える図"
      style={{ maxWidth: '100%', maxHeight: '320px', objectFit: 'contain' }}
    />
  ) : (
    <p>図形(5).pngを読み込めませんでした。</p>
  )
}

function AnswerReveal() {
  const [revealed, setRevealed] = useState(false)

  return (
    <div className={additionStyles.answer}>
      <h2>答えを確認しましょう！</h2>
      <p className={additionStyles.equation}>
        72㎠ - 8㎠ = {revealed ? '64㎠' : '？'}
      </p>
      <button
        className={revealed ? additionStyles.secondary : additionStyles.primary}
        type="button"
        onClick={() => setRevealed(true)}
      >
        答えを見る
      </button>
    </div>
  )
}

function reveal(content: ReactNode) {
  return (
    <div
      style={{
        display: 'grid',
        gap: '0.75rem',
        justifyItems: 'center',
      }}
    >
      {content}
    </div>
  )
}

const turns: Turn[] = [
  {
    parentNote:
      '長方形の対角線の性質をしっかりと確認し、それを活かせるように補助線を引きましょう',
    say: '長方形に対角線を引くと面積を均等に分けられるのはわかる？それを使って補助線を引いてみよう',
    sayContent: (
      <>
        <p>
          長方形に対角線を引くと面積を均等に分けられるのはわかる？それを使って補助線を引いてみよう
        </p>
        <GuideImage />
      </>
    ),
  },
  {
    parentNote: '補助線によってできた長方形の情報を整理しましょう',
    say: 'この真ん中に出来た長方形は何×何になるかな？',
    sayContent: (
      <>
        <p>この真ん中に出来た長方形は何×何になるかな？</p>
        <NextGuideImage />
      </>
    ),
    why: '面積を分けて考えると、複雑な図形でも計算しやすくなります。',
  },
  {
    parentNote: '真ん中の長方形の面積を計算しましょう',
    say: '真ん中の長方形は何㎠になるかな？',
    sayContent: (
      <>
        <p>真ん中の長方形は何㎠になるかな？</p>
        <AnswerGuideImage />
      </>
    ),
  },
  {
    parentNote:
      'この長方形を除いた白い部分とピンクの部分は同じ面積になるはずです。これより、ピンクの色の面積を求めましょう',
    say: '真ん中の長方形以外の白い部分はピンクの部分と同じだよね？そしたら白い三角形の面積を求めたらピンクの面積もでるんじゃない？',
    sayContent: (
      <>
        <p>
          真ん中の長方形以外の白い部分はピンクの部分と同じだよね？そしたら白い三角形の面積を求めたらピンクの面積もでるんじゃない？
        </p>
        <FinalGuideImage />
      </>
    ),
    reveal: reveal(<AnswerReveal />),
  },
]

export default function MathHard1() {
  return (
    <TeachingScript
      showSpeaker={false}
      showRevealHeading={false}
      showFinish={false}
      editor={
        <div className={styles.reference}>
          <FigureImage />
        </div>
      }
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
      question={{
        say: 'まずは問題を読んで、図をよく見てみましょう。',
        sayContent: (
          <>
            <p>{QUESTION_TEXT}</p>
            <FigureImage />
          </>
        ),
        parentNote: 'まずは、下の問題をお子さんと一緒に読みましょう',
      }}
      turns={turns}
    />
  )
}
