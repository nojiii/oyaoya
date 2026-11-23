import { TeachingPoints } from './TeachingPoints'
import { SpokenWords } from './SpokenWords'
import { CONTINUE_TO_CHECK_WORDS } from './continueToCheckWords'
import { useScriptControls } from './scriptControls'
import styles from './AdditionFlow.module.css'

// 本編の答えのページのあと、たしかめの前に置くページの本文。がんばったことをほめてから、たしかめに進むか、ここで終わるかを決める。
// たしかめに進むときは、ほかのページと同じくスワイプ（「次」）で進み、やめるときは「ここで終わる」で準備の画面へ戻る。
// 「ここで終わる」は最後まで終えたときと同じく、次に台本を開くと最初のページから始まる（storageKey の進み具合を消す）。
// ページは id を 'more'、見出しを CONTINUE_TO_CHECK_TITLE にする。たしかめの前なので、「たしかめ」の札（section）は付けない
export function ContinueToCheck({ storageKey }: { storageKey: string }) {
  const { finish } = useScriptControls()
  const end = () =>
    finish({
      // 幕で隠れている間に、保存した進み具合を消す
      reset: () => {
        try {
          sessionStorage.removeItem(storageKey)
        } catch {
          // 消せなくても、準備の画面へは戻れる
        }
      },
    })
  return (
    <div className={styles.answer}>
      <TeachingPoints
        collapsible
        note={
          'ここまで一緒にがんばったことを、まずは**ほめましょう**。\n\nお子さんが「やる」と言ったら、次のページから**たしかめ**に進み、解き方が身についたかを確かめます。疲れていたり、気持ちがそれていたりしたら、**ここで終わっても大丈夫**です。'
        }
      />
      <SpokenWords>{CONTINUE_TO_CHECK_WORDS}</SpokenWords>
      <SpokenWords title="「もうやめる」と言ったら" minor>
        そっか、じゃあ今日はここまでにしよう。たくさんがんばったね！
      </SpokenWords>
      <button className={styles.endHere} type="button" onClick={end}>
        ここで終わる
      </button>
    </div>
  )
}
