import styles from './ScriptPaging.module.css'

// 台本のページを送るボタン。左右へめくるのと同じ操作を、押してもできるようにする。
// ページを分けた台本（LessonSlides）と、分けない台本（TeachingScript）の両方で使う

const icon = (path: string) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={path} />
  </svg>
)

// ページの下の「次」のボタン。次のページの名前と、右向きの矢印を置く。
// ページの中に置いて、めくっている間もページといっしょに動かす。
// 送れないとき（方法を選ぶ前など）も場所は空けておき、送れるようになったら浮かび上がらせる（ページの高さを変えない）。
// primary は、使い方のページの「はじめる」。次のページの名前の代わりに、label だけを大きく出す
export function NextPageButton({
  label,
  hidden = false,
  primary = false,
  onClick,
}: {
  label: string
  hidden?: boolean
  primary?: boolean
  onClick: () => void
}) {
  return (
    <button
      className={styles.next}
      type="button"
      data-hidden={hidden}
      data-primary={primary || undefined}
      onClick={onClick}
    >
      {primary ? (
        <span>{label}</span>
      ) : (
        <span>
          次<b>{label}</b>
        </span>
      )}
      {icon('M5 12h14M13 6l6 6-6 6')}
    </button>
  )
}

// 台本の左右の端に置く、前・次のページへ送るボタン。となりのページが薄くのぞく余白に、矢印だけを出す。
// 送れない向きのボタンは、場所を空けたまま隠す
export function PageEdges({
  canBack,
  canNext,
  onBack,
  onNext,
}: {
  canBack: boolean
  canNext: boolean
  onBack: () => void
  onNext: () => void
}) {
  return (
    <>
      <button
        className={styles.edge}
        type="button"
        data-side="back"
        data-hidden={!canBack}
        aria-label="前のページ"
        onClick={onBack}
      >
        {icon('M15 6l-6 6 6 6')}
      </button>
      <button
        className={styles.edge}
        type="button"
        data-side="next"
        data-hidden={!canNext}
        aria-label="次のページ"
        onClick={onNext}
      >
        {icon('M9 6l6 6-6 6')}
      </button>
    </>
  )
}
