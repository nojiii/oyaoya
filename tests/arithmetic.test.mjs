import { test } from 'node:test'
import assert from 'node:assert/strict'
import { arithmetic } from '../src/problems/arithmetic.ts'

test('every carrying pair splits the second number and preserves the total', () => {
  for (let a = 1; a <= 9; a++) {
    for (let b = 1; b <= 9; b++) {
      if (a + b < 10) {
        assert.throws(() => arithmetic('carry', a, b))
        continue
      }
      const model = arithmetic('carry', a, b)
      const need = 10 - a
      const rest = b - need
      assert.equal(model.answer, a + b)
      assert.ok(model.steps.every((step) => step.how && step.avoid.length > 0))
      assert.equal(
        new Set(model.steps.map((step) => step.avoid.join('|'))).size,
        model.steps.length,
      )
      assert.ok(model.steps[0].say.includes(`${a}は、あと${need}で10`))
      assert.ok(model.steps[1].say.includes(`${b}を${need}と${rest}に分け`))
      assert.ok(
        model.steps[3].say.includes(`10に残りの${rest}を足すと${a + b}`),
      )
      assert.ok(rest >= 0)
      assert.equal(10 + rest, a + b)
    }
  }
})

test('borrowing supports every valid pair and recombines the ones', () => {
  for (let a = 11; a <= 19; a++) {
    for (let b = 1; b <= 9; b++) {
      if (b <= a % 10) {
        assert.throws(() => arithmetic('borrow', a, b))
        continue
      }
      const model = arithmetic('borrow', a, b)
      assert.equal(model.answer, a - b)
      assert.ok(model.steps[0].say.includes(`${a}を10と${a % 10}`))
      assert.ok(model.steps[2].say.includes(`${10 - b}と${a % 10}で${a - b}`))
    }
  }
})

test('ordinary arithmetic and zero are calculated from the actual operands', () => {
  assert.equal(arithmetic('add', 3, 4).answer, 7)
  assert.equal(arithmetic('add', 0, 0).answer, 0)
  assert.equal(arithmetic('sub', 8, 8).answer, 0)
  assert.equal(arithmetic('times', 9, 9).answer, 81)
  assert.equal(arithmetic('add', 3, 4).steps.length, 3)
  // 合計がちょうど10でも、10を作る手順にはしない
  assert.equal(arithmetic('add', 6, 4).steps.length, 3)
  assert.equal(arithmetic('add', 0, 10).answer, 10)
})

test('invalid inputs cannot produce a lesson', () => {
  for (const [mode, a, b] of [
    ['carry', 10, 3],
    ['carry', 8, 0],
    ['add', -1, 4],
    ['add', 9, 6],
    ['add', 5, 6],
    ['sub', 3, 8],
    ['borrow', 20, 5],
    ['times', 0, 3],
    ['add', 1.5, 3],
    ['add', NaN, 3],
    ['carry', Infinity, 7],
  ])
    assert.throws(() => arithmetic(mode, a, b))
})
