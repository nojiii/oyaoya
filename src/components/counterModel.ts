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

// 10までのたし算で、まん中へ寄せたおさら
export type CounterSide = 'left' | 'right'

// おはじきの画面で、どこまで動かしたか。completed（できた）は、動かし終えてから少し待ち、
// その並びを questionKey に覚えてから true にする（VisualPlayground が progressKey を渡す）。
// gathered は、10までのたし算で、まん中へ寄せ終えたおさら
export function counterProgress(
  problem: CounterProblem | undefined,
  pieces: { green: boolean; side: 'left' | 'right' }[],
  countedIds: number[],
  questionKey: string,
  gathered: CounterSide[] = [],
) {
  const addition = problem?.mode === 'add' || problem?.mode === 'carry'
  // 繰り上がりのたし算は、全部を1か所に集めるのではなく、左のわくを10こにしたらできあがり
  const carry = problem?.mode === 'carry'
  // 10までのたし算は、片方にもう片方を足さず、2つのおさらを両方まん中へ寄せて1つにまとめる（台本と同じ）
  const gather = problem?.mode === 'add'
  const subtraction = problem?.mode === 'sub' || problem?.mode === 'borrow'
  const split = addition || subtraction
  const orangeCount = pieces.filter((piece) => piece.side === 'left').length
  const greenCount = pieces.length - orangeCount
  const moved = gather
    ? gathered.length
    : subtraction
      ? greenCount
      : carry
        ? pieces.filter((piece) => piece.green && piece.side === 'left').length
        : countedIds.length
  // 動かす数。寄せるときは、おさら2つ。繰り上がりでは、左のわくを10こにする分（10 − 最初の数）
  const targetCount = gather
    ? 2
    : carry
      ? 10 - problem.a
      : split
        ? problem.b
        : pieces.length
  // 寄せたあとに1こずつ数えても、できあがりのままにする（数えた跡は、2つに分ける画面では並びに入れない）
  const progressKey = `${problem?.mode}-${problem?.a}-${problem?.b}-${moved}-${[...gathered].sort().join(',')}-${pieces.map((piece) => piece.side).join(',')}-${split ? '' : countedIds.join(',')}`
  const wrongSide =
    carry && pieces.some((piece) => !piece.green && piece.side === 'right')
  const completed =
    split && !wrongSide && moved === targetCount && questionKey === progressKey
  return {
    addition,
    carry,
    gather,
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
