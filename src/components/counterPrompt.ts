import type { CounterProblem } from './counterModel'

export function counterPrompt(
  problem: CounterProblem | undefined,
  moved: number,
  total: number,
  showQuestion: boolean,
  apples = false,
  gathered: number[] = [],
) {
  const object = apples ? 'りんご' : 'おはじき'
  // 10までのたし算は、左右のおさらからおはじきを1こずつまん中へ寄せる。
  // gathered は、まん中へ寄せたおはじきの id（左は 0 〜 a−1、右は a 〜 a+b−1）
  if (problem?.mode === 'add') {
    const { a, b } = problem
    if (gathered.length >= a + b)
      return showQuestion
        ? `あわせて ${object}は なんこかな？`
        : 'まん中で ひとつに なったね。'
    const leftDone = gathered.filter((id) => id < a).length === a
    const rightDone = gathered.filter((id) => id >= a).length === b
    // 寄せている途中は、寄せた数を出さない（合わせた数は、お子さんがあとで数える）
    if (gathered.length > 0 && leftDone !== rightDone)
      return `${leftDone ? 'みぎ' : 'ひだり'}の ${object}も、まん中へ よせよう。`
    return `${a}こと ${b}こを、1こずつ まん中へ よせてみよう。`
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
