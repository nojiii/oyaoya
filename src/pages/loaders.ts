import { curriculum, type Group } from '../curriculum'
import { problems, type ProblemId } from '../problems'

export interface Crumb {
  name: string
  url: string
}

function notFound(): never {
  throw new Response('Not Found', { status: 404 })
}

// 上から順に並んだ分類を、パンくずリスト用の名前とURLにする
function toCrumbs(groups: Group[]): Crumb[] {
  return groups.map((group, i) => ({
    name: group.name,
    url: `/${groups
      .slice(0, i + 1)
      .map((g) => g.slug)
      .join('/')}`,
  }))
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
  return { group: groups[groups.length - 1], url: current.url, crumbs }
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
