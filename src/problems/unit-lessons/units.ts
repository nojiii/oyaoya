import type { ArithmeticMode } from '../arithmetic'

// 単元ごとに1つの問題を置く教材の一覧。id が問題IDで、そのままURL（/problems/<id>）になる。
// 公開後は id を変えない（URLが変わるため）
type Unit = {
  id: string
  title: string
} & (
  | {
      // 計算の単元。問題の文と台本は数字から作るので、計算の種類と最初に出す数字だけを書く
      arithmetic: { mode: ArithmeticMode; initial: readonly [number, number] }
    }
  | {
      // 数える単元。最初に出す、数える数（1〜10）だけを書く
      counting: { initial: number }
    }
)

export const units = [
  {
    id: 'counting',
    title: '数を正しく数えよう',
    counting: { initial: 5 },
  },
  {
    id: 'addition-within-10',
    title: '10までのたし算',
    arithmetic: { mode: 'add', initial: [3, 4] },
  },
] as const satisfies readonly Unit[]

export type UnitId = (typeof units)[number]['id']
