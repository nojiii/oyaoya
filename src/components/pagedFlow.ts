import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import type { FlowStatus } from './TeachingScript'

// ページを順に送る台本（大学祭の問題など）の、進み具合の保存とページ送り。
// pages の最初は問題を読むページ、最後は終わりのページにする。
// 保存するのはページの位置だけ。ほかにも覚えておくこと（選んだ方法など）がある台本は、src/problems/sample のように自分で書く
export function pagedFlow<Page extends string>(
  id: string,
  pages: readonly Page[],
) {
  const first = pages[0]
  const last = pages[pages.length - 1]
  // 進み具合は、同じタブの中で保存する（準備の画面へ戻ると、台本の部品は作り直されるため）
  const storageKey = (pathname: string) => `${id}-flow:v1:${pathname}`

  function readPage(pathname: string): Page | null {
    try {
      const saved = JSON.parse(
        sessionStorage.getItem(storageKey(pathname)) ?? 'null',
      ) as { page?: string } | null
      return pages.find((page) => page === saved?.page) ?? null
    } catch {
      // 読めないときや、古い形式・壊れた保存内容は使わない
      return null
    }
  }

  // 準備の画面で、続きがあるかを決める。最後のページまで進んだら、終えたものとして扱う
  function status(pathname: string): FlowStatus {
    const page = readPage(pathname)
    if (!page || page === first) return 'start'
    return page === last ? 'finished' : 'middle'
  }

  function usePages() {
    const { pathname } = useLocation()
    const [page, setPage] = useState<Page>(() => {
      const saved = readPage(pathname)
      // 最後のページまで終えたあとは、最初から
      return saved && saved !== last ? saved : first
    })
    useEffect(() => {
      try {
        sessionStorage.setItem(storageKey(pathname), JSON.stringify({ page }))
      } catch {
        // 保存できなくても、この画面で学習を続けられる
      }
    }, [pathname, page])
    // 「？」で答えを見たか。ページを送ると、見る前に戻す
    const [revealed, setRevealed] = useState(false)
    const index = pages.indexOf(page)
    const go = (next: Page | undefined) => {
      if (!next) return
      setPage(next)
      setRevealed(false)
    }
    return {
      page,
      revealed,
      reveal: () => setRevealed(true),
      next: () => go(pages[index + 1]),
      back: () => go(pages[index - 1]),
    }
  }

  return { status, usePages }
}
