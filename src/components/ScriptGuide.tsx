import styles from './ScriptGuide.module.css'
import { NextPageButton } from './ScriptPaging'
import { SpeakingIcon } from './SpeakingIcon'

// 使い方のページの中身。台本のほかのページと同じく、ステージ → 見出し → 本文 → ボタン の順に置く。
// 「はじめる」（onStart）は、左へめくるのと同じく、台本の最初のページへ進む。
// 見出しは、ページを送ったときにフォーカスを移せるよう、ページの直下に置く。
// ステージやセリフの位置は台本によって違う（図がセリフの下にある台本もある）ので、上・下とは書かない
export function ScriptGuideSlide({ onStart }: { onStart: () => void }) {
  return (
    <>
      {/* 小さな台本が、指で左へめくられる動きをくり返す */}
      <div className={styles.stage} aria-hidden="true">
        <div className={styles.phone}>
          <div className={styles.pages}>
            <MiniPage />
            <MiniPage />
          </div>
        </div>
        <span className={styles.finger} />
      </div>
      <h2 className={styles.title} tabIndex={-1}>
        左へめくって、
        <br />
        はじめましょう
      </h2>
      <ul className={styles.legend}>
        <li>
          <span className={styles.icon} aria-hidden="true">
            <i className={styles.stageIcon} />
          </span>
          <span>白い面の図は、お子さんと一緒に見ます</span>
        </li>
        <li>
          <span className={styles.icon} aria-hidden="true">
            <SpeakingIcon />
          </span>
          <span>
            大きな文字のセリフを、そのまま読み上げます
            <small>教え方のポイントは、押すとたためます</small>
          </span>
        </li>
        <li>
          <span className={styles.icon} aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="17" cy="12" r="3" fill="currentColor" stroke="none" />
              <path d="M12 12H3M6 9l-3 3 3 3" />
            </svg>
          </span>
          <span>
            左へめくるか「次」を押すと、次のページへ進みます
            <small>右へめくると、前のページにもどります</small>
          </span>
        </li>
      </ul>
      <NextPageButton label="はじめる" primary onClick={onStart} />
    </>
  )
}

function MiniPage() {
  return (
    <div className={styles.page}>
      <i />
      <b />
      <b />
      <b />
    </div>
  )
}
