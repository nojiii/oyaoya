// 一覧の行の右端に置く矢印（押せる行だけに出す。じゅんび中の行では index.css で隠す）
export function RowArrow() {
  return (
    <span className="row-arrow" aria-hidden="true">
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m9 6 6 6-6 6" />
      </svg>
    </span>
  )
}
