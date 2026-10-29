import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { createTestServer } from './viteServer.mjs'

test('counting renders every page, lets the parent pick 1 to 10 and follows one path without branching', async () => {
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
    const key = `counting-flow:v2:${path}`
    const renderFlow = (n) =>
      render(
        createElement(CountingFlow, {
          n,
          editor: createElement('p', null, '数える数'),
        }),
      )
    const activeSlide = (html) =>
      html.match(/data-slide="(\w+)" data-active="true"/)?.[1]
    for (const n of [1, 5, 10]) {
      for (const page of countingPages) {
        storage.set(key, JSON.stringify({ n, page }))
        const html = renderFlow(n)
        // 最後のページまで終えたあとは、最初のページから始め直す
        const expected = page === 'answer' ? 'read' : page
        assert.equal(activeSlide(html), expected, `${n}/${page}: restored page`)
        assert.ok(
          html.includes(
            `${countingPages.indexOf(expected) + 1} / ${countingPages.length}ページ`,
          ),
        )
        assert.ok(html.includes('aria-label="数える台本"'))
        // 注意文の改行と強調は、\n や ** の文字のまま出ない
        assert.ok(!html.includes('\\n'), `${n}/${page}: no literal \\n`)
        assert.ok(!html.includes('**'), `${n}/${page}: no literal **`)
        for (const [slide, title] of Object.entries(titles)) {
          const content = html.slice(html.indexOf(`data-slide="${slide}"`))
          assert.ok(content.includes(title), `${n}/${slide}: title`)
        }
        assert.ok(html.includes(`おはじきが${n}こ、1列に並んでいます`))
        // できなかったときの分かれ道は作らず、聞いて確かめる一本道にする
        const answer = html.slice(html.indexOf('data-slide="answer"'))
        assert.ok(answer.includes('全部で何こだった？'))
        assert.ok(answer.includes('最後に言った数が、全部の数だよ。'))
        assert.ok(!answer.includes('ちがう数'))
        assert.ok(answer.includes('数を変えて、もう1回'))
      }
    }
    // 保存したときと違う数なら、最初のページから
    storage.set(key, JSON.stringify({ n: 5, page: 'count' }))
    assert.equal(activeSlide(renderFlow(3)), 'read')
    assert.equal(activeSlide(renderFlow(5)), 'count')
    assert.equal(
      restoreCountingPage(JSON.stringify({ n: 5, page: 'line' }), 5),
      'line',
    )
    assert.equal(
      restoreCountingPage(JSON.stringify({ n: 5, page: 'line' }), 3),
      'read',
    )
    assert.equal(
      restoreCountingPage(JSON.stringify({ n: 5, page: 'app' }), 5),
      'read',
    )
    assert.equal(restoreCountingPage('count', 5), 'read')
    assert.equal(restoreCountingPage('{', 5), 'read')
    assert.equal(restoreCountingPage(null, 5), 'read')

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
    // 準備画面の使い方と教え方のポイントは、数える単元に合わせた文
    assert.ok(
      prepare.includes(
        'お子さんが数えるのを見守り、最後に言った数を一緒に確かめます。',
      ),
    )
    assert.ok(prepare.includes('身近なものを、お子さんが1こずつ指さして数える'))
    assert.ok(!prepare.includes('一緒に答えを考えます'))
    assert.ok(prepare.includes('2. 順番に声をかける'))
    assert.ok(prepare.includes('指でさしながら、1こずつ数えてみよう。'))
    assert.ok(prepare.includes('（答えたら）最後に言った数が、全部の数だよ。'))
    assert.ok(!prepare.includes('**'))
  } finally {
    if (previousStorage === undefined) delete globalThis.sessionStorage
    else globalThis.sessionStorage = previousStorage
    await server.close()
  }
})
