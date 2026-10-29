import { curriculum, festivalCurriculum, TAGS, type Group } from '../curriculum'
import { problems, type ProblemId } from '../problems'
import { FESTIVAL_URL } from './festival'
import { redirect } from 'react-router'

// ページは curriculum と problems を直接読まず、ここの関数が返すデータだけを使う
// （階層や問題の一覧の形を変えたときに、直す場所をこのファイルに限るため）

export interface PageLink {
  name: string
  url: string
}

// 一覧に並べる分類。count はその中（下の段も含む）にある問題の数。
// tag の index は、タグの色分けに使う番号
export interface GroupLink extends PageLink {
  count: number
  tag?: { name: string; index: number }
}

function notFound(): never {
  throw new Response('Not Found', { status: 404 })
}

// 分類の中（下の段も含む）にある問題の数
export function countProblems(group: Group): number {
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
function groupLinks(
  groups: Group[],
  parentUrl: string,
  base: string,
): GroupLink[] {
  return groups.map((group) => ({
    name: group.name,
    url:
      !group.children?.length && group.problems?.length === 1
        ? `${base}/problems/${group.problems[0]}`
        : `${parentUrl}/${group.slug}`,
    count: countProblems(group),
    tag: group.tag && { name: group.tag, index: TAGS.indexOf(group.tag) },
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
  return { groups: groupLinks(tree, base, base) }
}

// URL（例: grade-1/math/addition-within-10）を上からたどって分類を探す
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
  // 教材が1つの単元は、問題一覧を挟まず準備画面を表示する。
  const onlyProblem =
    siblings.length === 0 && group.problems?.length === 1
      ? group.problems[0]
      : undefined
  const lesson = onlyProblem
    ? { id: onlyProblem, Component: problems[onlyProblem].default }
    : null
  return {
    lesson,
    name: group.name,
    // 一番上の段で何番目の分類の中にいるか（ページの色分けに使う）
    rootIndex: tree.indexOf(groups[0]),
    crumbs,
    groups: groupLinks(siblings, current.url, base),
    problems: problemLinks(group.problems ?? [], base),
  }
}

// その問題が置かれている分類を上から順に返す（どこにも置かれていなければ空）
export function loadGroupPage(path: string, festival: boolean) {
  const data = loadGroup(path, festival)
  if (data.lesson)
    return redirect(
      `${festival ? FESTIVAL_URL : ''}/problems/${data.lesson.id}`,
    )
  return data
}

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
  const groups = groupsOf(id, tree)
  const rootIndex = Math.max(0, tree.indexOf(groups[0]))
  // 教材へ直接進む単元は、戻り先を1つ上の単元選択画面にする。
  const parent = groups.at(-1)
  if (!parent?.children?.length && parent?.problems?.length === 1) groups.pop()
  return { title, Component, rootIndex, crumbs: toCrumbs(groups, base) }
}
