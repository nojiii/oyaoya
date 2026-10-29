import type { ReactNode } from 'react'
import { TeachingScript, type Turn } from '../components/TeachingScript'
import styles from '../components/TeachingScript.module.css'

const questionImage = Object.entries(
  import.meta.glob('./images/*', {
    eager: true,
    query: '?url',
    import: 'default',
  }),
).find(([path]) => path.endsWith('(1).png'))?.[1] as string | undefined

const QUESTION_TEXT = '白い部分の面積は72㎠です。ピンクの部分の面積は何㎠でしょうか？'

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
    say: '図を見て、白い部分とピンクの部分の関係を考えます。',
    show: reveal(<FigureImage />),
    how: 'まず、図形全体をいくつかの長方形に分けて考えます。',
  },
  {
    say: '白い部分の面積を使って、ピンクの部分の面積を求めます。',
    reveal: reveal(
      <p>
        図形全体から白い部分を引くと、ピンクの部分が求められます。
      </p>,
    ),
    why: '面積を分けて考えると、複雑な図形でも計算しやすくなります。',
  },
  {
    say: '最後に計算結果を確認します。',
    reveal: reveal(
      <p style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>
        答えは 32㎠ です。
      </p>,
    ),
  },
]

export default function MathHard1() {
  return (
    <TeachingScript
      editor={
        <div className={styles.reference}>
          <FigureImage />
        </div>
      }
      prepare={{
        goal: '図形の面積を分けて考え、ピンクの部分の面積を求めます。',
        materials: ['紙と鉛筆', '問題の図形'],
        point: 'すぐに答えを出そうとせず、図形をいくつかの部分に分けて考えます。',
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
        parentNote: '白い部分の面積が分かっています。図を分けて、ピンクの部分を求めます。',
      }}
      turns={turns}
    />
  )
}
