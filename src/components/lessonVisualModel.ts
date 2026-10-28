import type { CounterProblem } from './counterModel'

export function notebookLines({ mode, a, b }: CounterProblem) {
  if (mode === 'count')
    return [
      'りんごは なんこ？',
      Array.from({ length: a }, (_, i) => i + 1).join(' → '),
      `さいごの かず：${a}`,
      `ぜんぶで ${a}こ`,
    ]
  if (mode === 'times')
    return [
      `${a} × ${b} = ?`,
      `${a}こが ${b}つ分`,
      `${Array.from({ length: b }, () => a).join(' + ')} = ${a * b}`,
      `${a} × ${b} = ${a * b}`,
    ]
  if (mode === 'borrow')
    return [
      `${a} − ${b} = ?`,
      `${a} = 10 + ${a - 10}`,
      `10 − ${b} = ${10 - b}`,
      `${10 - b} + ${a - 10} = ${a - b}`,
    ]
  if (mode === 'sub')
    return [
      `${a} − ${b} = ?`,
      `${a}こから ${b}こ とる`,
      `${a} − ${b} = ${a - b}`,
    ]
  if (a + b >= 10) {
    const need = 10 - a
    return [
      `${a} + ${b} = ?`,
      `${a} + ${need} = 10`,
      `${b} = ${need} + ${b - need}`,
      `${a} + ${need} = 10`,
      `10 + ${b - need} = ${a + b}`,
    ]
  }
  return [
    `${a} + ${b} = ?`,
    `${a}こ と ${b}こ`,
    `あわせて ${a + b}こ`,
    `${a} + ${b} = ${a + b}`,
  ]
}
