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
    // 開いたら、もどるボタンではなく見出しにフォーカスを置く（もどるに枠が出ないように）
    assert.equal(
      document.activeElement,
      screen.getByRole('heading', {
        name: 'うごかして かんがえよう',
        hidden: true,
      }),
    )
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

// 10までのたし算：左右のおさらから、おはじきを1こずつまん中のおさらへ寄せる。
// 指でまん中まで運んでも、さわるだけでもよい。手前で離すと戻る。全部寄せたら1つにまとめて数える
test('adding within ten gathers the pieces one by one into the middle plate before counting', () => {
  stubAnimations()
  stubPointerCapture()
  // 広場は 0〜400px。まん中のおさらは 150〜250px。左のおはじきは 0〜30px、右のおはじきは 370〜400px にあり、
  // 指で動かした分（style.transform の translate）だけずれる
  stub(Element.prototype, 'getBoundingClientRect', function () {
    let [left, right] = [0, 400]
    if (this.dataset?.middle !== undefined) [left, right] = [150, 250]
    else if (this.dataset?.piece !== undefined)
      [left, right] = Number(this.dataset.piece) < 3 ? [0, 30] : [370, 400]
    const dx = Number(
      /translate\((-?[\d.]+)px/.exec(this.style?.transform ?? '')?.[1] ?? 0,
    )
    return {
      x: left + dx,
      y: 0,
      left: left + dx,
      right: right + dx,
      top: 0,
      bottom: 30,
      width: right - left,
      height: 30,
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
    const sources = (side) =>
      screen.queryAllByRole('button', {
        name: `${side}の おはじき。まん中へ よせる`,
        hidden: true,
      })
    const middle = () => container.querySelector('[data-middle]')
    const inMiddle = () => middle().querySelectorAll('[data-piece]').length
    const prompt = () =>
      container.querySelector('[aria-live="polite"] span').textContent
    const start = '3こと 4こを、1こずつ まん中へ よせてみよう。'
    assert.equal(prompt(), start)
    assert.equal(sources('ひだり').length, 3)
    assert.equal(sources('みぎ').length, 4)
    assert.equal(inMiddle(), 0)

    // 左のおはじきを少しだけ（40px）運んで離すと、元に戻る。続くクリックでも寄せない
    let piece = sources('ひだり')[0]
    fireEvent.pointerDown(piece, { pointerId: 1, button: 0, clientX: 10 })
    fireEvent.pointerMove(piece, { pointerId: 1, clientX: 50 })
    assert.equal(piece.style.transform, 'translate(40px, 0px)')
    assert.equal(middle().hasAttribute('data-over'), false)
    fireEvent.pointerUp(piece, { pointerId: 1, clientX: 50 })
    fireEvent.click(piece, { detail: 1 })
    assert.equal(piece.style.transform, '')
    assert.equal(sources('ひだり').length, 3)
    assert.equal(inMiddle(), 0)

    // まん中のおさらまで運ぶと、おさらの色が変わり、離すとまん中へ入る
    piece = sources('ひだり')[0]
    fireEvent.pointerDown(piece, { pointerId: 2, button: 0, clientX: 10 })
    fireEvent.pointerMove(piece, { pointerId: 2, clientX: 150 })
    assert.equal(middle().hasAttribute('data-over'), true)
    fireEvent.pointerUp(piece, { pointerId: 2, clientX: 150 })
    assert.equal(middle().hasAttribute('data-over'), false)
    assert.equal(sources('ひだり').length, 2)
    assert.equal(inMiddle(), 1)
    // 寄せている途中は、寄せた数を出さない
    assert.equal(prompt(), start)

    // さわるだけでも（指をほとんど動かさずに離すと）、まん中へ入る
    piece = sources('ひだり')[0]
    fireEvent.pointerDown(piece, { pointerId: 3, button: 0, clientX: 10 })
    fireEvent.pointerMove(piece, { pointerId: 3, clientX: 12 })
    fireEvent.pointerUp(piece, { pointerId: 3, clientX: 12 })
    fireEvent.click(piece, { detail: 1 })
    assert.equal(sources('ひだり').length, 1)
    assert.equal(inMiddle(), 2)

    // キーボード（Enter）でも寄せられ、フォーカスは次のおはじきへ移る
    fireEvent.click(sources('ひだり')[0])
    assert.equal(sources('ひだり').length, 0)
    assert.equal(document.activeElement, sources('みぎ')[0])
    assert.equal(prompt(), 'みぎの おはじきも、まん中へ よせよう。')

    // 左だけでは、できあがりにしない
    act(() => vi.advanceTimersByTime(1000))
    assert.equal(
      screen.queryByRole('button', { name: /答えを確認する/, hidden: true }),
      null,
    )

    // 右のおはじきも全部寄せると、まん中で1つにまとまる
    for (const node of sources('みぎ')) fireEvent.click(node, { detail: 1 })
    assert.equal(inMiddle(), 7)
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
    assert.equal(pieces().length, 7)
    fireEvent.click(pieces()[5])
    fireEvent.click(pieces()[0])
    fireEvent.click(pieces()[0])
    assert.deepEqual(
      pieces().map((node) => node.textContent),
      ['2', '', '', '', '', '1', ''],
    )
    // 数えても、できあがりのまま
    screen.getByRole('button', { name: /答えを確認する/, hidden: true })

    // もとにもどすと、おはじきは左右のおさらに戻る
    fireEvent.click(
      screen.getByRole('button', { name: 'もとにもどす', hidden: true }),
    )
    assert.equal(sources('ひだり').length, 3)
    assert.equal(sources('みぎ').length, 4)
    assert.equal(inMiddle(), 0)
  } finally {
    vi.useRealTimers()
  }
})
