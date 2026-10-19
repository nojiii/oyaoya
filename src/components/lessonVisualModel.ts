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

export const unitNotebook: Record<string, string[]> = {
  clock: [
    'なんじかな？',
    '短い針 → 時 ／ 長い針 → 分',
    '短い針：3 ／ 長い針：12 → 3時',
  ],
  shape: ['三角形の 辺は いくつ？', '辺を 1本ずつ なぞる', '辺が 3本 → 三角形'],
  figures: [
    '四角形の かどは いくつ？',
    'かどに しるしを つける',
    '1 → 2 → 3 → 4：かどは 4つ',
  ],
  length: [
    'AとB、どちらが ながい？',
    '左の はしを そろえる',
    'Aのほうが ながい',
  ],
  time: [
    '30分は 1時間の どれくらい？',
    '1周 = 60分 = 1時間',
    '半周 = 30分 = 1時間の半分',
  ],
}
