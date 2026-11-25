import { test } from 'vitest'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { arithmetic } from '../src/problems/arithmetic.ts'
import {
  advanceSubtraction as act,
  initialSubtractionProgress as initial,
  subtractionPages,
  subtractionStorageKey,
  restoreSubtractionProgress,
  subtractionFlowStatus,
  subtractionCheck,
} from '../src/components/subtractionFlowState.ts'

test('subtraction routes require a choice and completed app operation, and restore safely', () => {
  const choose = act(initial, { type: 'next' })
  assert.equal(choose.page, 'choose')
  assert.deepEqual(act(choose, { type: 'next' }), choose)
  for (const route of ['physical', 'app']) {
    let state = act(choose, { type: 'choose', route })
    assert.equal(state.page, 'choose')
    const pages = subtractionPages(route)
    for (const page of pages.slice(2)) {
      state = act(state, { type: 'next' })
      assert.equal(state.page, page)
      if (page === 'app') {
        assert.deepEqual(act(state, { type: 'next' }), state)
        state = act(state, { type: 'app-status', complete: true })
        assert.equal(
          restoreSubtractionProgress(JSON.stringify(state)).appComplete,
          false,
        )
      }
    }
    assert.deepEqual(act(state, { type: 'next' }), state)
    assert.equal(subtractionFlowStatus(JSON.stringify(state)), 'finished')
    assert.deepEqual(restoreSubtractionProgress(JSON.stringify(state)), initial)
    for (const page of pages.slice(0, -1).reverse()) {
      state = act(state, { type: 'back' })
      assert.equal(state.page, page)
    }
  }
  for (const raw of [
    'broken',
    '{"route":"app","page":"remove"}',
    '{"route":null,"page":"answer"}',
  ])
    assert.deepEqual(restoreSubtractionProgress(raw), initial)
})

test('all subtraction pairs and follow-up problems stay within ten, including zero', () => {
  for (let a = 0; a <= 10; a++) {
    for (let b = 0; b <= a; b++) {
      assert.equal(arithmetic('sub', a, b).answer, a - b)
      const [c, d] = subtractionCheck(a, b)
      assert.notDeepEqual([c, d], [a, b])
      assert.equal(arithmetic('sub', c, d).answer, c - d)
    }
  }
  assert.throws(() => arithmetic('sub', 11, 1))
  assert.throws(() => arithmetic('sub', 3, 4))
})

test('subtraction uses the shared slide design, separate answers and the subtraction counter board', async () => {
  const { SubtractionFlow } =
    await import('../src/components/SubtractionFlow.tsx')
  const previousStorage = globalThis.sessionStorage
  const storage = new Map()
  globalThis.sessionStorage = { getItem: (key) => storage.get(key) ?? null }
  const path = '/problems/subtraction-within-10'
  try {
    for (const [a, b] of [
      [7, 3],
      [3, 3],
      [0, 0],
      [10, 0],
    ]) {
      for (const route of ['physical', 'app']) {
        for (const page of subtractionPages(route).filter(
          (page) => page !== 'checkAnswer',
        )) {
          storage.set(
            subtractionStorageKey(path, a, b),
            JSON.stringify({ route, page }),
          )
          const router = createMemoryRouter(
            [{ path, element: createElement(SubtractionFlow, { a, b }) }],
            { initialEntries: [path] },
          )
          try {
            const html = renderToString(
              createElement(RouterProvider, { router }),
            )
            assert.ok(html.includes(`data-slide="${page}" data-active="true"`))
            assert.ok(html.includes('引き算の台本'))
            assert.ok(!html.includes('<input'))
            assert.ok(!html.includes('＋'))
            if (page === 'count') {
              assert.ok(html.includes('残ったおはじき'))
              const start = html.indexOf('data-slide="count"')
              const end = html.indexOf('data-slide=', start + 1)
              assert.ok(!html.slice(start, end).includes('<em>'))
            }
            if (page === 'app') assert.ok(html.includes('答えを確認する'))
          } finally {
            router.dispose()
          }
        }
      }
    }
  } finally {
    globalThis.sessionStorage = previousStorage
  }
})
