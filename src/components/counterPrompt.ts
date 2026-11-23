import type { CounterProblem, CounterSide } from './counterModel'

export function counterPrompt(
  problem: CounterProblem | undefined,
  moved: number,
  total: number,
  showQuestion: boolean,
  apples = false,
  gathered: CounterSide[] = [],
) {
  const object = apples ? 'りんご' : 'おはじき'
  // 10までのたし算は、2つのおさらを両方まん中へ寄せる（台本の「両手で一緒にまん中へ寄せる」と同じ）
  if (problem?.mode === 'add') {
    if (gathered.length >= 2)
      return showQuestion
        ? `あわせて ${object}は なんこかな？`
        : 'まん中で ひとつに なったね。'
    if (gathered.length === 1)
      return `${gathered[0] === 'left' ? 'みぎ' : 'ひだり'}の ${object}も、まん中へ よせよう。`
    return `${problem.a}こと ${problem.b}こを、まん中へ よせてみよう。`
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
