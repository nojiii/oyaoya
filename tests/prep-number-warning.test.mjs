// @vitest-environment happy-dom
import { test } from 'vitest'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { ArithmeticLesson } from '../src/components/ArithmeticLesson.tsx'
import { stub } from './domStubs.mjs'

// 10までのたし算（3 ＋ 4）の準備の画面を描く
function renderPrepare() {
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

// 数の欄に書いて、欄から離れる（離れたときに数を確かめる）
function enter(label, value) {
  const input = screen.getByRole('textbox', { name: label })
  fireEvent.focus(input)
  fireEvent.change(input, { target: { value } })
  fireEvent.focusOut(input)
}

test('an out-of-range number shows a clear warning and keeps the script from starting until it is fixed', async () => {
  let scrolled = 0
  stub(Element.prototype, 'scrollIntoView', () => scrolled++)
  renderPrepare()
  await screen.findByRole('button', { name: '台本をはじめる' })

  // 合計が10を超える数を入れると、見出しのついた警告を出す
  enter('最初の数', '8')
  const alert = screen.getByRole('alert')
  assert.ok(alert.textContent.includes('この数には変えられません'))
  assert.ok(alert.textContent.includes('合計が10までになる2つの数'))
  assert.ok(alert.textContent.includes('数を直すと、台本をはじめられます。'))
  assert.equal(
    screen
      .getByRole('textbox', { name: '最初の数' })
      .getAttribute('aria-invalid'),
    'true',
  )

  // 直すまでは台本へ進まない。押すと、警告まで画面を動かして見せ直す
  const start = screen.getByRole('button', {
    name: '数を直すと、台本をはじめられます',
  })
  assert.equal(start.getAttribute('aria-disabled'), 'true')
  fireEvent.click(start)
  assert.equal(scrolled, 1)
  assert.equal(document.querySelector('[data-script-running]'), null)
  assert.ok(screen.getByRole('alert'))

  // 範囲内の数に直すと、警告が消えて、台本をはじめられる
  enter('最初の数', '6')
  assert.equal(screen.queryByRole('alert'), null)
  const ready = screen.getByRole('button', { name: '台本をはじめる' })
  assert.equal(ready.getAttribute('aria-disabled'), null)
})
