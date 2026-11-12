import { curriculum, TAGS, type Group } from '../curriculum'
import { problems, type ProblemId } from '../problems'
import { redirect } from 'react-router'

// ページは curriculum と problems を直接読まず、ここの関数が返すデータだけを使う
// （階層や問題の一覧の形を変えたときに、直す場所をこのファイルに限るため）

export interface PageLink {
  name: string
  url: string
}

// 一覧に並べる分類。count はその中（下の段も含む）にある問題の数。
// tag の index は、TAGS の中での順番
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

// 同じ段に並ぶ分類を、リンク用の名前とURLにする（parentUrl は1つ上の分類のURL）
function groupLinks(groups: Group[], parentUrl: string): GroupLink[] {
  return groups.map((group) => ({
    name: group.name,
    url:
      !group.children?.length && group.problems?.length === 1
        ? `/problems/${group.problems[0]}`
        : `${parentUrl}/${group.slug}`,
    count: countProblems(group),
    tag: group.tag && { name: group.tag, index: TAGS.indexOf(group.tag) },
  }))
}

function problemLinks(ids: ProblemId[]): PageLink[] {
  return ids.map((id) => ({
    name: problems[id].title,
    url: `/problems/${id}`,
  }))
}

// 上から順にたどった分類を、戻り先と見出しのラベル用の名前とURLにする
function toCrumbs(groups: Group[]): PageLink[] {
  let url = ''
  return groups.map((group) => {
    url = `${url}/${group.slug}`
    return { name: group.name, url }
  })
}

export function loadHome() {
  return { groups: groupLinks(curriculum, '') }
}

// URL（例: grade-1/math/addition-within-10）を上からたどって分類を探す
export function loadGroup(path: string) {
  const groups: Group[] = []
  let siblings = curriculum
  for (const slug of path.split('/').filter(Boolean)) {
    const group = siblings.find((g) => g.slug === slug) ?? notFound()
    groups.push(group)
    siblings = group.children ?? []
  }
  const crumbs = toCrumbs(groups)
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
    crumbs,
    groups: groupLinks(siblings, current.url),
    problems: problemLinks(group.problems ?? []),
  }
}

// その問題が置かれている分類を上から順に返す（どこにも置かれていなければ空）
export function loadGroupPage(path: string) {
  const data = loadGroup(path)
  if (data.lesson) return redirect(`/problems/${data.lesson.id}`)
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

export function loadProblem(id: string) {
  if (!isProblemId(id)) notFound()
  const { title, default: Component } = problems[id]
  const groups = groupsOf(id, curriculum)
  // 教材へ直接進む単元は、戻り先を1つ上の単元選択画面にする。
  const parent = groups.at(-1)
  if (!parent?.children?.length && parent?.problems?.length === 1) groups.pop()
  return { title, Component, crumbs: toCrumbs(groups) }
}
