// @vitest-environment happy-dom
import { test } from 'vitest'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { loadProblem } from '../src/pages/loaders.ts'
import ProblemDetail from '../src/pages/ProblemDetail.tsx'
import { stub, stubAnimations, stubSize } from './domStubs.mjs'

// 【試し】ひとりで解く前の、もう1問やるかを決めるページ。「ここで終わる」で準備の画面へ戻り、
// 最後まで終えたときと同じく、次は最初のページから（「途中から台本にもどる」を出さない）
const lessons = [
  {
    path: '/problems/addition-within-10',
    flowKey: 'addition-flow:v1:/problems/addition-within-10:3+4',
    progress: JSON.stringify({ route: 'physical', page: 'more' }),
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

for (const { path, flowKey, progress } of lessons)
  test(`ending on the another-problem page starts over next time: ${path}`, async () => {
    stubSize(360, 640)
    stubAnimations()
    // 動きを減らす設定にして、幕を出さずにすぐ準備の画面へ切り替える
    stub(window, 'matchMedia', () => ({
      matches: true,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
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

    // 続きから、もう1問やるかを決めるページが開く
    const end = await screen.findByRole('button', { name: 'ここで終わる' })
    fireEvent.click(end)

    // 準備の画面へ戻り、保存した進み具合は消える
    await screen.findByRole('button', { name: '台本をはじめる' })
    assert.equal(sessionStorage.getItem(flowKey), null)
    assert.equal(
      screen.queryByRole('button', { name: '途中から台本にもどる' }),
      null,
    )
  })
