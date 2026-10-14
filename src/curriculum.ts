import type { ProblemId } from './problems'

// 分類（学年・教科・単元など）。中に分類（children）と問題（problems）を入れられる。
// 入れ子は何段でもよく、一覧には書いた順に並ぶ
export interface Group {
  // URLになる（/<slug>/<slug>/...）。最上位では `problems` は使えない（問題ページのURLと重なるため）
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
          {
            slug: 'unit-01-addition-1digit',
            name: 'たし算(1けたの数)',
            problems: ['addition-apples'],
          },
        ],
      },
    ],
  },
  { slug: 'grade-2', name: '小学2年生' },
  { slug: 'grade-3', name: '小学3年生' },
  { slug: 'grade-4', name: '小学4年生' },
  { slug: 'grade-5', name: '小学5年生' },
  { slug: 'grade-6', name: '小学6年生' },
]
