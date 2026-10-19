import { useEffect, useRef, useState, type ReactNode } from 'react'
import { buildGraph, statsOf, trailOf, type GraphNode } from './flowGraph'
import { FlowList } from './FlowList'
import { FlowMap } from './FlowMap'
import { FlowRail } from './FlowRail'
import type { ViewProps } from './FlowParts'
import { createFlow, type Position, type Script } from './scriptFlow'
import styles from './FlowViews.module.css'

// 動線の表示（開発中だけ）。台本の通りうる画面を、いくつかの形式で切り替えて見られる。
// 動線一覧（/debug）と、台本の横（?debug=true）の両方で使う。
// 本番のビルドに含めないよう、使う側は開発中だけ読み込む

const FORMATS = [
  ['rail', '路線図'],
  ['map', 'ステップ地図'],
  ['list', '木のリスト'],
] as const
type Format = (typeof FORMATS)[number][0]

// 選んだ形式と、お子さんの画面を出すかは、次に開いたときも使う
// （読めない環境では、いつも路線図・お子さんの画面あり から）
const STORAGE_KEY = 'oyaoya-flow-format'
const PREVIEWS_KEY = 'oyaoya-flow-previews'
function savedFormat(): Format {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return FORMATS.find(([id]) => id === saved)?.[0] ?? 'rail'
  } catch {
    return 'rail'
  }
}
function savedPreviews() {
  try {
    return localStorage.getItem(PREVIEWS_KEY) !== 'off'
  } catch {
    return true
  }
}
function save(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // 保存できなくても、この画面では切り替わる
  }
}

export default function FlowViews({
  script,
  problemId,
  history,
  onSelect,
  extra,
}: {
  script: Script
  problemId: string
  // 台本の横に出すときだけ：台本で通ってきた位置（はじめる前なら無い）と、画面を押したときの動き
  history?: Position[]
  onSelect?: (node: GraphNode) => void
  // 形式のボタンの並びの横に出すもの（台本の横に出すときの「一覧で見る」など）
  extra?: ReactNode
}) {
  const [format, setFormat] = useState(savedFormat)
  const [previews, setPreviews] = useState(savedPreviews)
  const root = useRef<HTMLDivElement>(null)
  const flow = createFlow(script)
  const graph = buildGraph(flow)
  const { screens, merges, shortest } = statsOf(graph)
  const { current, trail } = history
    ? trailOf(flow, history)
    : { current: undefined, trail: undefined }
  const view: ViewProps = {
    graph,
    flow,
    problemId,
    current,
    trail,
    onSelect,
    previews,
  }

  const choose = (next: Format) => {
    setFormat(next)
    save(STORAGE_KEY, next)
  }
  const togglePreviews = () => {
    setPreviews(!previews)
    save(PREVIEWS_KEY, previews ? 'off' : 'on')
  }

  // 台本が進んだら、今いる画面が見えるところまでスクロールする
  useEffect(() => {
    root.current
      ?.querySelector('[data-current="true"]')
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [current, format])

  return (
    // data-flow-tree は、動線一覧のページが「台本を使っている問題か」を見分けるのに使う
    <div className={styles.views} ref={root} data-flow-tree>
      <div className={styles.bar}>
        <div className={styles.formats} role="group" aria-label="表示の形式">
          {FORMATS.map(([id, name]) => (
            <button
              key={id}
              type="button"
              aria-pressed={format === id}
              onClick={() => choose(id)}
            >
              {name}
            </button>
          ))}
        </div>
        {/* 見せる画面の節に、お子さんに見せる画面を縮小して出すか */}
        <div className={styles.formats}>
          <button
            type="button"
            aria-pressed={previews}
            onClick={togglePreviews}
          >
            📱 お子さんの画面
          </button>
        </div>
        <p className={styles.stats}>
          画面 {screens}（合流 {merges}）・いちばん短い道で {shortest}{' '}
          画面目におしまい
        </p>
        {extra}
      </div>
      {format === 'rail' && <FlowRail {...view} />}
      {format === 'map' && <FlowMap {...view} />}
      {format === 'list' && <FlowList {...view} />}
    </div>
  )
}
