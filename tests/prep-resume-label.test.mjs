// @vitest-environment happy-dom
import { test } from 'vitest'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { ArithmeticLesson } from '../src/components/ArithmeticLesson.tsx'
import { additionStorageKey } from '../src/components/additionFlowState.ts'
import './domStubs.mjs'

// 10までのたし算（3 ＋ 4）の台本を、途中のページまで進めて準備の画面に戻ったところから描く
function renderPrepare() {
  sessionStorage.setItem(
    additionStorageKey('/lesson', 3, 4),
    JSON.stringify({ route: 'physical', page: 'count', appComplete: false }),
  )
  const router = createMemoryRouter(
    [
      {
        path: '/lesson',
        loader: () => ({ crumbs: [] }),
        element: createElement(ArithmeticLesson, {
          mode: 'add',
          initial: [3, 4],
          additionFlow: true,
        }),
      },
    ],
    { initialEntries: ['/lesson'] },
  )
  render(createElement(RouterProvider, { router }))
}

// 数の欄に書く（欄から離れて確定する前）
function type(value) {
  const input = screen.getByRole('textbox', { name: '最初の数' })
  fireEvent.focus(input)
  fireEvent.change(input, { target: { value } })
}

test('the start button follows the number being typed, before it is confirmed', async () => {
  renderPrepare()
  await screen.findByRole('button', { name: '途中から台本にもどる' })

  // 範囲内の別の数を書いたら、確定する前から「台本をはじめる」にする（新しい数の台本は最初から）
  type('2')
  assert.ok(screen.getByRole('button', { name: '台本をはじめる' }))

  // 範囲外の数（9 ＋ 4）は確定できないので、今の数（3 ＋ 4）の続きのまま
  type('9')
  assert.ok(screen.getByRole('button', { name: '途中から台本にもどる' }))

  // 元の数に戻したら、続きから
  type('3')
  assert.ok(screen.getByRole('button', { name: '途中から台本にもどる' }))

  // 別の数を書いて確定しても、「台本をはじめる」のまま
  type('2')
  fireEvent.focusOut(screen.getByRole('textbox', { name: '最初の数' }))
  assert.ok(screen.getByRole('button', { name: '台本をはじめる' }))
})
