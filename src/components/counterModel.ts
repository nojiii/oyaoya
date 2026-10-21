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
  if ((mode === 'carry' || mode === 'add') && a + b >= 10) {
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
