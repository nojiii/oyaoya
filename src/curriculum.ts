import type { ProblemId } from './problems'

// 単元に付けるタグ。一覧の行に出す。並び順が色の順番になる（index.css の [data-tag] と合わせる）
export const TAGS = [
  '数の理解',
  'たし算・ひき算',
  '形・図形',
  '長さ・広さ・かさ・時計',
] as const
export type Tag = (typeof TAGS)[number]

// 分類（学年・教科・単元など）。中に分類（children）と問題（problems）を入れられる。
// 入れ子は何段でもよく、一覧には書いた順に並ぶ
export interface Group {
  // URLになる（/<slug>/<slug>/...）。最上位では `problems` と `festival` は使えない
  // （問題ページ・大学祭モードのURLと重なるため）
  slug: string
  name: string
  tag?: Tag
  children?: Group[]
  problems?: ProblemId[]
}

// 単元。問題がまだないものは problems を省くと、一覧で「じゅんび中」になる。
// 問題を作るときは、slug と同じ問題IDにし、name を units.ts の title とそろえる（npm test が確かめる）
function unit(
  tag: Tag,
  slug: string,
  name: string,
  problems?: ProblemId[],
): Group {
  return { slug, name, tag, problems }
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
          unit('数の理解', 'matching-groups', '同じ仲間を見つけよう'),
          unit('数の理解', 'counting', '数を正しく数えよう'),
          unit('数の理解', 'numbers-to-10', '0から10までの数'),
          unit('数の理解', 'order-and-position', '何番目？ どこにある？'),
          unit('数の理解', 'comparing-numbers', '数の大きさと順番'),
          unit('数の理解', 'splitting-numbers', '数を2つに分けよう'),
          unit('数の理解', 'numbers-to-20', '20までの数'),
          unit('数の理解', 'tens-and-ones', '10のまとまりと位'),
          unit('数の理解', 'numbers-to-100', '100までの数とその続き'),
          unit(
            '数の理解',
            'grouping-and-sharing',
            'まとめて数える・同じずつ分ける',
          ),
          unit('たし算・ひき算', 'addition-meaning', 'たし算ってなに？'),
          unit('たし算・ひき算', 'subtraction-meaning', 'ひき算ってなに？'),
          unit(
            'たし算・ひき算',
            'equations-and-pictures',
            '式と絵をつなげよう',
          ),
          unit('たし算・ひき算', 'addition-within-10', '10までのたし算', [
            'addition-within-10',
          ]),
          unit('たし算・ひき算', 'subtraction-within-10', '10までのひき算'),
          unit('たし算・ひき算', 'three-numbers', '3つの数を計算しよう'),
          unit(
            'たし算・ひき算',
            'addition-making-ten',
            '10をつくって、たし算する',
          ),
          unit(
            'たし算・ひき算',
            'subtraction-using-ten',
            '10を使って、ひき算する',
          ),
          unit('たし算・ひき算', 'calculation-within-20', '20までの簡単な計算'),
          unit(
            'たし算・ひき算',
            'calculation-with-tens',
            '大きな数の簡単な計算',
          ),
          unit(
            'たし算・ひき算',
            'word-problems',
            'たす？ ひく？ 文章題を考えよう',
          ),
          unit('形・図形', 'finding-shapes', '身の回りの形を見つけよう'),
          unit('形・図形', 'combining-shapes', '形を組み合わせよう'),
          unit('形・図形', 'moving-shapes', '形を動かして考えよう'),
          unit('長さ・広さ・かさ・時計', 'comparing-length', '長さを比べよう'),
          unit('長さ・広さ・かさ・時計', 'comparing-area', '広さを比べよう'),
          unit('長さ・広さ・かさ・時計', 'comparing-volume', 'かさを比べよう'),
          unit('長さ・広さ・かさ・時計', 'clock-hours', '何時？ 何時半？'),
          unit('長さ・広さ・かさ・時計', 'clock-minutes', '何時何分？'),
        ],
      },
    ],
  },
  { slug: 'grade-2', name: '小学2年生' },
]

// 大学祭モード（/festival 以下）の階層。大学祭用の問題はこちらにだけ置く。書き方は curriculum と同じ。
// 一番上の段は3段階の難易度
export const festivalCurriculum: Group[] = [
  { slug: 'easy', name: 'かんたん' },
  { slug: 'normal', name: 'ふつう' },
  { slug: 'hard', name: 'むずかしい' },
]
