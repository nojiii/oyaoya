import type { CounterProblem } from './counterModel'

export function counterPrompt(
  problem: CounterProblem | undefined,
  moved: number,
  total: number,
  showQuestion: boolean,
  apples = false,
  joined = false,
) {
  const object = apples ? 'りんご' : 'おはじき'
  // 10までのたし算は、左のおさらは動かさず、右のおさらをまとまりのまま左へ足して1つにする
  if (problem?.mode === 'add') {
    if (joined)
      return showQuestion
        ? `ぜんぶで ${object}は なんこに なったかな？`
        : 'ひとつに なったね。'
    return `${problem.a}こに ${problem.b}こを たしてみよう。`
  }
  const subtract = problem?.mode === 'sub' || problem?.mode === 'borrow'
  // 繰り上がりのたし算は、左のわくを10こにするところまで動かす
  const carry = problem?.mode === 'carry'
  const target = carry ? 10 - problem.a : subtract ? problem.b : total
  if (moved > target) return `${moved - target}こ、もどしてみよう。`
  if (carry) {
    if (moved === target && showQuestion)
      return `ひだりに 10こ みぎには ${problem.a + problem.b - 10}こ、あわせて なんこかな？`
    if (moved > 0) return `${moved}こ`
    return `みぎの ${object}を うごかして 10この かたまりを つくってみよう。`
  }
  if (moved === target && showQuestion) {
    return subtract
      ? `のこった ${object}は なんこかな？`
      : `${object}は ぜんぶで なんこかな？`
  }
  if (moved > 0) return `${moved}こ`
  if (subtract)
    return `${problem.a}この ${object}から ${problem.b}こ とってみよう。`
  return `${object}を ひとつずつ さわって かぞえてみよう。`
}
