import { useLayoutEffect, useRef, useState } from 'react'
import { anchorOf, sectionName, summary, type GraphNode } from './flowGraph'
import { ChildPreview, OpenControl, type ViewProps } from './FlowParts'
import { HEADINGS, type Action, type Flow, type Phase } from './scriptFlow'
import styles from './FlowMap.module.css'

// 動線の表示（開発用）の形式の1つ「ステップ地図」。
// 横に進み具合（問題 → 解く1… → 確かめ… → おしまい）、縦につまずきの深さ
// （声をかける → ほめる → ヒント1 → … → いっしょに）を取って画面を升目に置き、矢印でつなぐ。
// 「いっしょに解く手順を通ったか」だけが違う同じ画面は、1つの升目にまとめる

interface Cell {
  key: string
  // 升目に出す画面（いちばん短い道で見つけたもの）。「開く」もこの画面を開く
  node: GraphNode
  // その升目にまとめた画面の key（今いる画面・通ってきた画面を見分けるため）
  keys: string[]
  column: number
  // 升目の並び順（場面の順 → 場面の中の何画面目か）
  order: number
}

// 場面の並び順。声をかける → ほめる → ヒント1 → ヒント2 → …（使い切ると、いっしょにやる）
function phaseOrder(phase: Phase) {
  return phase.kind === 'ask'
    ? 0
    : phase.kind === 'praise'
      ? 1
      : 2 + phase.level
}

// 升目に添える場面の名前。ヒントを使い切った後の場面は、最初の画面（「いっしょに やってみよう」）で見分ける
function phaseName(cell: Cell, flow: Flow) {
  const { position } = cell.node
  const { phase } = position
  if (phase.kind === 'hint') {
    const [first] = flow.beatsAt({ ...position, beat: 0 })
    return 'label' in first && first.label === 'いっしょにやる'
      ? 'いっしょに'
      : `ヒント${phase.level + 1}`
  }
  return phase.kind === 'praise' ? 'ほめる' : ''
}

const cellKeyOf = (node: GraphNode) => node.key.replace(/-g$/, '')

function cellsOf(view: ViewProps) {
  const cells = new Map<string, Cell>()
  for (const node of view.graph.nodes.values()) {
    const key = cellKeyOf(node)
    const cell = cells.get(key)
    if (cell) {
      cell.keys.push(node.key)
      if (node.path.length < cell.node.path.length) cell.node = node
    } else
      cells.set(key, {
        key,
        node,
        keys: [node.key],
        column: node.position.turn,
        order: phaseOrder(node.position.phase) * 100 + node.position.beat,
      })
  }
  // 升目どうしの矢印（同じ組み合わせは1本にまとめる）
  const arrows = new Map<string, { from: string; to: string; action: Action }>()
  for (const node of view.graph.nodes.values())
    for (const edge of node.edges) {
      const from = cellKeyOf(node)
      const to = cellKeyOf(view.graph.node(edge.to))
      arrows.set(`${from}>${to}`, { from, to, action: edge.action })
    }
  const columns: Cell[][] = []
  for (const cell of cells.values()) (columns[cell.column] ??= []).push(cell)
  for (const column of columns) column?.sort((a, b) => a.order - b.order)
  return { columns, arrows: [...arrows.values()] }
}

// 矢印の色と線の種類（つぎへ・できた・つまずいた）
const ARROW_STYLES: Record<Action, { stroke: string; dash?: string }> = {
  next: { stroke: 'var(--color-muted)' },
  done: { stroke: 'var(--flow-guide)' },
  stuck: { stroke: 'var(--flow-question)', dash: '5 4' },
  finish: { stroke: 'var(--color-muted)' },
}

interface Box {
  x: number
  y: number
  w: number
  h: number
}

// 2つの升目をつなぐ線。隣の列へは横に、同じ列の下へは縦に、
// 同じ列の上へ戻るとき（ヒントの後に「できた！」など）は右側を回り、
// 列をとばすとき（すぐ答えられて確かめへ、など）は上を回る
function arrowPath(a: Box, b: Box, sameColumn: boolean, skip: boolean) {
  if (sameColumn && b.y > a.y) {
    if (b.y - (a.y + a.h) < 24) return `M${a.x + a.w / 2} ${a.y + a.h}V${b.y}`
    // 間に升目があるときは、左側を回る
    const x = a.x - 10
    return `M${a.x} ${a.y + a.h / 2}C${x} ${a.y + a.h / 2} ${x} ${b.y + b.h / 2} ${b.x} ${b.y + b.h / 2}`
  }
  if (sameColumn) {
    const x = a.x + a.w + 22
    return `M${a.x + a.w} ${a.y + a.h / 2}C${x} ${a.y + a.h / 2} ${x} ${b.y + b.h / 2} ${b.x + b.w} ${b.y + b.h / 2}`
  }
  if (skip) {
    const top = Math.min(a.y, b.y) - 28
    return `M${a.x + a.w / 2} ${a.y}C${a.x + a.w / 2} ${top} ${b.x + b.w / 2} ${top} ${b.x + b.w / 2} ${b.y}`
  }
  const mid = (a.x + a.w + b.x) / 2
  return `M${a.x + a.w} ${a.y + a.h / 2}C${mid} ${a.y + a.h / 2} ${mid} ${b.y + b.h / 2} ${b.x} ${b.y + b.h / 2}`
}

export function FlowMap(view: ViewProps) {
  const { columns, arrows } = cellsOf(view)
  const board = useRef<HTMLDivElement>(null)
  const [boxes, setBoxes] = useState<Map<string, Box>>(new Map())

  // 升目の位置を測って、矢印を引く
  useLayoutEffect(() => {
    const element = board.current
    if (!element) return
    const measure = () => {
      const origin = element.getBoundingClientRect()
      const next = new Map<string, Box>()
      for (const cell of element.querySelectorAll<HTMLElement>('[data-cell]')) {
        const rect = cell.getBoundingClientRect()
        next.set(cell.dataset.cell!, {
          x: rect.left - origin.left,
          y: rect.top - origin.top,
          w: rect.width,
          h: rect.height,
        })
      }
      setBoxes(next)
    }
    measure()
    // 地図全体の大きさが変わらなくても、升目だけが伸び縮みすることがある
    // （「お子さんの画面」の切り替えなど）ので、升目も1つずつ見張る。disconnect で、すべての見張りをやめる
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    for (const cell of element.querySelectorAll('[data-cell]'))
      observer.observe(cell)
    return () => observer.disconnect()
  }, [columns.length])

  const column = (key: string) => Number(key.split('-')[0])

  return (
    <div className={styles.scroller}>
      <div className={styles.board} ref={board}>
        <svg className={styles.arrows} aria-hidden="true">
          <defs>
            {Object.entries(ARROW_STYLES).map(([action, { stroke }]) => (
              <marker
                key={action}
                id={`flow-map-arrow-${action}`}
                viewBox="0 0 8 8"
                refX="7"
                refY="4"
                markerWidth="7"
                markerHeight="7"
                orient="auto"
              >
                <path d="M0 0L8 4L0 8Z" style={{ fill: stroke }} />
              </marker>
            ))}
          </defs>
          {arrows.map(({ from, to, action }) => {
            const a = boxes.get(from)
            const b = boxes.get(to)
            if (!a || !b) return null
            const { stroke, dash } = ARROW_STYLES[action]
            return (
              <path
                key={`${from}>${to}`}
                d={arrowPath(
                  a,
                  b,
                  column(from) === column(to),
                  Math.abs(column(to) - column(from)) > 1,
                )}
                className={styles.arrow}
                style={{ stroke }}
                strokeDasharray={dash}
                markerEnd={`url(#flow-map-arrow-${action})`}
              />
            )
          })}
        </svg>
        {columns.map((cells, i) => (
          <div className={styles.column} key={i}>
            <p className={styles.columnName}>
              {sectionName(view.flow, cells[0].node)}
            </p>
            {cells.map((cell) => (
              <CellView key={cell.key} cell={cell} view={view} />
            ))}
          </div>
        ))}
      </div>
      <p className={styles.legend}>
        矢印：<span style={{ color: 'var(--color-muted)' }}>━ つぎへ</span>{' '}
        <span style={{ color: 'var(--flow-guide)' }}>━ できた・答えられた</span>{' '}
        <span style={{ color: 'var(--flow-question)' }}>
          ┅ つまずいた・むずかしそう
        </span>
        。列をとばす矢印は上を回る
      </p>
    </div>
  )
}

function CellView({ cell, view }: { cell: Cell; view: ViewProps }) {
  const { node } = cell
  const [icon, heading] = HEADINGS[node.beat.kind]
  const current = !!view.current && cell.keys.includes(view.current)
  const trail = cell.keys.some((key) => view.trail?.has(key))
  const name = phaseName(cell, view.flow)
  return (
    <div
      className={styles.cell}
      data-cell={cell.key}
      data-section={node.section}
      data-current={current}
      data-trail={trail}
      id={anchorOf(view.problemId, node.key)}
      title={summary(node.beat)}
    >
      <span className={styles.cellHead}>
        {name && <span className={styles.phase}>{name}</span>}
        {icon} {heading}
      </span>
      <span className={styles.cellText}>{summary(node.beat)}</span>
      <ChildPreview node={node} view={view} />
      <OpenControl className={styles.open} node={node} view={view} />
    </div>
  )
}
