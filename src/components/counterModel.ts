import type { ArithmeticMode } from '../problems/arithmetic'

export interface CounterProblem {
  mode: ArithmeticMode | 'count'
  a: number
  b: number
}

export function counterGroups({ mode, a, b }: CounterProblem, step: number) {
  if (mode === 'count') return [{ label: 'かぞえてみよう', count: a }]
  if (mode === 'times')
    return Array.from({ length: b }, (_, i) => ({
      label: `${i + 1}つめ`,
      count: a,
    }))
  if (mode === 'borrow') {
    if (step < 1) return [{ label: 'ぜんぶ', count: a }]
    if (step < 2)
      return [
        { label: '10のまとまり', count: 10 },
        { label: 'のこしておく', count: a - 10 },
      ]
    if (step < 3)
      return [
        { label: '10からとったのこり', count: 10 - b },
        { label: 'とったぶん', count: b, removed: true },
        { label: 'のこしておいたぶん', count: a - 10 },
      ]
    return [{ label: 'あわせたのこり', count: a - b }]
  }
  if (mode === 'sub')
    return step < 2
      ? [{ label: 'ぜんぶ', count: a }]
      : [
          { label: 'のこり', count: a - b },
          { label: 'とったぶん', count: b, removed: true },
        ]
  if (mode === 'carry') {
    const need = 10 - a
    if (step < 2)
      return [
        { label: '10にするかず', count: a },
        { label: 'たすかず', count: b },
      ]
    if (step === 2)
      return [
        { label: '10にするかず', count: a },
        { label: '10をつくるぶん', count: need },
        { label: 'のこり', count: b - need },
      ]
    return [
      { label: '10のまとまり', count: 10 },
      { label: 'のこり', count: b - need },
    ]
  }
  return step < 2
    ? [
        { label: 'はじめのかず', count: a },
        { label: 'たすかず', count: b },
      ]
    : [{ label: 'あわせたかず', count: a + b }]
}

// おはじきの画面で、どこまで動かしたか。completed（できた）は、動かし終えてから少し待ち、
// その並びを questionKey に覚えてから true にする（VisualPlayground が progressKey を渡す）
export function counterProgress(
  problem: CounterProblem | undefined,
  pieces: { green: boolean; side: 'left' | 'right' }[],
  countedIds: number[],
  questionKey: string,
) {
  const addition = problem?.mode === 'add' || problem?.mode === 'carry'
  const subtraction = problem?.mode === 'sub' || problem?.mode === 'borrow'
  const split = addition || subtraction
  const orangeCount = pieces.filter((piece) => piece.side === 'left').length
  const greenCount = pieces.length - orangeCount
  const moved = subtraction
    ? greenCount
    : addition
      ? pieces.filter((piece) => piece.green && piece.side === 'left').length
      : countedIds.length
  const targetCount = split ? problem.b : pieces.length
  const progressKey = `${problem?.mode}-${problem?.a}-${problem?.b}-${moved}-${pieces.map((piece) => piece.side).join(',')}-${countedIds.join(',')}`
  const wrongSide =
    addition && pieces.some((piece) => !piece.green && piece.side === 'right')
  const completed =
    split && !wrongSide && moved === targetCount && questionKey === progressKey
  return {
    addition,
    subtraction,
    split,
    orangeCount,
    greenCount,
    moved,
    targetCount,
    progressKey,
    wrongSide,
    completed,
  }
}
