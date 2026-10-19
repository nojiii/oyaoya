import { createContext } from 'react'

// 動線一覧（開発用）で問題を描くときに渡す。これがあると、TeachingScript は台本の代わりに動線の木を描く
export const FlowTreeContext = createContext<{ problemId: string } | null>(null)
