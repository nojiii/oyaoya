import type { FlowStatus } from './TeachingScript'

// answer のあとの recount・give が「たしかめ」。
// その前の more は、ほめてから、たしかめに進むか、ここで終わるかを決めるページ（ContinueToCheck）
export const countingPages = [
  'read',
  'line',
  'count',
  'answer',
  'more',
  'recount',
  'give',
] as const
export type CountingPage = (typeof countingPages)[number]

// 準備の画面の「わかる」で始めたときのページ。解説をとばして、たしかめの2ページだけにする
export const countingCheckPages = ['recount', 'give'] as const

export interface CountingProgress {
  page: CountingPage
  // 準備の画面の「わかる」で、解説をとばして、たしかめから始めたか
  checkOnly: boolean
}

export const initialCountingProgress: CountingProgress = {
  page: 'read',
  checkOnly: false,
}

export const checkOnlyCountingProgress: CountingProgress = {
  page: 'recount',
  checkOnly: true,
}

// 今の進み具合で並べるページ
export function countingPagesOf(checkOnly: boolean): readonly CountingPage[] {
  return checkOnly ? countingCheckPages : countingPages
}

// 次（delta が 1）・前（-1）のページへ。先がなければ、そのまま
export function moveCounting(
  progress: CountingProgress,
  delta: 1 | -1,
): CountingProgress {
  const pages = countingPagesOf(progress.checkOnly)
  const page = pages[pages.indexOf(progress.page) + delta]
  return page ? { ...progress, page } : progress
}

// たしかめの問題が解けなかったときの「解説にもどる」。問題を読むページ（最初のページ）へ戻る。
// たしかめのページからだけ戻る
export function reviewCounting(progress: CountingProgress): CountingProgress {
  return (countingCheckPages as readonly CountingPage[]).includes(progress.page)
    ? { ...initialCountingProgress }
    : progress
}

export function countingStorageKey(pathname: string) {
  return `counting-flow:v2:${pathname}`
}

function parseCountingProgress(
  raw: string | null,
  n: number,
): CountingProgress | null {
  try {
    const saved = JSON.parse(raw ?? 'null') as {
      n?: unknown
      page?: unknown
      checkOnly?: unknown
    } | null
    // 「わかる」を足す前に保存したもの（checkOnly がない）は、解説から始めたものとして読む
    const checkOnly = saved?.checkOnly === true
    const page = countingPagesOf(checkOnly).find((page) => page === saved?.page)
    // 数を変えたら、続きは使わない
    if (saved?.n === n && page) return { page, checkOnly }
  } catch {
    // 古い形式や壊れた保存内容は使わない。
  }
  return null
}

// 準備の画面で、台本の続きがあるかを決める。最後のページ（たしかめ）まで進んだら、終えたものとして扱う
export function countingFlowStatus(raw: string | null, n: number): FlowStatus {
  const saved = parseCountingProgress(raw, n)
  if (saved?.page === 'give') return 'finished'
  return saved && saved.page !== 'read' ? 'middle' : 'start'
}

// 保存した続きから始める。数を変えたときと、最後のページまで終えたあとは、最初のページから
export function restoreCountingProgress(
  raw: string | null,
  n: number,
): CountingProgress {
  const saved = parseCountingProgress(raw, n)
  return saved && saved.page !== 'give' ? saved : { ...initialCountingProgress }
}

// たしかめで、並べた中から取ってもらう数。全部ではなく、途中で止める数にする（1この時だけは1こ）
export function countingGiveCount(n: number) {
  return Math.ceil(n / 2)
}

// 子どもに読み上げるセリフ
export const countingWords = {
  read: '何こ あるかな？ 調べてみよう。',
  line: '数えやすいように、1列に並べてみようか。',
  count: '指でさしながら、1こずつ数えてみよう。数えたら、手前にずらしてね。',
  answer: '全部で何こだった？',
  // お子さんの答えが合っていても違っていても言えるよう、数そのものは言わない
  confirm: '最後に言った数が、全部の数だよ。1こずつ、ていねいに数えられたね！',
  // たしかめ：数える向きを変えても、全部の数は同じになるか
  recount: 'こんどは、反対のはしから数えてみよう。何こになるかな？',
  recountSame: 'どこから数えても、全部の数は同じだね！',
  recountDifferent: 'あれ？ 1こずつ指でさしながら、もう一回数えてみよう。',
  // 「わかる」で始めたとき。まだ数えていないので、「こんどは」とは言わず、いつもと反対のはしを指さして数えてもらう
  recountFirst: 'こっちのはしから、1こずつ数えてみよう。全部で何こかな？',
  // たしかめ：言われた数だけ取れるか
  give: (m: number) => `この中から、${m}こちょうだい。`,
  given: '1こずつ一緒に数えて、たしかめてみよう。',
}
