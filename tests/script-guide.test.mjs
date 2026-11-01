// @vitest-environment happy-dom
import { test } from 'vitest'
import assert from 'node:assert/strict'
import { createElement, useState } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { TeachingScript } from '../src/components/TeachingScript.tsx'
import { LessonSlides } from '../src/components/LessonSlides.tsx'
import {
  stub,
  stubAnimations,
  stubPointerCapture,
  stubSize,
} from './domStubs.mjs'

const GUIDE_KEY = 'oyaoya:script-guide:v2'

// ページを送る動きは、すぐに終わったことにする
function stubFinishedAnimations() {
  stubAnimations()
  stub(Element.prototype, 'animate', () => ({
    finished: Promise.resolve(),
    cancel() {},
  }))
}

// 声かけを1ページずつ出す台本（flow を使わない台本）を、台本を開いた状態で描く。
// ページは、問題の声かけ → つぎの声かけ → おしまい の3枚
async function renderScript() {
  sessionStorage.setItem('teaching-started:/lesson', 'true')
  const router = createMemoryRouter(
    [
      {
        path: '/lesson',
        loader: () => ({ crumbs: [] }),
        element: createElement(TeachingScript, {
          prepare: { goal: '', materials: [], point: '', avoid: [] },
          question: { say: 'もんだいを読もう' },
          turns: [{ say: 'つぎの声かけ' }],
        }),
      },
    ],
    { initialEntries: ['/lesson'] },
  )
  render(createElement(RouterProvider, { router }))
  return screen.findByRole('region', { name: '声かけの台本' })
}

const progress = () =>
  screen
    .getByRole('img', { name: /^台本の進み具合/ })
    .getAttribute('aria-label')
const edge = (name) => screen.getByRole('button', { name })
const guideHeading = () =>
  screen.queryByRole('heading', { name: /^左へめくって、\s*はじめましょう$/ })

test('the first script opens on the guide page, which leads into the script the same way as the pages', async () => {
  stubFinishedAnimations()
  const carousel = await renderScript()

  // 使い方のページを、台本のページの前に置く。台本のページの数には入れない
  assert.ok(guideHeading())
  assert.equal(progress(), '台本の進み具合 台本の使い方')
  assert.equal(edge('前のページ').dataset.hidden, 'true')
  assert.equal(edge('次のページ').dataset.hidden, 'false')
  assert.equal(localStorage.getItem(GUIDE_KEY), null)

  // 「はじめる」で台本の最初のページへ。台本の進み具合は変えず、使い方を見たことを覚える
  fireEvent.click(screen.getByRole('button', { name: 'はじめる' }))
  await waitFor(() => assert.equal(progress(), '台本の進み具合 1 / 3ページ'))
  assert.equal(guideHeading(), null)
  assert.equal(localStorage.getItem(GUIDE_KEY), 'done')
  assert.equal(
    sessionStorage.getItem('teaching-progress:/lesson:もんだいを読もう'),
    JSON.stringify([{ turn: 0, beat: 0 }]),
  )

  // 最初のページからは、左の端の矢印で使い方のページへ戻れる
  assert.equal(edge('前のページ').dataset.hidden, 'false')
  fireEvent.click(edge('前のページ'))
  await waitFor(() => assert.ok(guideHeading()))

  // キーボードの → でも、使い方のページから進める
  fireEvent.keyDown(carousel, { key: 'ArrowRight' })
  await waitFor(() => assert.equal(progress(), '台本の進み具合 1 / 3ページ'))

  // ページの下の「次」のボタンは、次のページの名前を出し、押すと次のページへ送る
  fireEvent.click(
    screen.getByRole('button', { name: /^次\s*こう声がけしよう$/ }),
  )
  await waitFor(() => assert.equal(progress(), '台本の進み具合 2 / 3ページ'))
  fireEvent.click(edge('次のページ'))
  await waitFor(() => assert.equal(progress(), '台本の進み具合 3 / 3ページ'))

  // おしまいのページには「次」のボタンを置かず、右の端の矢印も隠す
  assert.equal(carousel.querySelector('[data-active="true"] button'), null)
  assert.equal(edge('次のページ').dataset.hidden, 'true')
})

test('the guide page is skipped once seen, and when the script resumes in the middle', async () => {
  localStorage.setItem(GUIDE_KEY, 'done')
  await renderScript()
  assert.equal(guideHeading(), null)
  assert.equal(progress(), '台本の進み具合 1 / 3ページ')
  // 使い方のページがないときは、最初のページから前へは戻れない
  assert.equal(edge('前のページ').dataset.hidden, 'true')
})

test('the guide page is not put in front of a script resumed from a later page', async () => {
  sessionStorage.setItem(
    'teaching-progress:/lesson:もんだいを読もう',
    JSON.stringify([
      { turn: 0, beat: 0 },
      { turn: 1, beat: 0 },
    ]),
  )
  await renderScript()
  assert.equal(guideHeading(), null)
  assert.equal(progress(), '台本の進み具合 2 / 3ページ')
})

// ページを分けた台本（LessonSlides）。ページ b では、方法を選ぶまで送れない
function Slides({ onNext }) {
  const ids = ['a', 'b', 'c']
  const [page, setPage] = useState('a')
  const [chosen, setChosen] = useState(false)
  const index = ids.indexOf(page)
  return createElement(LessonSlides, {
    label: 'テストの台本',
    slides: ids.map((id) => ({
      id,
      title: 'ページ' + id.toUpperCase(),
      stage: createElement('p', null, 'ステージ'),
      content:
        id === 'b'
          ? createElement(
              'button',
              { type: 'button', onClick: () => setChosen(true) },
              '方法を選ぶ',
            )
          : null,
    })),
    currentId: page,
    totalKnown: true,
    canNext: page !== 'b' || chosen,
    onNext: () => {
      onNext?.(page)
      setPage(ids[index + 1] ?? page)
    },
    onBack: () => setPage(ids[index - 1] ?? page),
  })
}

const activeSlide = () =>
  document.querySelector('[data-slide][data-active="true"]').dataset.slide

test('paged scripts put the guide page first and send pages with the next button and the edges', async () => {
  stubFinishedAnimations()
  const sent = []
  render(createElement(Slides, { onNext: (page) => sent.push(page) }))

  assert.equal(activeSlide(), 'scriptGuide')
  assert.equal(progress(), '台本の進み具合 台本の使い方')
  assert.equal(edge('前のページ').dataset.hidden, 'true')

  // 使い方のページから進んでも、台本のページは送らない（onNext を呼ばない）
  fireEvent.click(screen.getByRole('button', { name: 'はじめる' }))
  await waitFor(() => assert.equal(activeSlide(), 'a'))
  assert.deepEqual(sent, [])
  assert.equal(localStorage.getItem(GUIDE_KEY), 'done')
  assert.equal(progress(), '台本の進み具合 1 / 3ページ')
  // 送ったページの見出しへ、フォーカスを移す
  assert.equal(document.activeElement.textContent, 'ページA')

  // 最初のページから戻ると、使い方のページ
  fireEvent.click(edge('前のページ'))
  await waitFor(() => assert.equal(activeSlide(), 'scriptGuide'))
  fireEvent.click(edge('次のページ'))
  await waitFor(() => assert.equal(activeSlide(), 'a'))

  // 「次」のボタンは、次のページの名前を出す
  fireEvent.click(screen.getByRole('button', { name: /^次\s*ページB$/ }))
  await waitFor(() => assert.equal(activeSlide(), 'b'))
  assert.deepEqual(sent, ['a'])

  // 方法を選ぶまでは、「次」のボタンと右の端の矢印を隠し、押しても送らない
  const next = screen.getByRole('button', { name: /^次\s*ページC$/ })
  assert.equal(next.dataset.hidden, 'true')
  assert.equal(edge('次のページ').dataset.hidden, 'true')
  fireEvent.click(edge('次のページ'))
  await Promise.resolve()
  assert.equal(activeSlide(), 'b')

  fireEvent.click(screen.getByRole('button', { name: '方法を選ぶ' }))
  assert.equal(next.dataset.hidden, 'false')
  assert.equal(edge('次のページ').dataset.hidden, 'false')
  fireEvent.click(edge('次のページ'))
  await waitFor(() => assert.equal(activeSlide(), 'c'))

  // 最後のページの先へは送らない
  assert.equal(edge('次のページ').dataset.hidden, 'true')
  fireEvent.keyDown(screen.getByRole('region', { name: 'テストの台本' }), {
    key: 'ArrowRight',
  })
  await Promise.resolve()
  assert.equal(activeSlide(), 'c')
  assert.deepEqual(sent, ['a', 'b'])
})

test('paged scripts skip the guide page once seen, or when they start from a later page', async () => {
  localStorage.setItem(GUIDE_KEY, 'done')
  const { unmount } = render(createElement(Slides))
  assert.equal(activeSlide(), 'a')
  assert.equal(document.querySelector('[data-slide="scriptGuide"]'), null)
  unmount()

  localStorage.clear()
  render(
    createElement(LessonSlides, {
      label: 'テストの台本',
      slides: [
        { id: 'a', title: 'ページA', stage: null, content: null },
        { id: 'b', title: 'ページB', stage: null, content: null },
      ],
      currentId: 'b',
      totalKnown: true,
      canNext: true,
      onNext() {},
      onBack() {},
    }),
  )
  assert.equal(activeSlide(), 'b')
  assert.equal(document.querySelector('[data-slide="scriptGuide"]'), null)
})

const pointer = (pointerId, clientX, clientY = 80) => ({
  pointerId,
  clientX,
  clientY,
  isPrimary: true,
  button: 0,
})

test('the next button keeps keyboard focus on the script, and a swipe may start on it', async () => {
  stubSize(296, 400)
  stubFinishedAnimations()
  const captured = stubPointerCapture()
  localStorage.setItem(GUIDE_KEY, 'done')
  const carousel = await renderScript()

  // 「次」のボタンで送ると、ボタンは作り直されて消えるので、台本の領域へフォーカスを戻す
  const next = screen.getByRole('button', { name: /^次\s*こう声がけしよう$/ })
  next.focus()
  fireEvent.click(next)
  await waitFor(() => assert.equal(progress(), '台本の進み具合 2 / 3ページ'))
  assert.equal(document.activeElement, carousel)

  // 「次」のボタンの上から始めたスワイプも受ける。押しただけでは捕まえず、横に動いてから捕まえる
  const button = screen.getByRole('button', { name: /^次\s*おしまい$/ })
  fireEvent.pointerDown(button, pointer(3, 200))
  assert.deepEqual(captured, [])
  fireEvent.pointerMove(carousel, pointer(3, 100))
  assert.deepEqual(captured, [3])
  fireEvent.pointerUp(carousel, pointer(3, 100))
  await waitFor(() => assert.equal(progress(), '台本の進み具合 3 / 3ページ'))
})

test('with reduced motion, a drag that springs back leaves the neighbours dimmed and the edges shown', async () => {
  stubSize(296, 400)
  stubAnimations()
  stubPointerCapture()
  // 動きを減らす設定。戻る動きがないので、動き終わりの合図（transitionend）は来ない
  stub(window, 'matchMedia', () => ({
    matches: true,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  }))
  localStorage.setItem(GUIDE_KEY, 'done')
  render(createElement(Slides))
  const region = screen.getByRole('region', { name: 'テストの台本' })
  const track = region.firstElementChild

  // 送るほどは動かさずに離す
  fireEvent.pointerDown(region, pointer(5, 200))
  fireEvent.pointerMove(region, pointer(5, 190))
  assert.equal(track.dataset.moving, 'true')
  assert.notEqual(track.style.minHeight, '')
  fireEvent.pointerUp(region, pointer(5, 190))
  assert.equal(track.dataset.moving, 'false')
  assert.equal(track.style.minHeight, '')
  assert.equal(activeSlide(), 'a')
})
