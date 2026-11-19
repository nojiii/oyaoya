import type { CounterProblem } from './counterModel'

export function counterPrompt(
  problem: CounterProblem | undefined,
  moved: number,
  total: number,
  showQuestion: boolean,
  apples = false,
) {
  const object = apples ? 'りんご' : 'おはじき'
  const subtract = problem?.mode === 'sub' || problem?.mode === 'borrow'
  const add = problem?.mode === 'add' || problem?.mode === 'carry'
  // 繰り上がりのたし算は、左のわくを10こにするところまで動かす
  const carry = problem?.mode === 'carry'
  const target = carry ? 10 - problem.a : add || subtract ? problem.b : total
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
      : add
        ? `あわせて ${object}は なんこかな？`
        : `${object}は ぜんぶで なんこかな？`
  }
  if (moved > 0) return `${moved}こ`
  if (subtract)
    return `${problem.a}この ${object}から ${problem.b}こ とってみよう。`
  if (add)
    return `${problem.a}この ${object}に、みぎから ${problem.b}こ あわせてみよう。`
  return `${object}を ひとつずつ さわって かぞえてみよう。`
}
