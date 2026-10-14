import { curriculum, festivalCurriculum, type Group } from '../curriculum'
import { problems, type ProblemId } from '../problems'
import { FESTIVAL_URL } from './festival'

// ページは curriculum と problems を直接読まず、ここの関数が返すデータだけを使う
// （階層や問題の一覧の形を変えたときに、直す場所をこのファイルに限るため）

export interface PageLink {
  name: string
  url: string
}

// 一覧に並べる分類。count はその中（下の段も含む）にある問題の数
export interface GroupLink extends PageLink {
  count: number
}

function notFound(): never {
  throw new Response('Not Found', { status: 404 })
}

function countProblems(group: Group): number {
  const own = group.problems?.length ?? 0
  return (group.children ?? []).reduce(
    (sum, child) => sum + countProblems(child),
    own,
  )
}

// モードごとの違い。base はURLの先頭に付くパス、tree はそのモードで使う階層
function modeOf(festival: boolean) {
  return festival
    ? { base: FESTIVAL_URL, tree: festivalCurriculum }
    : { base: '', tree: curriculum }
}

// 同じ段に並ぶ分類を、リンク用の名前とURLにする（parentUrl は1つ上の分類のURL）
function groupLinks(groups: Group[], parentUrl: string): GroupLink[] {
  return groups.map((group) => ({
    name: group.name,
    url: `${parentUrl}/${group.slug}`,
    count: countProblems(group),
  }))
}

function problemLinks(ids: ProblemId[], base: string): PageLink[] {
  return ids.map((id) => ({
    name: problems[id].title,
    url: `${base}/problems/${id}`,
  }))
}

// 上から順にたどった分類を、パンくずリスト用の名前とURLにする
function toCrumbs(groups: Group[], base: string): PageLink[] {
  let url = base
  return groups.map((group) => {
    url = `${url}/${group.slug}`
    return { name: group.name, url }
  })
}

export function loadHome(festival: boolean) {
  const { base, tree } = modeOf(festival)
  return { groups: groupLinks(tree, base) }
}

// URL（例: math/unit-01-addition-1digit）を上からたどって分類を探す
export function loadGroup(path: string, festival: boolean) {
  const { base, tree } = modeOf(festival)
  const groups: Group[] = []
  let siblings = tree
  for (const slug of path.split('/').filter(Boolean)) {
    const group = siblings.find((g) => g.slug === slug) ?? notFound()
    groups.push(group)
    siblings = group.children ?? []
  }
  const crumbs = toCrumbs(groups, base)
  const current = crumbs.pop() ?? notFound()
  const group = groups[groups.length - 1]
  return {
    name: group.name,
    // 一番上の段で何番目の分類の中にいるか（ページの色分けに使う）
    rootIndex: tree.indexOf(groups[0]),
    crumbs,
    groups: groupLinks(siblings, current.url),
    problems: problemLinks(group.problems ?? [], base),
  }
}

// その問題が置かれている分類を上から順に返す（どこにも置かれていなければ空）
function groupsOf(id: ProblemId, groups: Group[]): Group[] {
  for (const group of groups) {
    if (group.problems?.includes(id)) return [group]
    const rest = groupsOf(id, group.children ?? [])
    if (rest.length > 0) return [group, ...rest]
  }
  return []
}

function isProblemId(id: string): id is ProblemId {
  return Object.hasOwn(problems, id)
}

export function loadProblem(id: string, festival: boolean) {
  if (!isProblemId(id)) notFound()
  const { base, tree } = modeOf(festival)
  const { title, default: Component } = problems[id]
  return { title, Component, crumbs: toCrumbs(groupsOf(id, tree), base) }
}
