import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { createTestServer } from './viteServer.mjs'

// 台本の進み具合の復元（sessionStorage）を、問題のページを描いて確かめる
test('saved progress decides whether the preparation or the script opens', async () => {
  const server = await createTestServer()
  const storage = new Map()
  globalThis.sessionStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
  }
  try {
    const { loadProblem } = await server.ssrLoadModule('/src/pages/loaders.ts')
    const { default: ProblemDetail } = await server.ssrLoadModule(
      '/src/pages/ProblemDetail.tsx',
    )
    const path = '/problems/addition-basic'
    const render = async () => {
      const router = createMemoryRouter(
        [
          {
            path: '/problems/:problemId',
            loader: ({ params }) => loadProblem(params.problemId, false),
            element: createElement(ProblemDetail),
          },
        ],
        { initialEntries: [path] },
      )
      await router.navigate(path)
      try {
        const html = renderToString(createElement(RouterProvider, { router }))
        return html.includes('data-script-running') ? 'script' : 'prepare'
      } finally {
        router.dispose()
      }
    }
    const question = '3 + 4 = ?'
    const progressKey = (say) => `teaching-progress:${path}:${say}`

    assert.equal(await render(), 'prepare')

    // 台本を開いたまま数字を変えた（新しい問題の進み具合はまだない）→ 台本のまま
    storage.set(`teaching-started:${path}`, 'true')
    assert.equal(await render(), 'script')

    // 途中まで進めた問題 → 台本の続き
    storage.set(
      progressKey(question),
      JSON.stringify([
        { turn: 0, beat: 0 },
        { turn: 1, beat: 0 },
      ]),
    )
    assert.equal(await render(), 'script')

    // 最後まで終えた問題 → 準備の画面から
    const { arithmetic } = await server.ssrLoadModule(
      '/src/problems/arithmetic.ts',
    )
    const finish = arithmetic('add', 3, 4).steps.length + 1
    storage.set(
      progressKey(question),
      JSON.stringify([
        { turn: 0, beat: 0 },
        { turn: finish, beat: 0 },
      ]),
    )
    assert.equal(await render(), 'prepare')
  } finally {
    delete globalThis.sessionStorage
    await server.close()
  }
})
