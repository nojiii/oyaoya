import type { ProblemId } from './problems'
import units from './problems/unit-lessons/units.json'

const unitIds = new Set<string>(units.map((unit) => unit.id))
function isUnitId(id: string): id is ProblemId {
  return unitIds.has(id)
}
function lessonGroups(grade: number): Group[] {
  return units
    .filter((unit) => unit.grades.includes(grade))
    .map((unit) => ({
      slug: unit.id,
      name: unit.title,
      problems: isUnitId(unit.id) ? [unit.id] : [],
    }))
}

// 分類（学年・教科・単元など）。中に分類（children）と問題（problems）を入れられる。
// 入れ子は何段でもよく、一覧には書いた順に並ぶ
export interface Group {
  // URLになる（/<slug>/<slug>/...）。最上位では `problems` と `festival` は使えない
  // （問題ページ・大学祭モードのURLと重なるため）
  slug: string
  name: string
  children?: Group[]
  problems?: ProblemId[]
}

// 階層の定義。段を増やす・並べ替える・問題を別の分類へ移すときは、このファイルだけを書き換える。
// 一番上の段は学年で、その下に教科・単元を置く
export const curriculum: Group[] = [
  {
    slug: 'grade-1',
    name: '小学1年生',
    children: [
      {
        slug: 'math',
        name: '算数',
        children: [
          ...lessonGroups(1),
          {
            slug: 'unit-01-addition-1digit',
            name: 'たし算(1けたの数)',
            problems: ['addition-apples'],
          },
          {
            slug: 'unit-02-addition-carry',
            name: 'くり上がりのたしざん',
            problems: ['addition-carry'],
          },
        ],
      },
    ],
  },
  {
    slug: 'grade-2',
    name: '小学2年生',
    children: [
      {
        slug: 'math',
        name: '算数',
        children: [
          ...lessonGroups(2),
          {
            slug: 'unit-02-addition-carry',
            name: 'くり上がりのたしざん',
            problems: ['addition-carry'],
          },
        ],
      },
    ],
  },
  { slug: 'grade-3', name: '小学3年生' },
  { slug: 'grade-4', name: '小学4年生' },
  { slug: 'grade-5', name: '小学5年生' },
  { slug: 'grade-6', name: '小学6年生' },
]

// 大学祭モード（/festival 以下）の階層。大学祭用の問題はこちらにだけ置く。書き方は curriculum と同じ。
// 一番上の段は3段階の難易度
export const festivalCurriculum: Group[] = [
  { slug: 'easy', name: 'かんたん' },
  { slug: 'normal', name: 'ふつう' },
  { slug: 'hard', name: 'むずかしい' },
]
