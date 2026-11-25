// @vitest-environment happy-dom
import { test } from 'vitest'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { loadProblem } from '../src/pages/loaders.ts'
import ProblemDetail from '../src/pages/ProblemDetail.tsx'
import { stub, stubAnimations, stubSize } from './domStubs.mjs'

// 答えのあと、たしかめに進むかを決めるページ（ContinueToCheck）。「ここで終わる」で準備の画面へ戻り、
// 最後まで終えたときと同じく、保存した進み具合を消す
const lessons = [
  {
    path: '/problems/addition-within-10',
    flowKey: 'addition-flow:v1:/problems/addition-within-10:3+4',
    progress: JSON.stringify({ route: 'physical', page: 'more' }),
  },
  {
    path: '/problems/addition-making-ten',
    flowKey: 'addition-flow:v1:/problems/addition-making-ten:8+5',
    progress: JSON.stringify({ route: 'app', page: 'more' }),
  },
  {
    path: '/problems/counting',
    flowKey: 'counting-flow:v2:/problems/counting',
    progress: JSON.stringify({ n: 5, page: 'more' }),
  },
  {
    path: '/problems/sample',
    flowKey: 'sample-flow:v1:/problems/sample',
    progress: JSON.stringify({ eat: 2, route: 'physical', page: 'more' }),
  },
]

// reducedMotion: 動きを減らす設定。幕を出さずに、すぐ準備の画面へ切り替える。
// そうでないときは幕を出す（幕の動きは、すぐに終わったことにする）
async function endHere({ path, flowKey, progress }, { reducedMotion }) {
  stubSize(360, 640)
  stubAnimations()
  if (reducedMotion)
    stub(window, 'matchMedia', () => ({
      matches: true,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
    }))
  else
    stub(Element.prototype, 'animate', () => ({
      finished: Promise.resolve(),
      cancel() {},
    }))
  localStorage.setItem('oyaoya:script-guide:v2', 'done')
  sessionStorage.setItem(`teaching-started:${path}`, 'true')
  sessionStorage.setItem(flowKey, progress)
  const router = createMemoryRouter(
    [
      {
        path: '/problems/:problemId',
        loader: ({ params }) => loadProblem(params.problemId),
        element: createElement(ProblemDetail),
      },
    ],
    { initialEntries: [path] },
  )
  render(createElement(RouterProvider, { router }))

  // 続きから、たしかめに進むかを決めるページが開く（となりのページは押せないので、見つかるのはこのページのボタンだけ）
  const end = await screen.findByRole('button', { name: 'ここで終わる' })
  fireEvent.click(end)

  // 準備の画面へ戻り、保存した進み具合は消える
  await screen.findByRole(
    'button',
    { name: '台本をはじめる' },
    { timeout: 3000 },
  )
  assert.equal(sessionStorage.getItem(flowKey), null)
}

for (const lesson of lessons)
  test(`ending before the check starts over next time: ${lesson.path}`, () =>
    endHere(lesson, { reducedMotion: true }))

// 幕を出すときも、幕で隠れている間に進み具合を消して、準備の画面へ戻る
test('ending before the check with the curtain also starts over next time', () =>
  endHere(lessons[0], { reducedMotion: false }))
