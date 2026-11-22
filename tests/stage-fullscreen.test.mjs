// @vitest-environment happy-dom
import { test, vi } from 'vitest'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { LessonSlides } from '../src/components/LessonSlides.tsx'
import './domStubs.mjs'

// 図のあるページ・全画面を置かないページ・図のないページ、の3ページの台本を、最初のページから開く
function renderSlides(onNext = () => {}) {
  // 使い方のページは出さない
  localStorage.setItem('oyaoya:script-guide:v2', 'done')
  render(
    createElement(LessonSlides, {
      label: 'ためしの台本',
      slides: [
        {
          id: 'figure',
          title: '図のあるページ',
          stage: createElement('p', null, '3 ＋ 4 ＝ ？'),
          content: createElement('p', null, 'セリフ'),
        },
        {
          id: 'button',
          title: 'ボタンのあるページ',
          stage: createElement('button', { type: 'button' }, '開く'),
          stageFullscreen: false,
          content: null,
        },
        { id: 'mascot', title: '図のないページ', content: null },
      ],
      currentId: 'figure',
      totalKnown: true,
      canNext: true,
      onNext,
      onBack() {},
    }),
  )
}

const slide = (id) => document.querySelector(`[data-slide="${id}"]`)
const fullscreenButton = (id) =>
  within(slide(id)).queryByRole('button', {
    name: '図を全画面で見せる',
    hidden: true,
  })

test('the stage has a fullscreen button that shows only the figure', () => {
  const onNext = vi.fn()
  renderSlides(onNext)

  // 図のあるページだけに置く。中身がボタンのページと、図のない（キャラクターの）ページには置かない
  assert.ok(fullscreenButton('figure'))
  assert.equal(fullscreenButton('button'), null)
  assert.equal(fullscreenButton('mascot'), null)
  // 閉じている間は、全画面の図を作らない
  assert.equal(screen.queryByRole('dialog', { hidden: true }), null)

  // 押すと、ステージの中身だけを出す。見出しやセリフは出さない
  fireEvent.click(fullscreenButton('figure'))
  const dialog = screen.getByRole('dialog', { name: '全画面の図' })
  assert.equal(dialog.open, true)
  assert.ok(dialog.textContent.includes('3 ＋ 4 ＝ ？'))
  assert.ok(!dialog.textContent.includes('図のあるページ'))
  assert.ok(!dialog.textContent.includes('セリフ'))

  // 全画面の間は、指やキーボードを動かしても台本のページを送らない
  fireEvent.pointerDown(dialog, {
    pointerId: 1,
    clientX: 300,
    isPrimary: true,
    button: 0,
  })
  fireEvent.pointerMove(dialog, { pointerId: 1, clientX: 100, isPrimary: true })
  fireEvent.pointerUp(dialog, { pointerId: 1, clientX: 100, isPrimary: true })
  fireEvent.keyDown(dialog, { key: 'ArrowRight' })
  assert.equal(onNext.mock.calls.length, 0)

  // 「とじる」で台本に戻り、押した「全画面」のボタンへフォーカスを戻す
  fireEvent.click(within(dialog).getByRole('button', { name: 'とじる' }))
  assert.equal(screen.queryByRole('dialog', { hidden: true }), null)
  assert.equal(document.activeElement, fullscreenButton('figure'))
})
