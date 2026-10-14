import type { ReactNode } from 'react'
import { Link, useViewTransitionState } from 'react-router'

// 色分けに使う色の数（index.css の [data-tone] と合わせる）
export const TONE_COUNT = 6

interface Props {
  to: string
  className: string
  // 中身がまだない項目。リンクにせず、押せない見た目にする
  empty?: boolean
  children: ReactNode
}

// 一覧に並べる項目のリンク。
// 押すと、中の .item-name（項目の名前）が次のページの見出しへ移動していくように見せる
export function ItemLink({ to, className, empty, children }: Props) {
  // このリンク先との間でページを切り替えている最中かどうか（戻るときも true になる）
  const moving = useViewTransitionState(to)

  if (empty) {
    return (
      <span className={className} data-empty>
        {children}
      </span>
    )
  }
  return (
    <Link className={className} to={to} viewTransition data-moving={moving}>
      {children}
    </Link>
  )
}
