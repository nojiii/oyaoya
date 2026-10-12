import { ProblemSections } from '../../components/ProblemSections'

export const title = 'あわせていくつ'

export default function AdditionApples() {
  return (
    <ProblemSections
      question={
        <>
          <p>あかい りんごが 3こ、あおい りんごが 2こ あります。</p>
          <p>あわせて なんこ ありますか。</p>
        </>
      }
      howToSolve={
        <>
          <ol>
            <li>りんごの数を「3こ」と「2こ」に分けて考えます。</li>
            <li>「あわせて」は足し算のサインです。3 + 2 を計算します。</li>
            <li>3 + 2 = 5 なので、答えは 5こ です。</li>
          </ol>
          <p>式: 3 + 2 = 5</p>
        </>
      }
      howToTeach={
        <ul>
          <li>
            いきなり式を書かせず、まずは実物やおはじきなど「具体物」を使って数えさせましょう。
          </li>
          <li>
            「あわせて」「ぜんぶで」という言葉が、足し算を表すことに気づかせることが大切です。
          </li>
          <li>
            3このりんごと2このりんごを実際に並べて、1つずつ数えながら「1、2、3、4、5」と確認すると理解が深まります。
          </li>
          <li>
            慣れてきたら、絵を描かずに頭の中で計算する練習に移りましょう。
          </li>
        </ul>
      }
      examplePhrases={
        <ul>
          <li>「あわせて、って言われたら何算をするんだったかな?」</li>
          <li>「りんご、実際に並べてみようか」</li>
          <li>「1個ずつ一緒に数えてみよう」</li>
          <li>「正解!よく数えられたね」</li>
          <li>
            間違えても「おしい!もう一回一緒に数えてみよう」と前向きに声をかけましょう。
          </li>
        </ul>
      }
    />
  )
}
