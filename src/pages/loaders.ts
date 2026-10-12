import { curriculum, type Group } from '../curriculum'
import { problems, type ProblemId } from '../problems'

// ページは curriculum と problems を直接読まず、ここの関数が返すデータだけを使う
// （階層や問題の一覧の形を変えたときに、直す場所をこのファイルに限るため）

export interface PageLink {
  name: string
  url: string
}

function notFound(): never {
  throw new Response('Not Found', { status: 404 })
}

// 同じ段に並ぶ分類を、リンク用の名前とURLにする（parentUrl は1つ上の分類のURL）
function groupLinks(groups: Group[], parentUrl: string): PageLink[] {
  return groups.map((group) => ({
    name: group.name,
    url: `${parentUrl}/${group.slug}`,
  }))
}

function problemLinks(ids: ProblemId[]): PageLink[] {
  return ids.map((id) => ({
    name: problems[id].title,
    url: `/problems/${id}`,
  }))
}

// 上から順にたどった分類を、パンくずリスト用の名前とURLにする
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

// URL（例: math/unit-01-addition-1digit）を上からたどって分類を探す
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
  return {
    name: group.name,
    crumbs,
    groups: groupLinks(siblings, current.url),
    problems: problemLinks(group.problems ?? []),
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

export function loadProblem(id: string) {
  if (!isProblemId(id)) notFound()
  const { title, default: Component } = problems[id]
  return { title, Component, crumbs: toCrumbs(groupsOf(id, curriculum)) }
}
