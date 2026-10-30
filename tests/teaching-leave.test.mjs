// @vitest-environment happy-dom
import { test } from 'vitest'
import assert from 'node:assert/strict'
import { createElement, StrictMode } from 'react'
import { act, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { TeachingScript } from '../src/components/TeachingScript.tsx'
import './domStubs.mjs'

// 台本を開いたまま、ブラウザの戻るで単元一覧へ戻り、同じ単元をもう一度開く
test('leaving the script with the browser back button opens the preparation next time', async () => {
  const started = 'teaching-started:/lesson'
  const progress = 'teaching-progress:/lesson:もんだいを読もう'
  const steps = JSON.stringify([
    { turn: 0, beat: 0 },
    { turn: 1, beat: 0 },
  ])
  sessionStorage.setItem(started, 'true')
  sessionStorage.setItem(progress, steps)
  // 使い方の説明は出さない
  localStorage.setItem('oyaoya:script-guide:v1', 'done')
  const router = createMemoryRouter(
    [
      { path: '/units', element: createElement('h1', null, '単元一覧') },
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
    { initialEntries: ['/units', '/lesson'] },
  )
  // 開発中と同じく StrictMode で描く（部品を一度外して付け直しても、台本を開いたままにする）
  render(
    createElement(StrictMode, null, createElement(RouterProvider, { router })),
  )
  await screen.findByRole('region', { name: '声かけの台本' })
  assert.equal(sessionStorage.getItem(started), 'true')

  await act(() => router.navigate(-1))
  await screen.findByRole('heading', { name: '単元一覧' })
  assert.equal(sessionStorage.getItem(started), 'false')
  // 台本の進み具合は残す
  assert.equal(sessionStorage.getItem(progress), steps)

  // 同じ単元をもう一度開くと、準備の画面から。続きへ戻るボタンを出す
  await act(() => router.navigate('/lesson'))
  await screen.findByRole('button', { name: '途中から台本にもどる' })
  assert.equal(screen.queryByRole('region', { name: '声かけの台本' }), null)
})
