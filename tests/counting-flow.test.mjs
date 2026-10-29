import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { createTestServer } from './viteServer.mjs'

test('counting renders every page, lets the parent pick 1 to 10 and branches on the child answer', async () => {
  const server = await createTestServer()
  const previousStorage = globalThis.sessionStorage
  const storage = new Map()
  globalThis.sessionStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
  }
  try {
    const { CountingFlow } = await server.ssrLoadModule(
      '/src/components/CountingFlow.tsx',
    )
    const { loadProblem } = await server.ssrLoadModule('/src/pages/loaders.ts')
    const { default: ProblemDetail } = await server.ssrLoadModule(
      '/src/pages/ProblemDetail.tsx',
    )
    const { countingPages, restoreCountingPage } = await server.ssrLoadModule(
      '/src/components/countingFlowState.ts',
    )
    const path = '/problems/counting'
    const render = (element) => {
      const router = createMemoryRouter([{ path, element }], {
        initialEntries: [path],
      })
      try {
        return renderToString(
          createElement(RouterProvider, { router }),
        ).replace(/<!-- -->/g, '')
      } finally {
        router.dispose()
      }
    }
    const titles = {
      read: '何こあるか、数えてみましょう',
      line: '1列に並べましょう',
      count: '1こずつ指さして数えましょう',
      answer: '全部で何こだったかな？',
    }
    for (const n of [1, 5, 10]) {
      for (const [index, page] of countingPages.entries()) {
        storage.set(`counting-flow:v1:${path}:${n}`, page)
        const html = render(
          createElement(CountingFlow, {
            n,
            editor: createElement('p', null, '数える数'),
          }),
        )
        const active = html.slice(
          html.indexOf(`data-slide="${page}" data-active="true"`),
        )
        assert.ok(active.includes(titles[page]), `${n}/${page}: title`)
        assert.ok(html.includes(`${index + 1} / ${countingPages.length}ページ`))
        // 注意文の改行は段落になり、\n の文字のまま出ない
        assert.ok(!html.includes('\\n'), `${n}/${page}: no literal \\n`)
        if (page === 'line')
          assert.ok(active.includes(`おはじきが${n}こ、1列に並んでいます`))
        if (page === 'answer') {
          // できなかったときの分かれ道は作らず、聞いて確かめる一本道にする
          assert.ok(active.includes('全部で何こだった？'))
          assert.ok(active.includes(`最後に「${n}」って言ったね`))
          assert.ok(!active.includes('ちがう数'))
          assert.ok(active.includes('数を変えて、もう1回'))
        }
      }
    }
    assert.equal(restoreCountingPage('count'), 'count')
    assert.equal(restoreCountingPage('app'), 'read')
    assert.equal(restoreCountingPage(null), 'read')

    // 準備画面では、1〜10を選べて、セリフを先に読める
    storage.clear()
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
    const prepare = renderToString(
      createElement(RouterProvider, { router }),
    ).replace(/<!-- -->/g, '')
    router.dispose()
    for (let value = 1; value <= 10; value++)
      assert.match(prepare, new RegExp(`<button[^>]*>${value}</button>`))
    assert.equal((prepare.match(/aria-pressed="true"/g) ?? []).length, 1)
    assert.match(prepare, /aria-pressed="true"[^>]*>5</)
    assert.ok(prepare.includes('声かけを先に読んでおく'))
    assert.ok(prepare.includes('指でさしながら、1こずつ数えてみよう。'))
  } finally {
    if (previousStorage === undefined) delete globalThis.sessionStorage
    else globalThis.sessionStorage = previousStorage
    await server.close()
  }
})
