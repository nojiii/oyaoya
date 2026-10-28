import type { ComponentType } from 'react'
import { lesson } from './unit-lessons'

// 問題のフォルダ（index.tsx）が export するもの
interface ProblemModule {
  title: string
  default: ComponentType
}

// 問題の一覧。キーが問題IDで、そのままURL（/problems/<問題ID>）になる。
// 公開後にIDを変えるとURLが変わるので、変えない。
// 追加するときはアルファベット順の位置に1行足す（同時に追加した人との衝突を減らすため）
export const problems = {
  'addition-meaning': lesson('addition-meaning'),
} satisfies Record<string, ProblemModule>

export type ProblemId = keyof typeof problems
