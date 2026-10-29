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
    for (const id of Object.keys(problems)) {
      // 文化祭用の問題（math- や puzzle- で始まるID）はテストを除外する
      if (id.startsWith('math-') || id.startsWith('puzzle-')) {
        continue
      }

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
        assert.ok(
          !html.includes('aria-label="取り組む問題"'),
          id + ': no separate question section',
        )
        assert.ok(
          html.includes('aria-label="前のページ"') &&
            html.includes('aria-label="次のページ"'),
          id + ': navigation without swiping',
        )
        if (id === 'addition-within-10') {
          assert.match(html, /data-slide="read" data-active="true"/)
          assert.ok(html.includes('まずは問題を読んでみましょう'))
          assert.ok(html.includes('実物のおはじきを使う'))
          assert.ok(html.includes('アプリのおはじきを使う'))
          assert.ok(html.includes('教え方のポイント'))
          assert.ok(html.includes('aria-label="最初の数"'))
          assert.equal((html.match(/aria-label="最初の数"/g) ?? []).length, 1)
          assert.ok(html.includes('台本の進み具合'))
          assert.ok(!html.includes('おはじきの案内'))
          continue
        }
        if (id === 'counting') {
          assert.match(html, /data-slide="read" data-active="true"/)
          assert.ok(html.includes('何こあるか、数えてみましょう'))
          assert.ok(html.includes('教え方のポイント'))
          assert.ok(html.includes('数える数'))
          assert.ok(html.includes('台本の進み具合'))
          continue
        }
        if (html.includes('aria-label="最初の数"')) {
          const firstCard = html.match(
            /<div[^>]*data-active="true"[\s\S]*?<\/form>/,
          )?.[0]
          assert.ok(
            firstCard?.includes('aria-label="最初の数"'),
            id + ': numbers are editable on the first card',
          )
          assert.equal(
            (html.match(/aria-label="最初の数"/g) ?? []).length,
            1,
            id + ': one number editor',
          )
          assert.match(
            firstCard,
            /class="[^"]*readingBox[^"]*"[\s\S]*<form[\s\S]*aria-label="最初の数"/,
            id + ': editable numbers are inside the reading box',
          )
        }
        const headings = [...html.matchAll(/<h2[^>]*>[\s\S]*?<\/h2>/g)].filter(
          (match) =>
            match[0].replace(/<[^>]*>/g, '').includes('こう声がけしよう'),
        )
        const points = [...html.matchAll(/教え方のポイント/g)]
        assert.ok(headings.length >= 3, id + ': question and teaching steps')
        assert.equal(
          points.length,
          headings.length,
          id + ': every reading step has teaching points',
        )
        const notes = [
          ...html.matchAll(
            /<section[^>]*class="[^"]*parentNote[^"]*"[^>]*>[\s\S]*?<\/section>/g,
          ),
        ]
        assert.equal(
          notes.length,
          headings.length,
          id + ': teaching point sections',
        )
        for (const [note] of notes) {
          const paragraphs = [...note.matchAll(/<p>([\s\S]*?)<\/p>/g)]
          assert.ok(
            paragraphs.length >= 2 && paragraphs.length <= 3,
            id + ': teaching points use short, separate paragraphs',
          )
          assert.ok(
            note.includes('親が最初に確認するところ'),
            id + ': parent label',
          )
          assert.ok(
            note.includes('<strong>'),
            id + ': key phrases are emphasized',
          )
          assert.ok(
            !note.includes('**'),
            id + ': emphasis markers are not shown',
          )
        }
        const start = html.indexOf(headings[0][0])
        const point = html.indexOf('教え方のポイント')
        const mascot = html.indexOf('/mascot.png', point)
        const readingBox = html.indexOf('readingBox', mascot)
        const readingText = html.indexOf('readAloudText', readingBox)
        assert.ok(
          point < mascot &&
            mascot < start &&
            start < readingBox &&
            readingBox < readingText,
          id +
            ': teaching points, mascot, speech cue and reading text appear in order',
        )
        assert.equal(
          html.includes('aria-label="おはじきの案内"'),
          false,
          id + ': no counter invitation inside the script card',
        )
        assert.ok(
          html.includes('台本の進み具合'),
          id + ': progress is retained',
        )
      } finally {
        router.dispose()
      }
    }
  } finally {
    if (previousStorage === undefined) delete globalThis.sessionStorage
    else globalThis.sessionStorage = previousStorage
    await server.close()
  }
})
