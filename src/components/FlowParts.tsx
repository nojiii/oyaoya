import { openUrl, type Graph, type GraphNode } from './flowGraph'
import type { Flow } from './scriptFlow'
import styles from './FlowParts.module.css'

// 動線の表示（開発用）の、どの形式でも使う部品

export interface ViewProps {
  graph: Graph
  flow: Flow
  problemId: string
  // 台本の横に出すときだけ：今いる画面と、通ってきた画面（key）
  current?: string
  trail?: Set<string>
  // 台本の横に出すときだけ：画面を押したら、台本をその画面へ移す
  onSelect?: (node: GraphNode) => void
  // 見せる画面の節に、お子さんに見せる画面を縮小して出すか
  previews?: boolean
}

// お子さんに見せる画面を、縮小して出す（見せる画面の節だけ）。中身は、実際に見せる画面と同じもの
export function ChildPreview({
  node,
  view,
}: {
  node: GraphNode
  view: ViewProps
}) {
  if (!view.previews || node.beat.kind !== 'show') return null
  return (
    // 読み上げでは、節の文（見せながら：… など）で伝わるので、縮小した画面は読まない
    <div className={styles.preview} aria-hidden="true">
      <div className={styles.previewContent}>{node.beat.content}</div>
    </div>
  )
}

// その画面を開く操作。台本の横に出しているときは、押すと台本がその画面へ移る。
// 動線一覧では、別のタブで台本を開く
export function OpenControl({
  node,
  view,
  className,
}: {
  node: GraphNode
  view: ViewProps
  className?: string
}) {
  const { onSelect } = view
  return onSelect ? (
    <button className={className} type="button" onClick={() => onSelect(node)}>
      ここへ
    </button>
  ) : (
    <a
      className={className}
      href={openUrl(view.problemId, node)}
      target="_blank"
      rel="noreferrer"
    >
      開く
    </a>
  )
}
