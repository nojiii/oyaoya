import type { FlowStatus } from './TeachingScript'

export const countingPages = ['read', 'line', 'count', 'answer'] as const
export type CountingPage = (typeof countingPages)[number]

export function countingStorageKey(pathname: string) {
  return `counting-flow:v2:${pathname}`
}

function parseCountingProgress(raw: string | null, n: number) {
  try {
    const saved = JSON.parse(raw ?? 'null') as {
      n?: unknown
      page?: unknown
    } | null
    const page = countingPages.find((page) => page === saved?.page)
    // 数を変えたら、続きは使わない
    if (saved?.n === n && page) return page
  } catch {
    // 古い形式や壊れた保存内容は使わない。
  }
  return null
}

// 準備の画面で、台本の続きがあるかを決める。答えのページまで進んだら、終えたものとして扱う
export function countingFlowStatus(raw: string | null, n: number): FlowStatus {
  const page = parseCountingProgress(raw, n)
  if (page === 'answer') return 'finished'
  return page && page !== 'read' ? 'middle' : 'start'
}

// 保存した続きから始める。数を変えたときと、最後のページまで終えたあとは、最初のページから
export function restoreCountingPage(
  raw: string | null,
  n: number,
): CountingPage {
  const page = parseCountingProgress(raw, n)
  return page && page !== 'answer' ? page : 'read'
}

// 子どもに読み上げるセリフ。準備画面の「声かけを先に読んでおく」にも同じ文を出す
export const countingWords = {
  read: '何こ あるかな？ 調べてみよう。',
  line: '数えやすいように、1列に並べてみようか。',
  count: '指でさしながら、1こずつ数えてみよう。数えたら、手前にずらしてね。',
  answer: '全部で何こだった？',
  // お子さんの答えが合っていても違っていても言えるよう、数そのものは言わない
  confirm: '最後に言った数が、全部の数だよ。1こずつ、ていねいに数えられたね！',
}
