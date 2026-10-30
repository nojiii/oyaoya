import { test } from 'vitest'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { createMemoryRouter, RouterProvider } from 'react-router'

test('addition routes meet at the answer, go back along their own route and require an explicit reveal', async () => {
  const {
    advanceAddition: act,
    initialAdditionProgress: initial,
    additionPages,
    canAdvanceAddition,
    restoreAdditionProgress,
    additionFlowStatus,
    additionCheck,
  } = await import('../src/components/additionFlowState.ts')
  let physical = act(initial, { type: 'next' })
  assert.equal(physical.page, 'choose')
  assert.deepEqual(
    act(physical, { type: 'next' }),
    physical,
    'choice cannot be skipped',
  )
  physical = act(physical, { type: 'choose', route: 'physical' })
  // 選んでもページは進まず、スワイプ（next）で進む
  assert.equal(physical.page, 'choose')
  assert.equal(canAdvanceAddition(physical), true)
  physical = act(physical, { type: 'next' })
  assert.equal(additionPages(physical.route).length, 8)
  for (const page of ['prepare', 'combine', 'count']) {
    assert.equal(physical.page, page)
    assert.equal(physical.answerVisible, false)
    physical = act(physical, { type: 'next' })
  }
  assert.equal(physical.page, 'answer')
  assert.equal(physical.answerVisible, false)
  // 答えを見るまでは、たしかめへ進めない
  assert.equal(act(physical, { type: 'next' }).page, 'answer')
  physical = act(physical, { type: 'reveal' })
  assert.equal(physical.answerVisible, true)
  // たしかめ：話してもらう → ひとりで解く。ひとりで解くページが最後で、答えはまた「？」で見る
  physical = act(physical, { type: 'next' })
  assert.equal(physical.page, 'explain')
  assert.equal(physical.answerVisible, false)
  assert.equal(act(physical, { type: 'reveal' }).answerVisible, false)
  physical = act(physical, { type: 'next' })
  assert.equal(physical.page, 'check')
  assert.equal(physical.answerVisible, false)
  physical = act(physical, { type: 'reveal' })
  assert.equal(physical.answerVisible, true)
  assert.equal(canAdvanceAddition(physical), false)
  assert.equal(act(physical, { type: 'next' }).page, 'check')
  for (const page of [
    'explain',
    'answer',
    'count',
    'combine',
    'prepare',
    'choose',
    'read',
  ]) {
    physical = act(physical, { type: 'back' })
    assert.equal(physical.page, page)
    assert.equal(physical.answerVisible, false)
  }
  assert.deepEqual(act(physical, { type: 'back' }), physical)

  let app = act(act(initial, { type: 'next' }), {
    type: 'choose',
    route: 'app',
  })
  assert.equal(app.page, 'choose')
  app = act(app, { type: 'next' })
  assert.equal(app.page, 'app')
  assert.equal(additionPages(app.route).length, 6)
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
  assert.equal(app.page, 'choose')
  assert.equal(act(app, { type: 'next' }).page, 'prepare')
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
      // たしかめの最後のページまで終えたあとは、最初から
      const finished = page === 'check'
      assert.equal(restored.page, finished ? 'read' : page)
      assert.equal(restored.route, finished ? null : route)
      assert.equal(
        additionFlowStatus(JSON.stringify({ route, page })),
        finished ? 'finished' : page === 'read' ? 'start' : 'middle',
      )
      assert.equal(restored.answerVisible, false)
      assert.equal(restored.appComplete, false)
    }
  }
  // ひとりで解く問題は、10までのたし算のままで、答えが元の問題と1だけ違う
  for (let a = 0; a <= 10; a++) {
    for (let b = 0; a + b <= 10; b++) {
      const [c, d] = additionCheck(a, b)
      assert.ok(c >= 0 && d >= 0 && c + d <= 10, `${a}+${b} → ${c}+${d}`)
      assert.equal(Math.abs(c + d - (a + b)), 1, `${a}+${b} → ${c}+${d}`)
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
})

test('both addition routes render all steps with matching progress, counter reuse and gated answers', async () => {
  const previousStorage = globalThis.sessionStorage
  const storage = new Map()
  globalThis.sessionStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
  }
  try {
    const { AdditionFlow, AdditionAnswer, AdditionCheck, AdditionEquation } =
      await import('../src/components/AdditionFlow.tsx')
    const { additionPages, additionCheck } =
      await import('../src/components/additionFlowState.ts')
    const path = '/problems/addition-within-10'
    const render = (a, b) => {
      const router = createMemoryRouter(
        [
          {
            path,
            element: createElement(AdditionFlow, { a, b }),
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
      explain: 'どうやって数えたか、聞いてみましょう',
      check: 'ひとりで解いてみましょう',
    }
    for (const [a, b] of [
      [3, 4],
      [2, 5],
      [0, 0],
      [1, 2],
      [2, 3],
      [4, 6],
    ]) {
      for (const route of ['physical', 'app']) {
        const pages = additionPages(route)
        for (const [index, page] of pages.entries()) {
          // 答えのページは、保存から開き直すと答えを見る前に戻るので、下の AdditionAnswer で確かめる。
          // ひとりで解くページは開き直せない（最初からになる）ので、下の AdditionCheck で確かめる
          if (page === 'answer' || page === 'check') continue
          storage.set(
            `addition-flow:v1:${path}:${a}+${b}`,
            JSON.stringify({ route, page }),
          )
          const html = render(a, b)
          const active = html.slice(
            html.indexOf(`data-slide="${page}" data-active="true"`),
          )
          assert.ok(active.includes(titles[page]), `${route}/${page}: title`)
          // 数は準備の画面で決める。台本の中では変えられない
          assert.ok(
            !html.includes('<input'),
            `${route}/${page}: no number input`,
          )
          assert.match(active, /aria-hidden="false"/)
          assert.ok(html.includes(`${index + 1} / ${pages.length}ページ`))
          // 台本はスワイプだけで送る（前へ・次へのボタンはない）
          assert.ok(
            !html.includes('aria-label="前のページ"') &&
              !html.includes('aria-label="次のページ"'),
          )
          // アプリのおはじきは、おはじきのページと、たしかめのひとりで解くページで使う
          assert.equal(
            (html.match(/<dialog /g) ?? []).length,
            route === 'app' ? 2 : 0,
            'only app route uses the existing playground',
          )
          // たしかめのページだけ、見出しの上に区切りの札を出す
          assert.equal(
            active.slice(0, active.indexOf('</h2>')).includes('たしかめ'),
            page === 'explain',
            `${route}/${page}: section label`,
          )
          assert.ok(
            !html.includes(`全部で<!-- -->${a + b}<!-- -->こになったね`),
            'answer speech is not rendered before reveal',
          )
          if (page === 'prepare')
            assert.ok(
              active.includes(`おはじきが${a}こと${b}こ、別々に並んでいます`),
            )
          // 読み上げるセリフを主役にして、教え方のポイントはその下にたたんでおく
          if (page === 'combine' || page === 'count') {
            assert.ok(
              active.indexOf('こう声をかけよう') <
                active.indexOf('教え方のポイント'),
            )
          }
          if (page === 'count')
            assert.equal(
              /\d……/.test(active),
              a + b > 5,
              'parent counts aloud only when the child still has numbers left to count',
            )
        }
      }
      // 式と答えを見る「？」はステージ（AdditionEquation）、声かけは AdditionAnswer に出す。
      // 文字の確かめは、タグを取り除いた文で行う
      const renderAnswer = (visible) =>
        renderToString(
          createElement(
            'div',
            null,
            createElement(AdditionEquation, { a, b, visible }),
            createElement(AdditionAnswer, { a, b, visible }),
          ),
        ).replace(/<!-- -->/g, '')
      const textOf = (html) => html.replace(/<[^>]*>/g, '')
      const hiddenHtml = renderAnswer(false)
      const hidden = textOf(hiddenHtml)
      assert.ok(hidden.includes(`${a} ＋ ${b} ＝ ？`))
      assert.ok(hiddenHtml.includes('aria-label="答えを見る"'))
      // 答えを見る前は、お子さんに答えを聞くだけで、親は答えを言わない
      assert.ok(hidden.includes(`${a}こと${b}こ、合わせて何こだった？`))
      assert.ok(!hidden.includes(`全部で${a + b}こ`))
      const shownHtml = renderAnswer(true)
      const shown = textOf(shownHtml)
      assert.ok(shown.includes(`${a} ＋ ${b} ＝ ${a + b}`))
      assert.ok(shown.includes(`「${a + b}」と答えたら`))
      assert.ok(
        shown.includes(
          `そう！ ${a}こと${b}こを合わせると、全部で${a + b}こになったね！`,
        ),
      )
      assert.ok(shown.includes('ちがう数を答えたら'))
      assert.ok(!shownHtml.includes('答えを見る'))
      // 答えのあとは、たしかめへ進む。「終わる」は、たしかめの最後に置く
      assert.ok(!shown.includes('終わる'))

      // たしかめのひとりで解くページ。ちがう数の問題を出し、答えを見る前は親が答えを言わない
      const [c, d] = additionCheck(a, b)
      const renderCheck = (visible) =>
        textOf(
          renderToString(
            createElement(
              'div',
              null,
              createElement(AdditionEquation, { a: c, b: d, visible }),
              createElement(AdditionCheck, {
                a: c,
                b: d,
                visible,
                onFinish() {},
              }),
            ),
          ).replace(/<!-- -->/g, ''),
        )
      const checkHidden = renderCheck(false)
      assert.ok(checkHidden.includes(`${c} ＋ ${d} ＝ ？`))
      assert.ok(checkHidden.includes(`こんどは、${c}たす${d}だよ。`))
      assert.ok(!checkHidden.includes(`全部で${c + d}こ`))
      assert.ok(!checkHidden.includes('終わる'))
      assert.ok(!checkHidden.includes('\\n'))
      const checkShown = renderCheck(true)
      assert.ok(checkShown.includes(`${c} ＋ ${d} ＝ ${c + d}`))
      assert.ok(checkShown.includes(`「${c + d}」と答えたら`))
      assert.ok(checkShown.includes(`全部で${c + d}こだね`))
      assert.ok(checkShown.includes('終わる'))
      assert.ok(!checkShown.includes('\\n') && !checkShown.includes('**'))
    }
  } finally {
    if (previousStorage === undefined) delete globalThis.sessionStorage
    else globalThis.sessionStorage = previousStorage
  }
})
