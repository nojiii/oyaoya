import { TeachingPoints } from './TeachingPoints'
import { SpokenWords } from './SpokenWords'
import type { LessonSlide } from './LessonSlides'
import styles from './AdditionFlow.module.css'

// 【試し】本編の答えのページのあと、たしかめの前に置くページ。解けたことをほめてから、たしかめに進むか、ここで終わるかを決める。
// たしかめに進むときは、ほかのページと同じくスワイプ（「次」）で進み、やめるときは「ここで終わる」で準備の画面へ戻る。
// 「ここで終わる」は最後まで終えたときと同じく、次に台本を開くと最初のページから始まる（onFinish で、保存した進み具合を消す）。
// たしかめの前なので、「たしかめ」の札（section）は付けない
export const ANOTHER_PROBLEM_TITLE = 'たしかめに進みますか？'

export function anotherProblemSlide({
  say,
  onFinish,
}: {
  // お子さんへの声かけ。ほめてから、たしかめ（別の問題）に誘う
  say: string
  onFinish: () => void
}): LessonSlide {
  return {
    id: 'more',
    title: ANOTHER_PROBLEM_TITLE,
    content: (
      <div className={styles.answer}>
        <TeachingPoints
          collapsible
          note={
            'ここまで一緒に解けたことを、まずは**ほめましょう**。\n\nお子さんが「やる」と言ったら、次のページから**たしかめ**に進み、解き方が身についたかを確かめます。疲れていたり、気持ちがそれていたりしたら、**ここで終わっても大丈夫**です。'
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
