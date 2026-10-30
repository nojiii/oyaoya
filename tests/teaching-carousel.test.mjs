// @vitest-environment happy-dom
import { test } from 'vitest'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { TeachingScript } from '../src/components/TeachingScript.tsx'
import { stubAnimations, stubPointerCapture, stubSize } from './domStubs.mjs'

// 声かけを1ページずつ出す台本（flow を使わない台本）を、台本を開いた状態で描く。
// 最初のページの問題の図に、押せる見本（role="button"）を置く
async function renderScript() {
  sessionStorage.setItem('teaching-started:/lesson', 'true')
  // 使い方の説明は出さない
  localStorage.setItem('oyaoya:script-guide:v1', 'done')
  const router = createMemoryRouter(
    [
      {
        path: '/lesson',
        loader: () => ({ crumbs: [] }),
        element: createElement(TeachingScript, {
          prepare: { goal: '', materials: [], point: '', avoid: [] },
          question: {
            say: 'もんだいを読もう',
            show: createElement(
              'div',
              { role: 'button', tabIndex: 0, 'aria-label': '見本' },
              createElement('span', { 'data-testid': 'bead' }),
            ),
          },
          turns: [{ say: 'つぎの声かけ' }],
        }),
      },
    ],
    { initialEntries: ['/lesson'] },
  )
  render(createElement(RouterProvider, { router }))
  const carousel = await screen.findByRole('region', { name: '声かけの台本' })
  return { carousel, track: carousel.firstElementChild }
}

const pointer = (pointerId, clientX, clientY) => ({
  pointerId,
  clientX,
  clientY,
  isPrimary: true,
  button: 0,
})

test('the carousel follows horizontal swipes, but not taps on a preview, vertical scrolls or touches while sliding', async () => {
  // 台本の枠は幅296px。隣のページとの間は12px
  stubSize(296, 400)
  stubAnimations()
  const captured = stubPointerCapture()
  const { carousel, track } = await renderScript()

  // 見本の中（絵の部分など）を押しても、台本はポインターを捕まえず、そのまま指を動かしても台本は動かない
  fireEvent.pointerDown(screen.getByTestId('bead'), pointer(7, 120, 80))
  assert.deepEqual(captured, [])
  fireEvent.pointerMove(carousel, pointer(7, 20, 80))
  assert.equal(track.dataset.dragging, 'false')
  assert.equal(track.style.transform, 'translateX(0px)')
  fireEvent.pointerUp(carousel, pointer(7, 20, 80))

  // 見本の外を押すと捕まえるが、指を動かすまではドラッグにしない
  fireEvent.pointerDown(carousel, pointer(7, 120, 80))
  assert.deepEqual(captured, [7])
  assert.equal(track.dataset.dragging, 'false')

  // 小さな指ぶれでは動かさない。横に動かすと、そのまま横に動かし続ける
  fireEvent.pointerMove(carousel, pointer(7, 117, 82))
  assert.equal(track.dataset.dragging, 'false')
  fireEvent.pointerMove(carousel, pointer(7, 100, 85))
  assert.equal(track.dataset.dragging, 'true')
  assert.equal(track.style.transform, 'translateX(-20px)')
  fireEvent.pointerMove(carousel, pointer(7, 90, 120))
  assert.equal(track.style.transform, 'translateX(-30px)')
  // 1ページ分（296 + 12px）より先へは動かさない
  fireEvent.pointerMove(carousel, pointer(7, -500, 120))
  assert.equal(track.style.transform, 'translateX(-308px)')
  fireEvent.pointerCancel(carousel, pointer(7, -500, 120))
  assert.equal(track.style.transform, 'translateX(0px)')

  // 縦に動かし始めたら、あとで横に動いてもスクロールのまま
  fireEvent.pointerDown(carousel, pointer(8, 120, 80))
  fireEvent.pointerMove(carousel, pointer(8, 122, 100))
  fireEvent.pointerMove(carousel, pointer(8, 20, 110))
  assert.equal(track.dataset.dragging, 'false')
  assert.equal(track.style.transform, 'translateX(0px)')
  fireEvent.pointerUp(carousel, pointer(8, 20, 110))

  // 次のページへ送っている間は、新しく押しても捕まえない
  fireEvent.pointerDown(carousel, pointer(9, 120, 80))
  fireEvent.pointerMove(carousel, pointer(9, -100, 80))
  fireEvent.pointerUp(carousel, pointer(9, -100, 80))
  assert.deepEqual(captured, [7, 8, 9])
  fireEvent.pointerDown(carousel, pointer(10, 120, 80))
  assert.deepEqual(captured, [7, 8, 9])
})
