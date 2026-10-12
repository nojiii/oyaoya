import type { ProblemId } from './problems'

// 分類（教科・単元など）。中に分類（children）と問題（problems）を入れられる。
// 入れ子は何段でもよく、一覧には書いた順に並ぶ
export interface Group {
  // URLになる（/<slug>/<slug>/...）。最上位では `problems` は使えない（問題ページのURLと重なるため）
  slug: string
  name: string
  children?: Group[]
  problems?: ProblemId[]
}

// 階層の定義。段を増やす・並べ替える・問題を別の分類へ移すときは、このファイルだけを書き換える
export const curriculum: Group[] = [
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
]
