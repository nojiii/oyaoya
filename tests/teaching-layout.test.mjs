import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { createTestServer } from './viteServer.mjs'

test('every published script has teaching points, reading labels and only supported resource invitations', async () => {
  const server = await createTestServer()
  const previousStorage = globalThis.sessionStorage
  globalThis.sessionStorage = {
    getItem: (key) => (key.startsWith('teaching-started:') ? 'true' : null),
    setItem() {},
  }
  try {
    const { problems } = await server.ssrLoadModule('/src/problems/index.ts')
    const { loadProblem } = await server.ssrLoadModule('/src/pages/loaders.ts')
    const { default: ProblemDetail } = await server.ssrLoadModule(
      '/src/pages/ProblemDetail.tsx',
    )
    const { teaching, questionNotes } = await server.ssrLoadModule(
      '/src/problems/unit-lessons/teaching.ts',
    )
    for (const [id, turns] of Object.entries(teaching)) {
      assert.ok(questionNotes[id], id + ': question note')
      assert.ok(
        turns.every((turn) => turn.parentNote),
        id + ': every teaching step has its own note',
      )
      assert.equal(
        new Set(turns.map((turn) => turn.parentNote)).size,
        turns.length,
        id + ': notes do not repeat',
      )
    }
    for (const id of Object.keys(problems)) {
      const path = '/problems/' + id
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
      try {
        await router.navigate(path)
        assert.equal(router.state.errors, null, id)
        const html = renderToString(createElement(RouterProvider, { router }))
        assert.ok(html.includes('data-script-running'), id)
        const headings = [...html.matchAll(/<h2[^>]*>[\s\S]*?<\/h2>/g)].filter(
          (match) => match[0].includes('お子さんに声に出して読もう'),
        )
        const points = [...html.matchAll(/教え方のポイント/g)]
        assert.ok(headings.length >= 3, id + ': question and teaching steps')
        assert.equal(
          points.length,
          headings.length,
          id + ': every reading step has teaching points',
        )
        const start = html.indexOf('お子さんに声に出して読もう')
        const point = html.indexOf('教え方のポイント', start)
        assert.ok(
          start < point && html.indexOf('/mascot.png', point) > point,
          id + ': heading, points, speech order',
        )
        const hasCounters = [
          'addition-apples',
          'addition-basic',
          'addition-carry',
          'subtraction-basic',
          'subtraction-borrow',
          'counting-to-10',
        ].includes(id)
        assert.equal(
          html.includes('aria-label="おはじきの案内"'),
          hasCounters,
          id + ': counter invitation',
        )
        const hasDiagram = [
          'clock-reading',
          'time-duration',
          'length-compare',
          'shape-sides',
          'shape-corners',
        ].includes(id)
        assert.equal(
          html.includes('の図をタップすると、大きく表示できます。'),
          hasDiagram,
          id + ': diagram invitation',
        )
        assert.ok(
          html.includes('台本の進み具合'),
          id + ': progress is retained',
        )
      } finally {
        router.dispose()
      }
    }
    assert.equal(Object.keys(problems).length, 12)
  } finally {
    if (previousStorage === undefined) delete globalThis.sessionStorage
    else globalThis.sessionStorage = previousStorage
    await server.close()
  }
})
