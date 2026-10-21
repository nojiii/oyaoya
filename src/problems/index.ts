import type { ComponentType } from 'react'
import * as additionApples from './addition-apples'
import * as additionCarry from './addition-carry'
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
  'addition-apples': additionApples,
  'addition-basic': lesson('addition-basic'),
  'addition-carry': additionCarry,
  'clock-reading': lesson('clock-reading'),
  'counting-to-10': lesson('counting-to-10'),
  'length-compare': lesson('length-compare'),
  'multiplication-basic': lesson('multiplication-basic'),
  'shape-corners': lesson('shape-corners'),
  'shape-sides': lesson('shape-sides'),
  'subtraction-basic': lesson('subtraction-basic'),
  'subtraction-borrow': lesson('subtraction-borrow'),
  'time-duration': lesson('time-duration'),
} satisfies Record<string, ProblemModule>

export type ProblemId = keyof typeof problems
