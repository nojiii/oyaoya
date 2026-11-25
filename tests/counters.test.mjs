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
  // 10までのたし算（add）は、おはじきではなく、右のおさらを左へ足す（下のテスト）
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

// 10までのたし算は、左のおさら（はじめのかず）は動かさず、右のおさら（たすかず）をまとまりのまま左へ足す。
// 足したらできあがり。足す前は、できあがりにしない
test('adding within ten completes once the right plate is joined onto the left plate', () => {
  const problem = { mode: 'add', a: 3, b: 4 }
  const pieces = Array.from({ length: 7 }, (_, index) => ({
    id: index,
    green: index >= 3,
    side: index >= 3 ? 'right' : 'left',
  }))
  const completedWith = (joined, counted = []) => {
    const { progressKey } = counterProgress(problem, pieces, [], '', joined)
    return counterProgress(problem, pieces, counted, progressKey, joined)
      .completed
  }
  assert.equal(completedWith(false), false)
  assert.equal(completedWith(true), true)
  // 足したあとに1こずつ数えても、できあがりのまま
  assert.equal(completedWith(true, [0, 4, 2]), true)

  const say = (joined, showQuestion = false) =>
    counterPrompt(problem, Number(joined), 7, showQuestion, false, joined)
  assert.equal(say(false), '3こに 4こを たしてみよう。')
  assert.equal(say(true), 'ひとつに なったね。')
  assert.equal(say(true, true), 'ぜんぶで おはじきは なんこに なったかな？')
  assert.equal(
    counterPrompt(problem, 1, 7, true, true, true),
    'ぜんぶで りんごは なんこに なったかな？',
  )
})
