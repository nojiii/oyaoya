import { ProblemStory } from '../../components/ProblemStory'
import { AppleScene } from './AppleScene'

export const title = 'あわせていくつ'

export default function AdditionApples() {
  return (
    <ProblemStory
      question={{
        steps: [
          'あかい りんごが 3こ、',
          'あおい りんごが 2こ あります。',
          'あわせて なんこ ありますか。',
        ],
        visual: (step) => (
          <AppleScene
            count={step === 0 ? 3 : 5}
            formula={step === 2 ? 'question' : undefined}
          />
        ),
      }}
      howToSolve={{
        steps: [
          'りんごの数を「3こ」と「2こ」に分けて考えます。',
          <>
            「あわせて」は<strong>足し算</strong>のサインです。3 + 2
            を計算します。
          </>,
          <>
            3 + 2 = 5 なので、答えは <strong>5こ</strong> です。
          </>,
        ],
        visual: (step) => (
          <AppleScene
            count={5}
            split={step === 0}
            counted={step === 2}
            formula={step === 1 ? 'sum' : step === 2 ? 'answer' : undefined}
          />
        ),
      }}
      howToTeach={{
        steps: [
          <>
            いきなり式を書かせず、まずは実物やおはじきなど
            <strong>「具体物」</strong>を使って数えさせましょう。
          </>,
          <>
            <strong>「あわせて」「ぜんぶで」</strong>
            という言葉が、足し算を表すことに気づかせることが大切です。
          </>,
          <>
            3このりんごと2このりんごを実際に並べて、1つずつ数えながら
            <strong>「1、2、3、4、5」</strong>と確認すると理解が深まります。
          </>,
          <>
            慣れてきたら、絵を描かずに<strong>頭の中で計算する</strong>
            練習に移りましょう。
          </>,
        ],
      }}
      examplePhrases={{
        steps: [
          '「あわせて、って言われたら何算をするんだったかな?」',
          '「りんご、実際に並べてみようか」',
          '「1個ずつ一緒に数えてみよう」',
          '「正解!よく数えられたね」',
          '間違えても「おしい!もう一回一緒に数えてみよう」と前向きに声をかけましょう。',
        ],
      }}
    />
  )
}
