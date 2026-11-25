import styles from './AdditionFlow.module.css'

// たしかめのページに置く「解説にもどる」。たしかめの問題が解けなかったときに押し、
// 問題を読むページ（台本の最初のページ）へ戻って、元の問題を一緒に解き直す
export function ReviewButton({ onClick }: { onClick: () => void }) {
  return (
    <button className={styles.review} type="button" onClick={onClick}>
      解説にもどる
    </button>
  )
}
