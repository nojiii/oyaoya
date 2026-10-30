// @vitest-environment happy-dom
import { test, vi } from 'vitest'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { VisualPlayground } from '../src/components/VisualPlayground.tsx'
import {
  stub,
  stubAnimations,
  stubPointerCapture,
  stubSize,
} from './domStubs.mjs'

// 「答えを確認する」も、もどるボタンと同じ閉じる処理（アニメーション・二重押しの防止）を通す。
// もどるボタンや Esc で閉じている途中に押しても、閉じ終わってから答えへ進む
test('the counter dialog closes only through close(), which runs the follow-up once after closing', () => {
  stubSize(1000, 1000)
  const animations = stubAnimations()
  stubPointerCapture()
  vi.useFakeTimers()
  try {
    let reviewed = 0
    const { container } = render(
      createElement(
        VisualPlayground,
        {
          problem: { mode: 'sub', a: 2, b: 1 },
          step: 0,
          onReviewAnswer: () => reviewed++,
        },
        '見本',
      ),
    )
    const dialog = container.querySelector('dialog')
    let closed = 0
    stub(dialog, 'close', function () {
      closed++
      HTMLDialogElement.prototype.close.call(this)
    })

    // おはじきの画面を開き、1こを右（とったぶん）へ動かす
    fireEvent.click(container.querySelector('[aria-haspopup="dialog"]'))
    assert.equal(dialog.open, true)
    const piece = screen.getByRole('button', {
      name: '1こめのおはじき',
      hidden: true,
    })
    fireEvent.pointerDown(piece, { pointerId: 1, button: 0, clientX: 0 })
    fireEvent.pointerUp(piece, { pointerId: 1, clientX: 600 })
    // 動かし終えてから少し待つと、「答えを確認する」が出る
    act(() => vi.advanceTimersByTime(1000))
    const review = screen.getByRole('button', {
      name: /答えを確認する/,
      hidden: true,
    })

    // もどるで閉じ始めたあとに、「答えを確認する」を2回と Esc を押す
    fireEvent.click(
      screen.getByRole('button', { name: 'もどる', hidden: true }),
    )
    fireEvent.click(review)
    fireEvent.click(review)
    fireEvent(dialog, new Event('cancel', { cancelable: true }))
    assert.equal(reviewed, 0, 'waits for the closing animation')
    assert.equal(closed, 0)

    // 閉じるアニメーションは、最初の1回だけ始める（開くときの1回と合わせて2回）
    const closing = animations.filter(
      (animation) => animation.target === dialog,
    )
    assert.equal(closing.length, 2, 'closing starts only once')

    // 閉じるアニメーションが終わったら、1回だけ閉じて、答えへ1回だけ進む
    act(() => closing.at(-1).onfinish())
    assert.equal(closed, 1)
    assert.equal(dialog.open, false)
    assert.equal(
      reviewed,
      1,
      'a second tap while closing does not run it again',
    )
  } finally {
    vi.useRealTimers()
  }
})
