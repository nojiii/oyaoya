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

// 10までのたし算：おさらを指でまん中へ寄せる。半分より手前で離すと戻り、両方を寄せたら1つにまとめて数える
test('adding within ten gathers both plates into the middle before counting', () => {
  stubAnimations()
  stubPointerCapture()
  // 広場は 0〜400px、左のおさらは 0〜100px、右のおさらは 300〜400px（まん中の線まで、それぞれ100px動かせる）
  stub(Element.prototype, 'getBoundingClientRect', function () {
    const side = this.dataset?.side
    const [left, right] =
      side === 'left' ? [0, 100] : side === 'right' ? [300, 400] : [0, 400]
    return {
      x: left,
      y: 0,
      left,
      right,
      top: 0,
      bottom: 100,
      width: right - left,
      height: 100,
    }
  })
  vi.useFakeTimers()
  try {
    const { container } = render(
      createElement(
        VisualPlayground,
        {
          problem: { mode: 'add', a: 3, b: 4 },
          step: 1,
          onReviewAnswer: () => {},
        },
        '見本',
      ),
    )
    fireEvent.click(container.querySelector('[aria-haspopup="dialog"]'))
    const plate = (name) =>
      screen.getByRole('button', {
        name: new RegExp(`^${name}の おはじき`),
        hidden: true,
      })
    const prompt = () =>
      container.querySelector('[aria-live="polite"] span').textContent
    assert.equal(prompt(), '3こと 4こを、まん中へ よせてみよう。')

    // 左のおさらを少しだけ（40px）動かして離すと、元に戻る
    const left = plate('ひだり')
    fireEvent.pointerDown(left, { pointerId: 1, button: 0, clientX: 50 })
    fireEvent.pointerMove(left, { pointerId: 1, clientX: 90 })
    assert.equal(left.style.transform, 'translateX(40px)')
    fireEvent.pointerUp(left, { pointerId: 1, clientX: 90 })
    assert.equal(left.style.transform, '')
    assert.equal(left.hasAttribute('data-arrived'), false)

    // 外側へは動かない。まん中の線もこえない
    fireEvent.pointerDown(left, { pointerId: 2, button: 0, clientX: 50 })
    fireEvent.pointerMove(left, { pointerId: 2, clientX: 0 })
    assert.equal(left.style.transform, 'translateX(0px)')
    fireEvent.pointerMove(left, { pointerId: 2, clientX: 400 })
    assert.equal(left.style.transform, 'translateX(100px)')
    fireEvent.pointerUp(left, { pointerId: 2, clientX: 400 })
    // 寄せ終えたおさらは、もう押せない（ボタンではなくなる）
    const leftPlate = container.querySelector('[data-side="left"]')
    assert.equal(leftPlate.hasAttribute('data-arrived'), true)
    assert.equal(leftPlate.getAttribute('role'), 'group')
    assert.equal(prompt(), 'みぎの おはじきも、まん中へ よせよう。')

    // 片方だけでは、できあがりにしない
    act(() => vi.advanceTimersByTime(1000))
    assert.equal(
      screen.queryByRole('button', { name: /答えを確認する/, hidden: true }),
      null,
    )

    // 右のおさらは、キーボードでも寄せられる。両方そろうと、1つのおさらにまとまる
    fireEvent.keyDown(plate('みぎ'), { key: 'Enter' })
    assert.equal(
      screen
        .getByRole('group', {
          name: 'まん中で ひとつに なったおはじき',
          hidden: true,
        })
        .textContent.includes('？こ'),
      true,
    )
    assert.equal(prompt(), 'まん中で ひとつに なったね。')
    act(() => vi.advanceTimersByTime(1000))
    assert.equal(prompt(), 'あわせて おはじきは なんこかな？')
    screen.getByRole('button', { name: /答えを確認する/, hidden: true })

    // さわった順に 1、2、3… と数字が出る。同じおはじきは2回数えない
    const pieces = () =>
      screen.getAllByRole('button', { name: /おはじき$/, hidden: true })
    fireEvent.click(pieces()[5])
    fireEvent.click(pieces()[0])
    fireEvent.click(pieces()[0])
    assert.deepEqual(
      pieces().map((piece) => piece.textContent),
      ['2', '', '', '', '', '1', ''],
    )
    // 数えても、できあがりのまま
    screen.getByRole('button', { name: /答えを確認する/, hidden: true })

    // もとにもどすと、2つのおさらに戻る
    fireEvent.click(
      screen.getByRole('button', { name: 'もとにもどす', hidden: true }),
    )
    assert.equal(plate('ひだり').hasAttribute('data-arrived'), false)
    assert.equal(plate('みぎ').hasAttribute('data-arrived'), false)
  } finally {
    vi.useRealTimers()
  }
})
