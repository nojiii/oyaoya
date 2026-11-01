// @vitest-environment happy-dom
import { afterEach, test, vi } from 'vitest'
import assert from 'node:assert/strict'
import { createElement, useState } from 'react'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { LessonSlides } from '../src/components/LessonSlides.tsx'
import { stubAnimations, stubSize } from './domStubs.mjs'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

// 問題のページ → 答えのページ → 最後のページ、の3ページの台本を、答えのページから開く。
// 答えのページは、「？」で答えを見るまで送れない
function Script({ onNext }) {
  const [revealed, setRevealed] = useState(false)
  const reveal = () => setRevealed(true)
  return createElement(LessonSlides, {
    label: 'ためしの台本',
    slides: [
      { id: 'ask', title: '問題のページ', stage: 'ステージ', content: null },
      {
        id: 'answer',
        title: '答えのページ',
        stage: revealed
          ? '答えは5'
          : createElement('button', { type: 'button', onClick: reveal }, '？'),
        content: null,
        onReveal: revealed ? undefined : reveal,
      },
      { id: 'last', title: '最後のページ', stage: 'ステージ', content: null },
    ],
    currentId: 'answer',
    totalKnown: true,
    canNext: revealed,
    onNext,
    onBack() {},
  })
}

const slide = (id) => document.querySelector(`[data-slide="${id}"]`)
const bubble = () => screen.getByText('ここは、押して答えを見ます').closest('p')
const pointer = (clientX) => ({
  pointerId: 3,
  clientX,
  clientY: 80,
  isPrimary: true,
  button: 0,
})

test('the answer page asks to press instead of swipe, and tells so when someone tries to swipe', async () => {
  stubSize(296, 400)
  const animations = stubAnimations()
  vi.useFakeTimers()
  const onNext = vi.fn()
  render(createElement(Script, { onNext }))
  const carousel = screen.getByRole('region', { name: 'ためしの台本' })

  // 答えを見る前のページだけ、「次」の行の代わりに「答えを見る」ボタンと吹き出しを置く
  assert.ok(slide('ask').textContent.includes('次答えのページ'))
  assert.ok(!slide('ask').textContent.includes('押して答えを見ます'))
  assert.ok(screen.getByRole('button', { name: '答えを見る' }))
  assert.ok(!slide('answer').textContent.includes('次最後のページ'))

  // 吹き出しは、ページに来て少ししてから出て、3.5秒で消える
  assert.equal(bubble().dataset.show, 'false')
  await act(() => vi.advanceTimersByTimeAsync(400))
  assert.equal(bubble().dataset.show, 'true')
  await act(() => vi.advanceTimersByTimeAsync(3500))
  assert.equal(bubble().dataset.show, 'false')

  // → で進もうとしても進まず、吹き出しをもう一度出して、「？」と「答えを見る」ボタンを揺らす
  animations.length = 0
  fireEvent.keyDown(carousel, { key: 'ArrowRight' })
  assert.equal(onNext.mock.calls.length, 0)
  assert.equal(bubble().dataset.show, 'true')
  assert.ok(
    animations.some(({ target }) => target.textContent === '答えを見る'),
  )

  // 左へ少しめくって離しても、同じように知らせる
  await act(() => vi.advanceTimersByTimeAsync(3500))
  assert.equal(bubble().dataset.show, 'false')
  fireEvent.pointerDown(carousel, pointer(200))
  fireEvent.pointerMove(carousel, pointer(170))
  fireEvent.pointerUp(carousel, pointer(170))
  assert.equal(onNext.mock.calls.length, 0)
  assert.equal(bubble().dataset.show, 'true')

  // 「答えを見る」を押すと答えが出る。吹き出しとボタンは消え、いつもの「次」の行に戻る
  await act(() => vi.advanceTimersByTimeAsync(500))
  fireEvent.click(screen.getByRole('button', { name: '答えを見る' }))
  assert.ok(slide('answer').textContent.includes('答えは5'))
  assert.equal(screen.queryByRole('button', { name: '答えを見る' }), null)
  assert.equal(screen.queryByText('ここは、押して答えを見ます'), null)
  assert.ok(slide('answer').textContent.includes('次最後のページ'))
})
