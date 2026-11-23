import { TeachingPoints } from './TeachingPoints'
import { SpokenWords } from './SpokenWords'
import type { LessonSlide } from './LessonSlides'
import styles from './AdditionFlow.module.css'

// 【試し】たしかめで、ひとりで解く問題の前に置くページ。ここまでできたことをほめてから、もう1問やるかを決める。
// 続けるときは、ほかのページと同じくスワイプ（「次」）でひとりで解く問題へ進み、やめるときは「ここで終わる」で準備の画面へ戻る。
// 「ここで終わる」は最後まで終えたときと同じく、次に台本を開くと最初のページから始まる（onFinish で、保存した進み具合を消す）
export const ANOTHER_PROBLEM_TITLE = 'もう1問、解いてみましょうか？'

export function anotherProblemSlide({
  say,
  onFinish,
}: {
  // お子さんへの声かけ。ほめてから、もう1問に誘う
  say: string
  onFinish: () => void
}): LessonSlide {
  return {
    id: 'more',
    section: 'たしかめ',
    title: ANOTHER_PROBLEM_TITLE,
    content: (
      <div className={styles.answer}>
        <TeachingPoints
          collapsible
          note={
            'ここまでできたことを、まずは**ほめましょう**。\n\nお子さんが「やる」と言ったら、次のページへ進んで、ちがう問題をひとりで解いてもらいます。疲れていたり、気持ちがそれていたりしたら、**ここで終わっても大丈夫**です。'
          }
        />
        <SpokenWords>{say}</SpokenWords>
        <SpokenWords title="「もうやめる」と言ったら" minor>
          そっか、じゃあ今日はここまでにしよう。たくさんがんばったね！
        </SpokenWords>
        <button className={styles.endHere} type="button" onClick={onFinish}>
          ここで終わる
        </button>
      </div>
    ),
  }
}
