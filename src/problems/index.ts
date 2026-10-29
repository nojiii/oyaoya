import type { ComponentType } from 'react'
import { lesson } from './unit-lessons'

// 新しく作る文化祭用の画面ファイルをインポートする（ファイルの作成場所に合わせてパスを変えてください）
import MathEasy1 from './MathEasy1'
import MathHard1 from './MathHard1'
import PuzzleEasy1 from './PuzzleEasy1'
import PuzzleHard1 from './PuzzleHard1'

interface ProblemModule {
  title: string
  default: ComponentType
}

export const problems = {
  'addition-within-10': lesson('addition-within-10'),

  // アルファベット順の位置に新しい問題を追加
  'math-easy-1': { title: '数学 易しい 第1問', default: MathEasy1 },
  'math-hard-1': { title: '数学 難しい 第1問', default: MathHard1 },
  'puzzle-easy-1': { title: '謎解き 易しい 第1問', default: PuzzleEasy1 },
  'puzzle-hard-1': { title: '謎解き 難しい 第1問', default: PuzzleHard1 },
} satisfies Record<string, ProblemModule>

export type ProblemId = keyof typeof problems
