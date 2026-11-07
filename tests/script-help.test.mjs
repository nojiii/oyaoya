// @vitest-environment happy-dom
import { test } from 'vitest'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { TeachingScript } from '../src/components/TeachingScript.tsx'
import { stub } from './domStubs.mjs'

// 台本を開いたところから描く。使い方のページは出さない
function renderScript(props = {}) {
  sessionStorage.setItem('teaching-started:/lesson', 'true')
  localStorage.setItem('oyaoya:script-guide:v2', 'done')
  const router = createMemoryRouter(
    [
      {
        path: '/lesson',
        loader: () => ({ crumbs: [] }),
        element: createElement(TeachingScript, {
          prepare: {
            goal: '',
            materials: [],
            point: 'すぐに答えを言わない',
            avoid: [],
          },
          question: { say: 'もんだいを読もう' },
          turns: [{ say: 'つぎの声かけ' }],
          ...props,
        }),
      },
    ],
    { initialEntries: ['/lesson'] },
  )
  render(createElement(RouterProvider, { router }))
}

test('the help sheet shows one line to say for the chosen trouble, and the problem can replace it', async () => {
  renderScript({
    help: { wrong: { say: 'ゆびでさして教えて？', do: '図で確かめます。' } },
  })
  fireEvent.click(await screen.findByRole('button', { name: '困ったら' }))
  const sheet = screen.getByRole('dialog', { name: 'どうしましたか？' })
  assert.equal(sheet.open, true)

  // 書き換えていない困りごとは、全問共通の答え
  fireEvent.click(
    screen.getByRole('button', { name: '答えられない・だまっている' }),
  )
  screen.getByText('ゆっくりでいいよ。どこまでわかった？')

  // 選び直すと、問題で書き換えた答えが出る
  fireEvent.click(screen.getByRole('button', { name: '困りごとを選び直す' }))
  fireEvent.click(screen.getByRole('button', { name: 'ちがう答えを言った' }))
  screen.getByText('ゆびでさして教えて？')

  // 「何を言えばいいか迷う」では、今日の教え方のポイントも出す
  fireEvent.click(screen.getByRole('button', { name: '困りごとを選び直す' }))
  fireEvent.click(screen.getByRole('button', { name: '何を言えばいいか迷う' }))
  screen.getByText('すぐに答えを言わない')

  fireEvent.click(screen.getByRole('button', { name: '台本にもどる' }))
  assert.equal(sheet.open, false)
  // 台本はそのまま
  screen.getByRole('region', { name: '声かけの台本' })
})

test('stopping for today from the help sheet returns to the preparation and keeps the progress', async () => {
  // 動きを減らす設定にして、幕を出さずにすぐ切り替える
  stub(window, 'matchMedia', () => ({
    matches: true,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  }))
  sessionStorage.setItem(
    'teaching-progress:/lesson:もんだいを読もう',
    JSON.stringify([
      { turn: 0, beat: 0 },
      { turn: 1, beat: 0 },
    ]),
  )
  renderScript()
  fireEvent.click(await screen.findByRole('button', { name: '困ったら' }))
  fireEvent.click(
    screen.getByRole('button', { name: '疲れた・いやがっている' }),
  )
  fireEvent.click(screen.getByRole('button', { name: '今日はここまでにする' }))

  await screen.findByRole('button', { name: '途中から台本にもどる' })
  assert.equal(screen.queryByRole('region', { name: '声かけの台本' }), null)
})
