import styles from './TeachingScript.module.css'

// 読み上げるセリフの頭に置く、話している人のアイコン。セリフの1文字目の位置に、文字と同じ大きさで出す。
// スピーカーやマイクだと「押すと音が鳴る・録音する」と受け取られやすいので、横顔と声の形にする（読み上げない）
export function SpeakingIcon() {
  return (
    <svg
      className={styles.speakingIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4.5 21v-3.2C2.9 16.5 2 14.4 2 12c0-4 3-7 7-7 3.3 0 5.4 2.2 5.6 5l1.4 2.6h-1.4v2c0 1.1-.9 2-2 2h-2.1V21" />
      <path d="M18 10.3a2.4 2.4 0 0 1 0 4.6M20.5 8.5a4.6 4.6 0 0 1 0 8" />
    </svg>
  )
}
