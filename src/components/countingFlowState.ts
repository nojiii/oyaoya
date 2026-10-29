export const countingPages = ['read', 'line', 'count', 'answer'] as const
export type CountingPage = (typeof countingPages)[number]

export function restoreCountingPage(raw: string | null): CountingPage {
  return countingPages.find((page) => page === raw) ?? 'read'
}

// 子どもに読み上げるセリフ。準備画面の「声かけを先に読んでおく」にも同じ文を出す
export const countingWords = {
  read: '何こ あるかな？ 1こずつ数えてみよう。',
  line: '数えやすいように、1列に並べてみようか。',
  count: '指でさしながら、1こずつ数えてみよう。数えたら、横にずらしてね。',
  answer: '全部で何こだった？',
  confirm: (n: number) =>
    `最後に「${n}」って言ったね。だから、全部で${n}こ。1こずつ、ちゃんと数えられたね！`,
}
