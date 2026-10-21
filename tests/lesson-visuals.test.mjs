import { test } from 'node:test'
import assert from 'node:assert/strict'
import { arithmetic } from '../src/problems/arithmetic.ts'
import {
  notebookLines,
  unitNotebook,
} from '../src/components/lessonVisualModel.ts'

test('notebook carrying calculations follow every valid input pair', () => {
  for (let a = 1; a <= 9; a++)
    for (let b = 1; b <= 9; b++) {
      if (a + b < 10) continue
      const lines = notebookLines({ mode: 'carry', a, b })
      assert.equal(lines[1], `${a} + ${10 - a} = 10`)
      assert.equal(lines[2], `${b} = ${10 - a} + ${b - (10 - a)}`)
      assert.equal(lines.at(-1), `10 + ${a + b - 10} = ${a + b}`)
      assert.equal(lines.length, arithmetic('carry', a, b).steps.length + 1)
    }
})

test('each arithmetic notebook has one new line per teaching step', () => {
  for (const [mode, a, b] of [
    ['add', 3, 4],
    ['add', 0, 0],
    ['sub', 8, 3],
    ['sub', 8, 8],
    ['borrow', 13, 5],
    ['times', 2, 3],
  ]) {
    const model = arithmetic(mode, a, b)
    const lines = notebookLines({ mode, a, b })
    assert.equal(lines.length, model.steps.length + 1)
    assert.ok(lines.at(-1).endsWith(String(model.answer)))
  }
})

test('other units have problem and teaching diagrams with notebook steps', () => {
  for (const id of [
    'clock-reading',
    'shape-sides',
    'shape-corners',
    'length-compare',
    'time-duration',
  ]) {
    assert.equal(unitNotebook[id].length, 3)
    assert.ok(unitNotebook[id].every(Boolean))
  }
  assert.equal(notebookLines({ mode: 'count', a: 5, b: 0 }).length, 4)
})
