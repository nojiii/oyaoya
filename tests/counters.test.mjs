import { test } from 'vitest'
import assert from 'node:assert/strict'
import {
  counterGroups,
  counterProgress,
} from '../src/components/counterModel.ts'
import { counterPrompt } from '../src/components/counterPrompt.ts'

test('carrying preserves every bead while splitting and making ten', () => {
  for (let a = 1; a <= 9; a++)
    for (let b = 1; b <= 9; b++) {
      if (a + b < 10) continue
      for (let step = 0; step <= 4; step++) {
        const groups = counterGroups({ mode: 'carry', a, b }, step)
        assert.equal(
          groups.reduce((sum, group) => sum + group.count, 0),
          a + b,
        )
        assert.ok(groups.every((group) => group.count >= 0))
        if (step >= 3) assert.equal(groups[0].count, 10)
        if (step === 2) assert.equal(groups[1].count, 10 - a)
      }
    }
})

test('borrowing shows the remainder without losing the reserved ones', () => {
  const problem = { mode: 'borrow', a: 13, b: 5 }
  assert.deepEqual(
    counterGroups(problem, 1).map((group) => group.count),
    [10, 3],
  )
  const taken = counterGroups(problem, 2)
  assert.equal(
    taken
      .filter((group) => !group.removed)
      .reduce((sum, group) => sum + group.count, 0),
    8,
  )
  assert.equal(counterGroups(problem, 3)[0].count, 8)
})

test('ordinary operations show the correct amounts, including zero', () => {
  assert.deepEqual(
    counterGroups({ mode: 'add', a: 3, b: 4 }, 2).map((group) => group.count),
    [7],
  )
  assert.equal(counterGroups({ mode: 'sub', a: 8, b: 8 }, 2)[0].count, 0)
  const groups = counterGroups({ mode: 'times', a: 2, b: 3 }, 1)
  assert.equal(groups.length, 3)
  assert.ok(groups.every((group) => group.count === 2))
  assert.equal(counterGroups({ mode: 'count', a: 5, b: 0 }, 0)[0].count, 5)
})

test('counter results appear only after completion and disappear on undo or reset', () => {
  // questionKey は、動かし終えてから少し待って覚えた並び。最初は空
  const check = (problem, pieces, questionKey = '') =>
    counterProgress(problem, pieces, [], questionKey)
  // 10までのたし算（add）は、おはじきを1こずつまん中のおさらへ寄せる（下のテスト）
  for (const mode of ['carry', 'sub', 'borrow']) {
    const addition = mode === 'add' || mode === 'carry'
    const problem = {
      mode,
      a: mode === 'carry' ? 8 : mode === 'borrow' ? 12 : addition ? 3 : 7,
      b: 4,
    }
    const initial = Array.from(
      { length: addition ? problem.a + problem.b : problem.a },
      (_, index) => ({
        id: index,
        green: addition && index >= problem.a,
        side: addition && index >= problem.a ? 'right' : 'left',
      }),
    )
    assert.equal(check(problem, initial).completed, false, mode + ': initial')
    // 繰り上がりは、左のわくが10こになったらできあがり（右の残りは動かさない）
    const finished = initial.map((piece, index) => ({
      ...piece,
      side:
        mode === 'carry'
          ? index < 10
            ? 'left'
            : 'right'
          : addition
            ? 'left'
            : index < 4
              ? 'right'
              : 'left',
    }))
    const key = check(problem, finished).progressKey
    assert.equal(
      check(problem, finished).completed,
      false,
      mode + ': wait for completion feedback',
    )
    assert.equal(
      check(problem, finished, key).completed,
      true,
      mode + ': complete',
    )
    const undone = finished.map((piece, index) => ({
      ...piece,
      side:
        index === (addition ? problem.a : 0)
          ? addition
            ? 'right'
            : 'left'
          : piece.side,
    }))
    assert.equal(check(problem, undone, key).completed, false, mode + ': undo')
    assert.equal(check(problem, initial).completed, false, mode + ': reset')
    if (addition) {
      const incorrect = finished.map((piece, index) => ({
        ...piece,
        side: index === 0 ? 'right' : piece.side,
      }))
      const incorrectKey = check(problem, incorrect).progressKey
      assert.equal(
        check(problem, incorrect, incorrectKey).completed,
        false,
        mode + ': original group must stay on the left',
      )
    }
  }
})

// 繰り上がりのたし算（10をつくって、たし算する）は、全部を1か所に集めるのではなく、
// 左のわくを10こにした時点でできあがりにし、10と残りを合わせる問いに変える
test('carrying completes when the left frame holds ten, not when everything is gathered', () => {
  const problem = { mode: 'carry', a: 8, b: 5 }
  const place = (leftGreens) =>
    Array.from({ length: 13 }, (_, index) => ({
      id: index,
      green: index >= 8,
      side: index < 8 + leftGreens ? 'left' : 'right',
    }))
  const completedWith = (leftGreens) => {
    const pieces = place(leftGreens)
    const { progressKey } = counterProgress(problem, pieces, [], '')
    return counterProgress(problem, pieces, [], progressKey).completed
  }
  assert.equal(completedWith(1), false)
  assert.equal(completedWith(2), true, 'left frame reaches ten')
  assert.equal(completedWith(5), false, 'gathering everything overshoots ten')

  assert.equal(
    counterPrompt(problem, 0, 13, false),
    'みぎの おはじきを うごかして 10この かたまりを つくってみよう。',
  )
  assert.equal(counterPrompt(problem, 1, 13, false), '1こ')
  assert.equal(
    counterPrompt(problem, 2, 13, true),
    'ひだりに 10こ みぎには 3こ、あわせて なんこかな？',
  )
  assert.equal(counterPrompt(problem, 4, 13, false), '2こ、もどしてみよう。')
})

// 10までのたし算は、片方にもう片方を足さない。左右のおさらからおはじきを1こずつまん中へ寄せ、
// 全部がまん中に着いたらできあがり。片方のおさらだけや、1こ残ったままでは、できあがりにしない
test('adding within ten completes only after every piece is gathered into the middle plate', () => {
  const problem = { mode: 'add', a: 3, b: 4 }
  const pieces = Array.from({ length: 7 }, (_, index) => ({
    id: index,
    green: index >= 3,
    side: index >= 3 ? 'right' : 'left',
  }))
  // gathered は、まん中へ寄せたおはじきの id（左は 0〜2、右は 3〜6）
  const completedWith = (gathered, counted = []) => {
    const { progressKey } = counterProgress(problem, pieces, [], '', gathered)
    return counterProgress(problem, pieces, counted, progressKey, gathered)
      .completed
  }
  assert.equal(completedWith([]), false)
  assert.equal(completedWith([0, 1, 2]), false, 'one plate is not enough')
  assert.equal(completedWith([3, 4, 5, 6]), false, 'one plate is not enough')
  assert.equal(completedWith([0, 3, 1, 4, 2, 5]), false, 'one piece is left')
  assert.equal(completedWith([3, 0, 4, 1, 5, 2, 6]), true)
  // 寄せたあとに1こずつ数えても、できあがりのまま
  assert.equal(completedWith([0, 1, 2, 3, 4, 5, 6], [0, 4, 2]), true)

  const say = (gathered, showQuestion = false) =>
    counterPrompt(problem, gathered.length, 7, showQuestion, false, gathered)
  const start = '3こと 4こを、1こずつ まん中へ よせてみよう。'
  assert.equal(say([]), start)
  // 寄せている途中は、寄せた数を出さない（合わせた数は、お子さんがあとで数える）
  assert.equal(say([0, 4]), start)
  assert.equal(say([0, 1, 2]), 'みぎの おはじきも、まん中へ よせよう。')
  assert.equal(say([3, 1, 4, 5, 6]), 'ひだりの おはじきも、まん中へ よせよう。')
  assert.equal(say([0, 1, 2, 3, 4, 5, 6]), 'まん中で ひとつに なったね。')
  assert.equal(
    say([0, 1, 2, 3, 4, 5, 6], true),
    'あわせて おはじきは なんこかな？',
  )
  // 「みぎから あわせる」（片方に足す）案内は、出さない
  assert.ok(
    ![[], [0], [0, 1, 2], [3, 4, 5, 6]].some((g) =>
      say(g).includes('みぎから'),
    ),
  )
})
