import { useLayoutEffect, useRef, useState } from 'react'
import {
  anchorOf,
  jumpTo,
  rowsOf,
  sectionName,
  shortName,
  summary,
  type Row,
} from './flowGraph'
import { ChildPreview, OpenControl, type ViewProps } from './FlowParts'
import { HEADINGS, type Section } from './scriptFlow'
import styles from './FlowRail.module.css'

// 動線の表示（開発用）の形式の1つ「路線図」。
// 1画面を1つの駅にして縦の線でつなぎ、待つ画面（分岐駅）で線路を分ける。
// 線の色は区切り、薄い線は「つまずいた」「むずかしそう」を通ってきた道

// 線路1本ぶんの幅と、いちばん左の線路の位置（px）
const LANE = 16
const LEFT = 10
// 線路を移るときのカーブの高さ（px）
const CURVE = 22

const laneX = (lane: number) => LEFT + lane * LANE
const color = (section: Section) => `var(--flow-${section})`

function sectionOfRow(row: Row) {
  return row.kind === 'screen' ? row.node.section : row.target.section
}

// 駅の印。画面の種類で形を変える（待つ画面は分岐駅、おしまいは終点）
function Station({
  row,
  x,
  y,
  current,
  trail,
}: {
  row: Row
  x: number
  y: number
  current: boolean
  trail: boolean
}) {
  const stroke = color(sectionOfRow(row))
  const fill = trail ? stroke : 'var(--color-bg)'
  let mark
  if (row.kind === 'merge') {
    // 合流：線の先に矢印を付けて、行き先の名前へつなぐ
    mark = (
      <path
        d={`M${x - 4} ${y - 5}L${x + 4} ${y}L${x - 4} ${y + 5}Z`}
        style={{ fill: stroke }}
      />
    )
  } else
    switch (row.node.beat.kind) {
      case 'wait':
        mark = <circle cx={x} cy={y} r={6.5} style={{ fill: stroke }} />
        break
      case 'show':
        mark = (
          <rect
            x={x - 5}
            y={y - 5}
            width={10}
            height={10}
            rx={2}
            style={{ fill, stroke, strokeWidth: 3 }}
          />
        )
        break
      case 'finish':
        mark = (
          <>
            <circle cx={x} cy={y} r={7} style={{ fill: stroke }} />
            <circle cx={x} cy={y} r={2.5} style={{ fill: 'var(--color-bg)' }} />
          </>
        )
        break
      default:
        mark = (
          <circle
            cx={x}
            cy={y}
            r={4.5}
            style={{ fill, stroke, strokeWidth: 3 }}
          />
        )
    }
  return (
    <g opacity={row.trouble && !trail ? 0.55 : 1}>
      {current && (
        <circle
          cx={x}
          cy={y}
          r={11}
          className={styles.here}
          style={{ stroke: 'var(--color-accent)' }}
        />
      )}
      {mark}
    </g>
  )
}

// 線路の割り当て。本線はまっすぐ下へ通し、待つ画面の2本目の枝（「むずかしそう」など）だけ、
// 空いている線路へ出て、1本目の枝の駅の横を並走し、枝の最初の駅で元の線路へ戻る。
// lane はその行の駅がある線路、bypass は並走に使う線路（並走しない行は無い）
function tracksOf(rows: Row[]) {
  const lane: number[] = []
  const bypass: (number | undefined)[] = []
  // 線路ごとの、使っている行の範囲
  const used: [number, number][][] = []
  const free = (track: number, from: number, to: number) =>
    !(used[track] ?? []).some(([a, b]) => a <= to && b >= from)
  const use = (track: number, from: number, to: number) =>
    (used[track] ??= []).push([from, to])

  rows.forEach((row, i) => {
    if (row.parent === undefined) {
      lane[i] = 0
      use(0, i, i)
      return
    }
    const base = lane[row.parent]
    lane[i] = base
    if (i === row.parent + 1) {
      // すぐ下の行へは、まっすぐ下りる
      use(base, row.parent, i)
      return
    }
    // 間の行（1本目の枝）をよけて、空いている線路を並走する
    let track = base + 1
    while (!free(track, row.parent, i)) track++
    bypass[i] = track
    use(track, row.parent, i)
    use(base, i, i)
  })
  return {
    lane,
    bypass,
    lanes: Math.max(...lane, ...Array.from(bypass, (b) => b ?? 0)) + 1,
  }
}

export function FlowRail(view: ViewProps) {
  const rows = rowsOf(view.graph)
  const { lane, bypass, lanes } = tracksOf(rows)
  const list = useRef<HTMLOListElement>(null)
  // 各行の駅の高さ（文字の1行目に合わせる）と、全体の高さ。文字の折り返しで変わるので、描いた後に測る
  const [layout, setLayout] = useState({ ys: [] as number[], height: 0 })

  useLayoutEffect(() => {
    const element = list.current
    if (!element) return
    const measure = () => {
      const items = [...element.children] as HTMLElement[]
      setLayout({
        ys: items.map(
          (item) => item.offsetTop + Math.min(item.offsetHeight / 2, 13),
        ),
        height: element.offsetHeight,
      })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [rows.length])

  const { ys, height } = layout
  const width = laneX(lanes - 1) + LANE
  const measured = ys.length === rows.length
  const keyOfRow = (row: Row) =>
    row.kind === 'screen' ? row.node.key : `merge-${row.target.key}`

  return (
    <div className={styles.rail}>
      {measured && (
        <svg
          className={styles.lines}
          width={width}
          height={height}
          aria-hidden="true"
        >
          {/* 線路。すぐ下の駅へはまっすぐ、並走するときは横の線路へ出て、下りてから戻る */}
          {rows.map((row, i) => {
            if (row.parent === undefined) return null
            const parent = rows[row.parent]
            const x = laneX(lane[i])
            const [y1, y2] = [ys[row.parent], ys[i]]
            const side = bypass[i]
            let d = `M${x} ${y1}V${y2}`
            if (side !== undefined) {
              const xs = laneX(side)
              const bend = Math.min(CURVE, (y2 - y1) / 2)
              d =
                `M${x} ${y1}C${x} ${y1 + bend / 2} ${xs} ${y1 + bend / 2} ${xs} ${y1 + bend}` +
                `V${y2 - bend}C${xs} ${y2 - bend / 2} ${x} ${y2 - bend / 2} ${x} ${y2}`
            }
            const onTrail =
              view.trail?.has(keyOfRow(parent)) && view.trail.has(keyOfRow(row))
            return (
              <path
                key={i}
                d={d}
                className={styles.track}
                style={{ stroke: color(sectionOfRow(row)) }}
                opacity={row.trouble && !onTrail ? 0.35 : 1}
                strokeWidth={onTrail ? 6 : 4}
              />
            )
          })}
          {rows.map((row, i) => (
            <Station
              key={i}
              row={row}
              x={laneX(lane[i])}
              y={ys[i]}
              current={row.kind === 'screen' && view.current === row.node.key}
              trail={row.kind === 'screen' && !!view.trail?.has(row.node.key)}
            />
          ))}
        </svg>
      )}
      <ol className={styles.rows} ref={list} style={{ paddingLeft: width + 6 }}>
        {rows.map((row, i) => (
          <RowText key={i} row={row} view={view} />
        ))}
      </ol>
    </div>
  )
}

// 駅の右に出す文字（駅名にあたる）
function RowText({ row, view }: { row: Row; view: ViewProps }) {
  const branch = row.branch && (
    <span className={styles.branch}>{row.branch}</span>
  )
  if (row.kind === 'merge')
    return (
      <li className={styles.row} data-trouble={row.trouble}>
        {branch}
        <span className={styles.merge}>
          →{' '}
          <button
            className={styles.jump}
            type="button"
            onClick={() => jumpTo(view.problemId, row.target.key)}
          >
            {row.target.path.length + 1}「{shortName(view.flow, row.target)}」
          </button>{' '}
          へ合流
        </span>
      </li>
    )

  const { node } = row
  const [icon, heading] = HEADINGS[node.beat.kind]
  return (
    <li
      className={styles.row}
      id={anchorOf(view.problemId, node.key)}
      data-current={view.current === node.key}
      data-trouble={row.trouble}
    >
      {branch}
      <span className={styles.number}>{node.path.length + 1}</span>{' '}
      <span className={styles.section} style={{ color: color(node.section) }}>
        {sectionName(view.flow, node)}
      </span>{' '}
      <span className={styles.heading}>
        {icon} {heading}
      </span>{' '}
      <span className={styles.text}>{summary(node.beat)}</span>{' '}
      <OpenControl className={styles.open} node={node} view={view} />
      <ChildPreview node={node} view={view} />
    </li>
  )
}
