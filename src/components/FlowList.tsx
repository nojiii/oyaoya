import {
  anchorOf,
  jumpTo,
  shortName,
  sectionName,
  summary,
  type GraphNode,
} from './flowGraph'
import { ChildPreview, OpenControl, type ViewProps } from './FlowParts'
import { HEADINGS } from './scriptFlow'
import styles from './FlowList.module.css'

// 動線の表示（開発用）の形式の1つ「木のリスト」。
// 分かれ道のない画面は縦に並べ、待つ画面で枝分かれして字下げする

function Screen({ node, view }: { node: GraphNode; view: ViewProps }) {
  const [icon, heading] = HEADINGS[node.beat.kind]
  return (
    <li
      className={styles.screen}
      id={anchorOf(view.problemId, node.key)}
      data-section={node.section}
      data-current={view.current === node.key}
      data-trail={view.trail?.has(node.key) ?? false}
    >
      {/* 最初の画面から、いちばん短い道で何画面目か */}
      <span className={styles.number}>{node.path.length + 1}</span>
      <span>
        <span className={styles.section}>{sectionName(view.flow, node)}</span>{' '}
        <span className={styles.heading}>
          {icon} {heading}
        </span>{' '}
        <span className={styles.text}>{summary(node.beat)}</span>
      </span>
      <OpenControl className={styles.open} node={node} view={view} />
      {/* 文の下（2列目）に出す */}
      <div className={styles.preview}>
        <ChildPreview node={node} view={view} />
      </div>
    </li>
  )
}

// ほかの道で先に展開した画面へ合流する
function Merge({ to, view }: { to: string; view: ViewProps }) {
  const node = view.graph.node(to)
  return (
    <li className={styles.merge}>
      →{' '}
      <button
        className={styles.jump}
        type="button"
        onClick={() => jumpTo(view.problemId, to)}
      >
        {node.path.length + 1}「{shortName(view.flow, node)}」
      </button>{' '}
      へ合流
    </li>
  )
}

function Chain({ start, view }: { start: string; view: ViewProps }) {
  const { graph } = view
  const items = []
  for (let key: string | undefined = start; key;) {
    const node = graph.node(key)
    items.push(<Screen node={node} view={view} key={node.key} />)
    key = undefined

    if (node.edges.length === 1) {
      const [edge] = node.edges
      if (graph.owns(node, edge)) key = edge.to
      else items.push(<Merge to={edge.to} view={view} key="merge" />)
    } else if (node.edges.length > 1) {
      items.push(
        <li key="branches">
          <ul className={styles.branches}>
            {node.edges.map((edge) => (
              <li key={edge.action}>
                <p className={styles.branchLabel}>{edge.label}</p>
                {graph.owns(node, edge) ? (
                  <Chain start={edge.to} view={view} />
                ) : (
                  <ol className={styles.chain}>
                    <Merge to={edge.to} view={view} />
                  </ol>
                )}
              </li>
            ))}
          </ul>
        </li>,
      )
    }
  }
  return <ol className={styles.chain}>{items}</ol>
}

export function FlowList(view: ViewProps) {
  return (
    <div className={styles.list}>
      <Chain start={view.graph.root} view={view} />
    </div>
  )
}
