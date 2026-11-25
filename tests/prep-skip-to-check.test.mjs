// @vitest-environment happy-dom
import { test } from 'vitest'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { ArithmeticLesson } from '../src/components/ArithmeticLesson.tsx'
import { CountingLesson } from '../src/components/CountingLesson.tsx'
import Sample from '../src/problems/sample/index.tsx'
import {
  additionCheck,
  additionStorageKey,
} from '../src/components/additionFlowState.ts'
import {
  subtractionCheck,
  subtractionStorageKey,
} from '../src/components/subtractionFlowState.ts'
import { stub } from './domStubs.mjs'

function renderLesson(props, component = ArithmeticLesson) {
  // 幕と、ページを送る動きは出さない（動きを減らす設定）。台本の使い方のページは、もう見たことにする
  stub(window, 'matchMedia', () => ({
    matches: true,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  }))
  stub(window, 'scrollTo', () => {})
  localStorage.setItem('oyaoya:script-guide:v2', 'done')
  const router = createMemoryRouter(
    [
      {
        path: '/lesson',
        loader: () => ({ crumbs: [] }),
        element: createElement(component, props),
      },
    ],
    { initialEntries: ['/lesson'] },
  )
  render(createElement(RouterProvider, { router }))
}

// 今出している台本のページ
const activeSlide = () =>
  document.querySelector('[data-slide][data-active="true"]')

const saved = () =>
  JSON.parse(sessionStorage.getItem(additionStorageKey('/lesson', 3, 4)))

test('「わかる」 starts the addition script at the check problem, and 「解説にもどる」 goes back to reading the problem', async () => {
  renderLesson({ mode: 'add', initial: [3, 4], additionFlow: true })
  fireEvent.click(
    await screen.findByRole('button', { name: 'わかる（たしかめ問題へ）' }),
  )

  // 解説をとばして、ちがう数の問題をひとりで解くページから
  const [c, d] = additionCheck(3, 4)
  assert.equal(activeSlide().getAttribute('data-slide'), 'check')
  assert.ok(activeSlide().textContent.includes(`${c}たす${d}は、いくつかな？`))
  // 解説を聞いていないので、「さっきと同じように」とは言わない
  assert.ok(!activeSlide().textContent.includes('さっきと同じように'))
  assert.ok(screen.getByText('1 / 2ページ'))
  assert.deepEqual(saved(), {
    route: null,
    page: 'check',
    appComplete: false,
    checkOnly: true,
  })

  // 解けなかったら、問題を読むページへ戻る
  fireEvent.click(screen.getByRole('button', { name: '解説にもどる' }))
  assert.equal(activeSlide().getAttribute('data-slide'), 'read')
  assert.equal(saved().checkOnly, false)
  assert.equal(saved().page, 'read')
})

test('「台本をはじめる」 starts from the first page even after leaving the script in the middle', async () => {
  sessionStorage.setItem(
    additionStorageKey('/lesson', 3, 4),
    JSON.stringify({ route: 'physical', page: 'count', appComplete: false }),
  )
  renderLesson({ mode: 'add', initial: [3, 4], additionFlow: true })
  // 途中でやめていても、「途中から台本にもどる」は出さない
  fireEvent.click(await screen.findByRole('button', { name: '台本をはじめる' }))
  assert.equal(
    screen.queryByRole('button', { name: '途中から台本にもどる' }),
    null,
  )
  // 続き（count）でも、たしかめの問題でもなく、問題を読むページから
  assert.equal(activeSlide().getAttribute('data-slide'), 'read')
  assert.equal(saved().page, 'read')
  assert.equal(saved().route, null)
})

test('「わかる」 is hidden while the numbers need fixing, and on scripts without a check problem', async () => {
  renderLesson({ mode: 'add', initial: [3, 4], additionFlow: true })
  const input = await screen.findByRole('textbox', { name: '最初の数' })
  fireEvent.focus(input)
  fireEvent.change(input, { target: { value: '9' } })
  fireEvent.focusOut(input)
  assert.ok(
    screen.getByRole('button', { name: '数を直すと、台本をはじめられます' }),
  )
  assert.equal(
    screen.queryByRole('button', { name: 'わかる（たしかめ問題へ）' }),
    null,
  )
})

test('「わかる」 starts the subtraction script at the check problem, and 「解説にもどる」 goes back to reading the problem', async () => {
  renderLesson({ mode: 'sub', initial: [7, 3] })
  fireEvent.click(
    await screen.findByRole('button', { name: 'わかる（たしかめ問題へ）' }),
  )
  const [c, d] = subtractionCheck(7, 3)
  assert.equal(activeSlide().getAttribute('data-slide'), 'check')
  assert.ok(activeSlide().textContent.includes(`${c}ひく${d}は、いくつかな？`))
  assert.ok(!activeSlide().textContent.includes('さっきと同じように'))
  assert.ok(screen.getByText('1 / 2ページ'))
  const savedSub = () =>
    JSON.parse(sessionStorage.getItem(subtractionStorageKey('/lesson', 7, 3)))
  assert.deepEqual(savedSub(), {
    route: null,
    page: 'check',
    appComplete: false,
    checkOnly: true,
  })
  fireEvent.click(screen.getByRole('button', { name: '解説にもどる' }))
  assert.equal(activeSlide().getAttribute('data-slide'), 'read')
  assert.equal(savedSub().checkOnly, false)
  assert.equal(savedSub().page, 'read')
})

test('「台本をはじめる」 starts subtraction from the first page even after leaving the script in the middle', async () => {
  sessionStorage.setItem(
    subtractionStorageKey('/lesson', 7, 3),
    JSON.stringify({ route: 'physical', page: 'count', appComplete: false }),
  )
  renderLesson({ mode: 'sub', initial: [7, 3] })
  fireEvent.click(await screen.findByRole('button', { name: '台本をはじめる' }))
  assert.equal(activeSlide().getAttribute('data-slide'), 'read')
})

test('scripts without pages (subtraction with borrowing) have no 「わかる」', async () => {
  renderLesson({ mode: 'borrow', initial: [13, 5] })
  await screen.findByRole('button', { name: '台本をはじめる' })
  assert.equal(
    screen.queryByRole('button', { name: 'わかる（たしかめ問題へ）' }),
    null,
  )
})

// 数える単元と、見本（新しい問題のコピー元）にも「わかる」を置く
for (const { name, component, props, first } of [
  {
    name: 'counting',
    component: CountingLesson,
    props: { initial: 5 },
    first: 'recount',
  },
  { name: 'sample', component: Sample, props: {}, first: 'check' },
])
  test(`「わかる」 and 「解説にもどる」 also work on ${name}`, async () => {
    renderLesson(props, component)
    fireEvent.click(
      await screen.findByRole('button', { name: 'わかる（たしかめ問題へ）' }),
    )
    assert.equal(activeSlide().getAttribute('data-slide'), first)
    assert.ok(screen.getByText('1 / 2ページ'))
    assert.ok(!activeSlide().textContent.includes('こんどは'))
    fireEvent.click(screen.getByRole('button', { name: '解説にもどる' }))
    assert.equal(activeSlide().getAttribute('data-slide'), 'read')
  })
