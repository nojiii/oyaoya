import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { createTestServer } from './viteServer.mjs'

test('addition routes meet at the answer, go back along their own route and require an explicit reveal', async () => {
  const server = await createTestServer()
  try {
    const {
      advanceAddition: act,
      initialAdditionProgress: initial,
      additionPages,
      canAdvanceAddition,
      restoreAdditionProgress,
    } = await server.ssrLoadModule('/src/components/additionFlowState.ts')
    let physical = act(initial, { type: 'next' })
    assert.equal(physical.page, 'choose')
    assert.deepEqual(
      act(physical, { type: 'next' }),
      physical,
      'choice cannot be skipped',
    )
    physical = act(physical, { type: 'choose', route: 'physical' })
    assert.equal(additionPages(physical.route).length, 6)
    for (const page of ['prepare', 'combine', 'count']) {
      assert.equal(physical.page, page)
      assert.equal(physical.answerVisible, false)
      physical = act(physical, { type: 'next' })
    }
    assert.equal(physical.page, 'answer')
    assert.equal(physical.answerVisible, false)
    physical = act(physical, { type: 'reveal' })
    assert.equal(physical.answerVisible, true)
    assert.equal(act(physical, { type: 'next' }).page, 'answer')
    for (const page of ['count', 'combine', 'prepare', 'choose', 'read']) {
      physical = act(physical, { type: 'back' })
      assert.equal(physical.page, page)
      assert.equal(physical.answerVisible, false)
    }
    assert.deepEqual(act(physical, { type: 'back' }), physical)

    let app = act(act(initial, { type: 'next' }), {
      type: 'choose',
      route: 'app',
    })
    assert.equal(app.page, 'app')
    assert.equal(additionPages(app.route).length, 4)
    assert.equal(canAdvanceAddition(app), false)
    assert.equal(
      act(app, { type: 'next' }).page,
      'app',
      'counter work must finish first',
    )
    assert.equal(act(app, { type: 'reveal' }).answerVisible, false)
    app = act(app, { type: 'app-status', complete: true })
    assert.equal(canAdvanceAddition(app), true)
    const completed = act(app, { type: 'next' })
    assert.equal(completed.page, 'answer')
    assert.equal(completed.answerVisible, false)
    assert.equal(act(completed, { type: 'reveal' }).answerVisible, true)
    app = act(completed, { type: 'back' })
    assert.equal(app.page, 'app')
    app = act(app, { type: 'app-status', complete: false })
    assert.equal(
      canAdvanceAddition(app),
      false,
      'resetting counters clears completion',
    )
    app = act(app, { type: 'back' })
    assert.equal(app.page, 'choose')
    app = act(app, { type: 'choose', route: 'physical' })
    assert.equal(app.page, 'prepare')
    assert.equal(
      app.appComplete,
      false,
      'changing routes clears counter completion',
    )
    assert.deepEqual(act(app, { type: 'restart' }), initial)

    for (const route of ['physical', 'app']) {
      for (const page of additionPages(route)) {
        const restored = restoreAdditionProgress(
          JSON.stringify({
            route,
            page,
            appComplete: true,
            answerVisible: true,
          }),
        )
        assert.equal(restored.page, page)
        assert.equal(restored.route, route)
        assert.equal(restored.answerVisible, false)
        assert.equal(restored.appComplete, false)
      }
    }
    for (const invalid of [
      null,
      '{',
      '{}',
      '{"route":"app","page":"count"}',
      '{"route":null,"page":"answer"}',
    ]) {
      assert.deepEqual(restoreAdditionProgress(invalid), initial)
    }
  } finally {
    await server.close()
  }
})

test('both addition routes render all steps with matching progress, counter reuse and gated answers', async () => {
  const server = await createTestServer()
  const previousStorage = globalThis.sessionStorage
  const storage = new Map()
  globalThis.sessionStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
  }
  try {
    const { AdditionFlow, AdditionAnswer } = await server.ssrLoadModule(
      '/src/components/AdditionFlow.tsx',
    )
    const { additionPages } = await server.ssrLoadModule(
      '/src/components/additionFlowState.ts',
    )
    const path = '/problems/addition-basic'
    const render = (a, b) => {
      const router = createMemoryRouter(
        [
          {
            path,
            element: createElement(AdditionFlow, {
              a,
              b,
              editor: createElement('p', null, `${a} ＋ ${b} ＝ ？`),
            }),
          },
        ],
        { initialEntries: [path] },
      )
      try {
        return renderToString(createElement(RouterProvider, { router }))
      } finally {
        router.dispose()
      }
    }
    const titles = {
      read: 'まずは問題を読んでみましょう',
      choose: 'どちらの方法で教えますか？',
      prepare: 'おはじきを準備しましょう！',
      combine: 'おはじきを合わせてみましょう',
      count: '全部でいくつになったかな？',
      app: 'アプリのおはじきを使いましょう',
      answer: '答えを確認しましょう！',
    }
    for (const [a, b] of [
      [3, 4],
      [2, 5],
      [0, 0],
      [9, 9],
    ]) {
      for (const route of ['physical', 'app']) {
        const pages = additionPages(route)
        for (const [index, page] of pages.entries()) {
          storage.set(
            `addition-flow:v1:${path}:${a}+${b}`,
            JSON.stringify({ route, page }),
          )
          const html = render(a, b)
          const active = html.slice(
            html.indexOf(`data-slide="${page}" data-active="true"`),
          )
          assert.ok(active.includes(titles[page]), `${route}/${page}: title`)
          assert.match(active, /aria-hidden="false"/)
          assert.ok(html.includes(`${index + 1} / ${pages.length}ページ`))
          assert.ok(
            html.includes('aria-label="前のページ"') &&
              html.includes('aria-label="次のページ"'),
          )
          assert.equal(
            (html.match(/<dialog /g) ?? []).length,
            route === 'app' ? 1 : 0,
            'only app route uses the existing playground',
          )
          assert.ok(
            !html.includes(`全部で<!-- -->${a + b}<!-- -->個になったね`),
            'answer speech is not rendered before reveal',
          )
          if (page === 'prepare')
            assert.ok(
              active.includes(`おはじきが${a}個と${b}個、別々に並んでいます`),
            )
          if (page === 'combine' || page === 'count') {
            assert.ok(
              active.indexOf('教え方のポイント') <
                active.indexOf('こう声をかけよう'),
            )
          }
          if (page === 'answer') assert.ok(active.includes('答えを見る'))
        }
      }
      const renderAnswer = (visible) =>
        renderToString(
          createElement(AdditionAnswer, {
            a,
            b,
            visible,
            onReveal() {},
            onRestart() {},
          }),
        ).replace(/<!-- -->/g, '')
      const hidden = renderAnswer(false)
      assert.ok(hidden.includes(`${a} ＋ ${b} ＝ ？`))
      assert.ok(!hidden.includes('こう声をかけよう'))
      const shown = renderAnswer(true)
      assert.ok(shown.includes(`${a} ＋ ${b} ＝ ${a + b}`))
      assert.ok(
        shown.includes(
          `${a}個と${b}個を合わせると、全部で${a + b}個になったね！`,
        ),
      )
      assert.ok(!shown.includes('答えを見る'))
    }
  } finally {
    if (previousStorage === undefined) delete globalThis.sessionStorage
    else globalThis.sessionStorage = previousStorage
    await server.close()
  }
})
