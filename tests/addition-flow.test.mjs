import { test } from 'vitest'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { createMemoryRouter, RouterProvider } from 'react-router'

test('addition routes meet at the answer, go back along their own route and move through every page by swiping', async () => {
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
  assert.equal(additionPages(physical.route).length, 9)
  // 答えのページは、前のページでお子さんが答えているので、初めから答えを出す。
  // たしかめも、ひとりで解く → 答えを確かめる、とページを分ける。押して答えを出すページはなく、どれもスワイプ（next）で進む
  for (const page of [
    'prepare',
    'combine',
    'count',
    'answer',
    'explain',
    'check',
  ]) {
    assert.equal(physical.page, page)
    assert.equal(canAdvanceAddition(physical), true, page)
    physical = act(physical, { type: 'next' })
  }
  // 答えを確かめるページが最後
  assert.equal(physical.page, 'checkAnswer')
  assert.equal(canAdvanceAddition(physical), false)
  assert.equal(act(physical, { type: 'next' }).page, 'checkAnswer')
  for (const page of [
    'check',
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
  }
  assert.deepEqual(act(physical, { type: 'back' }), physical)

  let app = act(act(initial, { type: 'next' }), {
    type: 'choose',
    route: 'app',
  })
  assert.equal(app.page, 'choose')
  app = act(app, { type: 'next' })
  assert.equal(app.page, 'app')
  assert.equal(additionPages(app.route).length, 7)
  assert.deepEqual(additionPages(app.route).slice(-3), [
    'explain',
    'check',
    'checkAnswer',
  ])
  assert.equal(canAdvanceAddition(app), false)
  assert.equal(
    act(app, { type: 'next' }).page,
    'app',
    'counter work must finish first',
  )
  app = act(app, { type: 'app-status', complete: true })
  assert.equal(canAdvanceAddition(app), true)
  const completed = act(app, { type: 'next' })
  assert.equal(completed.page, 'answer')
  assert.equal(canAdvanceAddition(completed), true)
  assert.equal(act(completed, { type: 'next' }).page, 'explain')
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
      // 前の形で保存した、「？」で答えを見たか（answerVisible）は読まない
      const restored = restoreAdditionProgress(
        JSON.stringify({
          route,
          page,
          appComplete: true,
          answerVisible: true,
        }),
      )
      // たしかめの最後のページ（答えを確かめる）まで終えたあとは、最初から
      const finished = page === 'checkAnswer'
      assert.deepEqual(
        restored,
        finished ? initial : { route, page, appComplete: false },
      )
      assert.equal(
        additionFlowStatus(JSON.stringify({ route, page })),
        finished ? 'finished' : page === 'read' ? 'start' : 'middle',
      )
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

test('both addition routes render all steps with matching progress, counter reuse and answers on their own pages', async () => {
  const previousStorage = globalThis.sessionStorage
  const storage = new Map()
  globalThis.sessionStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
  }
  try {
    const {
      AdditionFlow,
      AdditionAnswer,
      AdditionCheck,
      AdditionCheckAnswer,
      AdditionEquation,
    } = await import('../src/components/AdditionFlow.tsx')
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
      checkAnswer: '答えを確認しましょう！',
    }
    // 文字の確かめは、タグを取り除いた文で行う
    const textOf = (html) =>
      html.replace(/<!-- -->/g, '').replace(/<[^>]*>/g, '')
    // ページ1枚分の文（ステージ・見出し・本文・「次」の行）
    const slideText = (html, page) => {
      const start = html.indexOf(`data-slide="${page}"`)
      const end = html.indexOf('data-slide=', start + 1)
      return textOf(html.slice(start, end < 0 ? undefined : end))
    }
    for (const [a, b] of [
      [3, 4],
      [2, 5],
      [0, 0],
      [1, 2],
      [2, 3],
      [4, 6],
    ]) {
      const [c, d] = additionCheck(a, b)
      for (const route of ['physical', 'app']) {
        const pages = additionPages(route)
        for (const [index, page] of pages.entries()) {
          // 答えを確かめるページ（最後）は開き直せない（最初からになる）ので、
          // ひとりで解くページを開いたときに、となりのページとして確かめる
          if (page === 'checkAnswer') continue
          storage.set(
            `addition-flow:v1:${path}:${a}+${b}`,
            JSON.stringify({ route, page }),
          )
          const html = render(a, b)
          const active = html.slice(
            html.indexOf(`data-slide="${page}" data-active="true"`),
          )
          const current = slideText(html, page)
          // どのページも、押して答えを出す形にしない（「？」のボタン・「答えを見る」・吹き出しを置かない）
          assert.ok(!html.includes('答えを見る'), `${route}/${page}: no reveal`)
          assert.ok(!html.includes('押して答えを見'), `${route}/${page}`)
          assert.ok(active.includes(titles[page]), `${route}/${page}: title`)
          // 数は準備の画面で決める。台本の中では変えられない
          assert.ok(
            !html.includes('<input'),
            `${route}/${page}: no number input`,
          )
          assert.match(active, /aria-hidden="false"/)
          assert.ok(html.includes(`${index + 1} / ${pages.length}ページ`))
          // 台本は左右にめくるほか、左右の端の矢印でも送れる。最初のページには、前へ戻る矢印を出さない
          const edge = (name) =>
            html.match(
              new RegExp(
                `<button[^>]*data-hidden="(true|false)"[^>]*aria-label="${name}"`,
              ),
            )?.[1]
          assert.equal(
            edge('前のページ'),
            String(index === 0),
            `${route}/${page}: back edge`,
          )
          assert.ok(edge('次のページ'), `${route}/${page}: next edge`)
          // アプリのおはじきは、おはじきのページと、たしかめのひとりで解くページで使う
          assert.equal(
            (html.match(/<dialog /g) ?? []).length,
            route === 'app' ? 2 : 0,
            'only app route uses the existing playground',
          )
          // たしかめのページだけ、見出しの上に区切りの札を出す
          assert.equal(
            active.slice(0, active.indexOf('</h2>')).includes('たしかめ'),
            page === 'explain' || page === 'check',
            `${route}/${page}: section label`,
          )
          // 答えのページは、前のページでお子さんが答えているので、聞き直さずに初めから答えを出す。
          // いつもの「次」の行と右端の矢印で、たしかめへ進む
          if (page === 'answer') {
            assert.ok(current.includes(`${a} ＋ ${b} ＝ ${a + b}`))
            assert.ok(
              current.includes(
                `そう！ ${a}こと${b}こを合わせると、全部で${a + b}こになったね！`,
              ),
            )
            assert.ok(current.includes('ちがう数を答えたら'))
            assert.ok(!current.includes('合わせて何こだった'))
            assert.ok(current.includes(`次${titles.explain}`))
            assert.equal(edge('次のページ'), 'false', `${route}: next edge`)
          }
          // ひとりで解くページは、ちがう数の問題を出すだけで、親は答えを言わない。
          // お子さんが答えたら、本編と同じく、スワイプで答えを確かめるページへ進む
          if (page === 'check') {
            assert.ok(current.includes(`${c} ＋ ${d} ＝ ？`))
            assert.ok(current.includes(`こんどは、${c}たす${d}だよ。`))
            assert.ok(current.includes('全部で何こか教えてね'))
            assert.ok(!current.includes(`全部で${c + d}こ`))
            assert.ok(!current.includes('終わる'))
            assert.ok(current.includes(`次${titles.checkAnswer}`))
            assert.equal(edge('次のページ'), 'false', `${route}: next edge`)
            // 答えを確かめるページ（最後）には、初めから答えと「終わる」を出す
            const last = slideText(html, 'checkAnswer')
            assert.ok(last.includes('たしかめ' + titles.checkAnswer))
            assert.ok(last.includes(`${c} ＋ ${d} ＝ ${c + d}`))
            assert.ok(last.includes(`「${c + d}」と答えたら`))
            assert.ok(last.includes('終わる'))
          }
          if (page === 'prepare')
            assert.ok(
              active.includes(`おはじきが${a}こと${b}こ、別々に並んでいます`),
            )
          // 教え方のポイントは、読み上げる前に確かめられるよう、セリフの上に開いて置く
          if (page === 'combine' || page === 'count') {
            assert.ok(
              active.indexOf('教え方のポイント') >= 0 &&
                active.indexOf('教え方のポイント') <
                  active.indexOf('こう声をかけよう'),
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
      // 部品ごとにも確かめる。答えの式はステージ（AdditionEquation）、声かけは AdditionAnswer に出す
      const renderText = (...elements) =>
        textOf(renderToString(createElement('div', null, ...elements)))
      const shown = renderText(
        createElement(AdditionEquation, { a, b, visible: true }),
        createElement(AdditionAnswer, { a, b }),
      )
      assert.ok(shown.includes(`${a} ＋ ${b} ＝ ${a + b}`))
      assert.ok(shown.includes(`「${a + b}」と答えたら`))
      assert.ok(
        shown.includes(
          `そう！ ${a}こと${b}こを合わせると、全部で${a + b}こになったね！`,
        ),
      )
      assert.ok(shown.includes('ちがう数を答えたら'))
      // お子さんには前のページで答えてもらっているので、同じことを聞き直さない
      assert.ok(shown.includes('お子さんが前のページで答えた数に合わせて'))
      assert.ok(!shown.includes('合わせて何こだった'))
      assert.ok(!shown.includes('\\n') && !shown.includes('**'))
      // 答えのあとは、たしかめへ進む。「終わる」は、たしかめの最後に置く
      assert.ok(!shown.includes('終わる'))

      // たしかめのひとりで解くページ（AdditionCheck）。ちがう数の問題を出し、親は答えを言わない
      const check = renderText(
        createElement(AdditionEquation, { a: c, b: d, visible: false }),
        createElement(AdditionCheck, { a: c, b: d }),
      )
      assert.ok(check.includes(`${c} ＋ ${d} ＝ ？`))
      assert.ok(check.includes(`こんどは、${c}たす${d}だよ。`))
      assert.ok(check.includes('お子さんが答えてから'))
      assert.ok(!check.includes(`全部で${c + d}こ`))
      assert.ok(!check.includes('終わる'))
      assert.ok(!check.includes('\\n') && !check.includes('**'))
      // たしかめの答えを確かめるページ（AdditionCheckAnswer）。初めから答えを出し、「終わる」で終える
      const checkAnswer = renderText(
        createElement(AdditionEquation, { a: c, b: d, visible: true }),
        createElement(AdditionCheckAnswer, { a: c, b: d, onFinish() {} }),
      )
      assert.ok(checkAnswer.includes(`${c} ＋ ${d} ＝ ${c + d}`))
      assert.ok(
        checkAnswer.includes('お子さんが前のページで答えた数に合わせて'),
      )
      assert.ok(checkAnswer.includes(`「${c + d}」と答えたら`))
      assert.ok(checkAnswer.includes(`全部で${c + d}こだね`))
      assert.ok(checkAnswer.includes('ちがう数を答えたら'))
      assert.ok(checkAnswer.includes('終わる'))
      assert.ok(!checkAnswer.includes('\\n') && !checkAnswer.includes('**'))
    }
  } finally {
    if (previousStorage === undefined) delete globalThis.sessionStorage
    else globalThis.sessionStorage = previousStorage
  }
})
