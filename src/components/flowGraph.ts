import {
  encodeActions,
  HEADINGS,
  type Action,
  type Beat,
  type Flow,
  type Position,
  type Section,
} from './scriptFlow'

// 動線の表示（開発用）が共通で使う、台本の通りうる画面のつながり。
// 1画面を1つの節にして、待つ画面の反応のボタンで枝分かれする。
// 「おわる」と「← もどる」はどの画面からでも押せるので、つながりには入れない

// 節（1つの画面）
export interface GraphNode {
  key: string
  position: Position
  // いっしょに解く手順を通ったか。同じ画面でも、これでその後の流れが変わるので別の節にする
  visited: boolean
  section: Section
  beat: Beat
  // 最初の画面から、ここまでの操作（いちばん短い道）
  path: Action[]
  // 次の画面への道。待つ画面は2本（反応のボタン）、おしまいは0本、それ以外は1本
  edges: GraphEdge[]
}

export interface GraphEdge {
  action: Action
  // 反応のボタンの文字（待つ画面からの道だけ）
  label?: string
  to: string
}

export function keyOf({ turn, phase, beat }: Position, visited: boolean) {
  const kind = phase.kind === 'hint' ? `hint${phase.level}` : phase.kind
  return `${turn}-${kind}-${beat}${visited ? '-g' : ''}`
}

// 最初の画面から、押せるボタンをすべてたどって、画面のつながりを作る。
// 幅優先でたどるので、どの画面も、いちばん短い道で見つけた節を「親」にする（それ以外の道からは合流）
export function buildGraph(flow: Flow) {
  const nodes = new Map<string, GraphNode>()
  // その画面を最初に見つけた道（`${親のkey}:${操作}`）
  const owners = new Map<string, string>()
  const queue: GraphNode[] = []

  const visit = (
    position: Position,
    visitedBefore: boolean,
    path: Action[],
    owner?: string,
  ) => {
    const section = flow.sectionOf(position.turn)
    const visited = visitedBefore || section === 'guide'
    const key = keyOf(position, visited)
    if (!nodes.has(key)) {
      const beat = flow.beatsAt(position)[position.beat]
      const node = { key, position, visited, section, beat, path, edges: [] }
      nodes.set(key, node)
      if (owner) owners.set(key, owner)
      queue.push(node)
    }
    return key
  }

  const root = visit(flow.START, false, [])
  for (let node = queue.shift(); node; node = queue.shift()) {
    const { beat } = node
    const actions: [Action, string?][] =
      beat.kind === 'wait'
        ? [
            ['done', beat.done],
            ['stuck', beat.stuck],
          ]
        : beat.kind === 'finish'
          ? []
          : [['next']]
    for (const [action, label] of actions) {
      const next = flow.step(node.position, node.visited, action)
      const to = visit(
        next,
        node.visited,
        [...node.path, action],
        `${node.key}:${action}`,
      )
      node.edges.push({ action, label, to })
    }
  }

  // その道が、行き先の画面の「親」からの道か（違えば合流）
  const owns = (from: GraphNode, edge: GraphEdge) =>
    owners.get(edge.to) === `${from.key}:${edge.action}`
  const node = (key: string) => nodes.get(key)!

  return { root, nodes, owns, node }
}

export type Graph = ReturnType<typeof buildGraph>

// 画面の数・合流の数・いちばん短い道で何画面目におしまいか
export function statsOf(graph: Graph) {
  const nodes = [...graph.nodes.values()]
  const merges = nodes.flatMap((node) =>
    node.edges.filter((edge) => !graph.owns(node, edge)),
  ).length
  const shortest = Math.min(
    ...nodes
      .filter((node) => node.section === 'finish')
      .map((node) => node.path.length + 1),
  )
  return { screens: nodes.length, merges, shortest }
}

// 区切りの名前（いっしょに解く手順と確かめは、何番目かも出す）
export function sectionName(flow: Flow, { position, section }: GraphNode) {
  switch (section) {
    case 'question':
      return '問題'
    case 'guide':
      return `解く${position.turn - flow.GUIDE + 1}`
    case 'check':
      return `確かめ${position.turn - flow.CHECK + 1}`
    case 'finish':
      return 'おしまい'
  }
}

// 画面の中身を1行で
export function summary(beat: Beat) {
  const label = 'label' in beat && beat.label ? `［${beat.label}］` : ''
  switch (beat.kind) {
    case 'do':
      return beat.text
    case 'say':
      return `${label}${beat.say}`
    case 'show':
      return beat.say
        ? `${label}見せながら：${beat.say}`
        : '見せて、いっしょに確かめる'
    case 'wait':
      return `${beat.retry ? 'もう一度 ' : ''}めやす：${beat.expect}`
    case 'finish':
      return ''
  }
}

// 画面の短い名前（例：解く1・ほめる・声をかける、確かめ2・待つ）
export function shortName(flow: Flow, node: GraphNode) {
  const { beat } = node
  if (beat.kind === 'finish') return 'おしまい'
  const label = 'label' in beat && beat.label ? `${beat.label}・` : ''
  return `${sectionName(flow, node)}・${label}${HEADINGS[beat.kind][1]}`
}

// その画面から台本を開く URL（開発中だけ、?flow= の操作をたどって始める）
export function openUrl(problemId: string, node: GraphNode) {
  return `/problems/${problemId}?flow=${encodeActions(node.path)}`
}

// 台本で今いる画面と、そこまでに通ってきた画面の key。
// steps は、実際に移った「画面 → 次の画面」の組（`${前のkey}>${次のkey}`）。
// 両端の画面をどちらも通っていても、別々の道で通っただけの線は、通った道にしない
export function trailOf(flow: Flow, history: Position[]) {
  const keys = history.map((position, i) =>
    keyOf(position, flow.visitedGuide(history.slice(0, i + 1))),
  )
  const steps = new Set(keys.slice(1).map((key, i) => `${keys[i]}>${key}`))
  return { current: keys[keys.length - 1], trail: new Set(keys), steps }
}

// 縦に1列に並べるときの行。木の順（親の後に子、待つ画面の後に1本目の枝、その後に2本目の枝）に並べる。
// parent は線を引いてくる元の行
export type Row = {
  parent?: number
  // 枝の最初の行に添える、反応のボタンの文字
  branch?: string
  // つまずいた道（「つまずいた」「むずかしそう」を通ってきた）か
  trouble: boolean
} & (
  | { kind: 'screen'; node: GraphNode }
  // ほかの道で先に出てきた画面への合流
  | { kind: 'merge'; target: GraphNode }
)

export function rowsOf(graph: Graph): Row[] {
  const rows: Row[] = []
  const chain = (
    start: string,
    parent: number | undefined,
    branch: string | undefined,
    trouble: boolean,
  ) => {
    let node = graph.node(start)
    rows.push({ kind: 'screen', node, parent, branch, trouble })
    for (;;) {
      const index = rows.length - 1
      if (node.edges.length === 1) {
        const [edge] = node.edges
        if (!graph.owns(node, edge)) {
          rows.push({
            kind: 'merge',
            target: graph.node(edge.to),
            parent: index,
            trouble,
          })
          return
        }
        node = graph.node(edge.to)
        rows.push({ kind: 'screen', node, parent: index, trouble })
        continue
      }
      for (const edge of node.edges) {
        const hard = trouble || edge.action === 'stuck'
        if (graph.owns(node, edge)) chain(edge.to, index, edge.label, hard)
        else
          rows.push({
            kind: 'merge',
            target: graph.node(edge.to),
            parent: index,
            branch: edge.label,
            trouble: hard,
          })
      }
      return
    }
  }
  chain(graph.root, undefined, undefined, false)
  return rows
}

// 画面の要素に付ける id（合流先へ移るときに使う）
export const anchorOf = (problemId: string, key: string) =>
  `flow-${problemId}-${key}`

// 合流先の画面へ移って、少しのあいだ目立たせる。
// URL の # を変えると、台本を進めている間は「ページを離れますか」の確認が出るので、その場でスクロールする
export function jumpTo(problemId: string, key: string) {
  const target = document.getElementById(anchorOf(problemId, key))
  if (!target) return
  target.scrollIntoView({ block: 'center', behavior: 'smooth' })
  target.animate(
    [
      { outline: '3px solid var(--color-accent)' },
      { outline: '3px solid transparent' },
    ],
    { duration: 1600 },
  )
}
