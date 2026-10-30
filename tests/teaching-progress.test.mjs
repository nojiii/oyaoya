import { test } from 'vitest'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { createMemoryRouter, RouterProvider } from 'react-router'

// 台本の進み具合の復元（sessionStorage）を、問題のページを描いて確かめる
test('saved progress decides whether the preparation or the script opens', async () => {
  const storage = new Map()
  globalThis.sessionStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
  }
  try {
    const { loadProblem } = await import('../src/pages/loaders.ts')
    const { default: ProblemDetail } =
      await import('../src/pages/ProblemDetail.tsx')
    const path = '/problems/addition-within-10'
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
    const { arithmetic } = await import('../src/problems/arithmetic.ts')
    // 数える手順の代わりに、考え方を聞く手順を台本に表示する。
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
  }
})

// ページを分けた台本（flow）の単元では、flow の進み具合で準備の画面とボタンの文字が決まる
test('flow lessons resume in the middle and start over from preparation after finishing', async () => {
  const storage = new Map()
  globalThis.sessionStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
  }
  try {
    const { loadProblem } = await import('../src/pages/loaders.ts')
    const { default: ProblemDetail } =
      await import('../src/pages/ProblemDetail.tsx')
    const render = async (path) => {
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
        return renderToString(createElement(RouterProvider, { router }))
      } finally {
        router.dispose()
      }
    }
    // middle は途中のページ。答えのページのあとに、たしかめがある台本は answer も途中として確かめる
    // （大学祭の問題は pagedFlow でページの位置だけを保存する）
    const pagedLesson = (id, middle, last) => ({
      path: `/problems/${id}`,
      flowKey: `/problems/${id}`,
      prefix: `${id}-flow:v1:`,
      middle,
      last,
      progress: (page) => JSON.stringify({ page }),
    })
    const lessons = [
      {
        path: '/problems/addition-within-10',
        flowKey: '/problems/addition-within-10:3+4',
        prefix: 'addition-flow:v1:',
        middle: 'count',
        last: 'check',
        progress: (page) =>
          JSON.stringify({ route: page === 'read' ? null : 'physical', page }),
      },
      {
        path: '/problems/counting',
        flowKey: '/problems/counting',
        prefix: 'counting-flow:v2:',
        middle: 'count',
        last: 'give',
        progress: (page) => JSON.stringify({ n: 5, page }),
      },
      pagedLesson('math-easy-1', 'discount', 'explain'),
      pagedLesson('math-hard-1', 'center', 'answer'),
      pagedLesson('puzzle-easy-1', 'answer', 'check'),
      pagedLesson('puzzle-hard-1', 'answer', 'check'),
    ]
    for (const { path, flowKey, prefix, middle, last, progress } of lessons) {
      storage.clear()
      const started = `teaching-started:${path}`
      const flow = prefix + flowKey

      // 台本を開いていて、まだ1ページ目 → 台本のまま
      storage.set(started, 'true')
      assert.ok((await render(path)).includes('data-script-running'), path)

      // 途中のページ → 台本の続き。準備に戻ると「途中から台本にもどる」
      storage.set(flow, progress(middle))
      assert.ok((await render(path)).includes('data-script-running'), path)
      storage.set(started, 'false')
      let html = await render(path)
      assert.ok(!html.includes('data-script-running'), path)
      assert.ok(html.includes('途中から台本にもどる'), path)

      // 答えのページはまだ途中（このあとに、たしかめがある）
      storage.set(started, 'true')
      if (last !== 'answer') {
        storage.set(flow, progress('answer'))
        assert.ok((await render(path)).includes('data-script-running'), path)
      }

      // 最後のページ（たしかめ）まで終えた → 開き直すと準備の画面から、「台本をはじめる」
      storage.set(flow, progress(last))
      html = await render(path)
      assert.ok(!html.includes('data-script-running'), path)
      assert.ok(html.includes('台本をはじめる'), path)
    }
  } finally {
    delete globalThis.sessionStorage
  }
})
