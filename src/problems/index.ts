import type { ComponentType } from 'react'
import { lesson } from './unit-lessons'

// 新しく作る問題の画面ファイルをインポートする（ファイルの作成場所に合わせてパスを変えてください）
import * as sample from './sample'

interface ProblemModule {
  title: string
  default: ComponentType
}

export const problems = {
  'addition-making-ten': lesson('addition-making-ten'),
  'addition-within-10': lesson('addition-within-10'),
  counting: lesson('counting'),
  'subtraction-within-10': lesson('subtraction-within-10'),

  // アルファベット順の位置に新しい問題を追加
  // 台本とデザインの見本。一覧（curriculum.ts）には置かない
  sample,
} satisfies Record<string, ProblemModule>

export type ProblemId = keyof typeof problems
