import { test } from 'vitest'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { createMemoryRouter, RouterProvider } from 'react-router'

test('counting renders every page, lets the parent pick 1 to 10 and follows one path without branching', async () => {
  const previousStorage = globalThis.sessionStorage
  const storage = new Map()
  globalThis.sessionStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
  }
  try {
    const { CountingFlow } = await import('../src/components/CountingFlow.tsx')
    const { loadProblem } = await import('../src/pages/loaders.ts')
    const { default: ProblemDetail } =
      await import('../src/pages/ProblemDetail.tsx')
    const { countingPages, restoreCountingProgress, countingFlowStatus } =
      await import('../src/components/countingFlowState.ts')
    const restoreCountingPage = (raw, n) => restoreCountingProgress(raw, n).page
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
      recount: '反対のはしから数えてみましょう',
      more: 'たしかめに進みますか？',
    }
    const key = `counting-flow:v2:${path}`
    const renderFlow = (n) => render(createElement(CountingFlow, { n }))
    const activeSlide = (html) =>
      html.match(/data-slide="(\w+)" data-active="true"/)?.[1]
    for (const n of [1, 5, 10]) {
      for (const page of countingPages) {
        storage.set(key, JSON.stringify({ n, page }))
        const html = renderFlow(n)
        // 最後のページ（たしかめ）まで終えたあとは、最初のページから始め直す
        const expected = page === 'give' ? 'read' : page
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
        // 数える数は準備の画面で選ぶ。台本の中では変えられない
        assert.ok(
          !html.includes('aria-pressed'),
          `${n}/${page}: no number choice`,
        )
        const slide = (id) =>
          html.slice(
            html.indexOf(`data-slide="${id}"`),
            html.indexOf('data-slide=', html.indexOf(`data-slide="${id}"`) + 1),
          )
        // できなかったときの分かれ道は作らず、聞いて確かめる一本道にする
        const answer = slide('answer')
        assert.ok(answer.includes('全部で何こだった？'))
        assert.ok(answer.includes('最後に言った数が、全部の数だよ。'))
        assert.ok(!answer.includes('ちがう数'))
        assert.ok(!answer.includes('終わる'))
        // たしかめ：反対のはしから数え直す → 言われた数だけ取る。言う数は、全部ではなく半分（切り上げ）
        const recount = slide('recount')
        assert.ok(recount.includes('たしかめ'))
        assert.ok(recount.includes('反対のはしから数えてみよう'))
        // 答えのあと、ほめてから、たしかめに進むかを決める（やめるときは「ここで終わる」）。たしかめの前なので、札は付けない
        const more = slide('more')
        assert.ok(
          more.includes(
            'よくがんばったね！ もうちょっとだけ、やってみようか？',
          ),
        )
        assert.ok(more.includes('ここで終わる'))
        assert.ok(!/<h2[^>]*><span[^>]*>たしかめ<\/span>/.test(more))
        assert.ok(/<h2[^>]*><span[^>]*>たしかめ<\/span>/.test(recount))
        const give = html.slice(html.indexOf('data-slide="give"'))
        const m = Math.ceil(n / 2)
        assert.ok(give.includes('たしかめ'))
        assert.ok(give.includes(`${m}こ取ってもらいましょう`))
        assert.ok(give.includes(`この中から、${m}こちょうだい。`))
        // 最後は「終わる」で準備の画面へ戻る
        assert.ok(give.includes('終わる'))
      }
    }
    // 答え → たしかめに進むか → たしかめ（反対のはしから数え直す → 言われた数だけ取る）
    assert.deepEqual(countingPages.slice(-4), [
      'answer',
      'more',
      'recount',
      'give',
    ])
    // たしかめに進むかを決めるページは、まだ途中（台本を開いたまま読み直すと、このページから）
    assert.equal(
      countingFlowStatus(JSON.stringify({ n: 5, page: 'more' }), 5),
      'middle',
    )
    assert.equal(
      restoreCountingPage(JSON.stringify({ n: 5, page: 'more' }), 5),
      'more',
    )
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

    // 準備画面では、1〜10を選べて、教え方の流れが見える
    storage.clear()
    const router = createMemoryRouter(
      [
        {
          path: '/problems/:problemId',
          loader: ({ params }) => loadProblem(params.problemId),
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
    // 流れは「教え方の流れ」でわかるので、声かけの先読みは出さない。たたむ行が無いので、その枠も置かない
    assert.ok(!prepare.includes('声かけを先に読んでおく'))
    assert.ok(!prepare.includes('<details'))
    // 本編の準備画面には、使い方の3ステップを出さない
    assert.ok(!prepare.includes('使い方は3ステップ'))
    // 数を変える欄は、たたまずに図の下に出す
    assert.ok(!prepare.includes('<summary>数を変える</summary>'))
    // 今日の教え方のポイントと、詳しい教え方の行は出さない
    assert.ok(!prepare.includes('今日の教え方のポイント'))
    assert.ok(!prepare.includes('詳しい教え方'))
    // 代わりに、台本の大まかな流れを番号つきのステップで出す
    assert.ok(prepare.includes('教え方の流れ'))
    assert.match(
      prepare,
      /<ol[^>]*>(?:(?!<\/ol>).)*>1<\/span><span[^>]*>問題を読む<\/span><\/li>(?:(?!<\/ol>).)*>5<\/span><span[^>]*>言われた数だけ取ってもらう<\/span><\/li><\/ol>/,
    )
    // 用意するものは、選んだ数に合わせて出す
    assert.ok(prepare.includes('用意するもの'))
    assert.ok(
      prepare.includes(
        'おはじき・ブロック・お菓子など、同じくらいの大きさのものを5こ',
      ),
    )
    assert.ok(!prepare.includes('**'))
  } finally {
    if (previousStorage === undefined) delete globalThis.sessionStorage
    else globalThis.sessionStorage = previousStorage
  }
})

// 準備の画面の「わかる」で、解説をとばして、たしかめ（反対のはしから数える → 言われた数だけ取る）から始める。
// 数えられなかったら「解説にもどる」で、問題を読むページへ戻る
test('counting can start at the check pages and go back to the explanation', async () => {
  const {
    checkOnlyCountingProgress: checkOnly,
    initialCountingProgress: initial,
    countingPages,
    countingPagesOf,
    moveCounting,
    reviewCounting,
    restoreCountingProgress,
    countingFlowStatus,
  } = await import('../src/components/countingFlowState.ts')
  assert.deepEqual(countingPagesOf(true), ['recount', 'give'])
  assert.deepEqual(countingPagesOf(false), countingPages)
  // たしかめの2ページだけを行き来する
  assert.deepEqual(moveCounting(checkOnly, -1), checkOnly)
  const give = moveCounting(checkOnly, 1)
  assert.deepEqual(give, { page: 'give', checkOnly: true })
  assert.deepEqual(moveCounting(give, 1), give)
  assert.deepEqual(moveCounting(give, -1), checkOnly)
  // 解説にもどると、問題を読むページから（「わかる」で始めたときも、解説から進めてきたときも）
  for (const from of [
    checkOnly,
    give,
    { page: 'recount', checkOnly: false },
    { page: 'give', checkOnly: false },
  ])
    assert.deepEqual(reviewCounting(from), initial)
  // たしかめ以外のページからは戻らない
  for (const page of ['read', 'line', 'count', 'answer', 'more']) {
    const state = { page, checkOnly: false }
    assert.deepEqual(reviewCounting(state), state)
  }
  // 保存して開き直しても、たしかめから。最後のページまで終えたら、最初から
  const saved = (progress) => JSON.stringify({ n: 5, ...progress })
  assert.deepEqual(restoreCountingProgress(saved(checkOnly), 5), checkOnly)
  assert.equal(countingFlowStatus(saved(checkOnly), 5), 'middle')
  assert.deepEqual(restoreCountingProgress(saved(give), 5), initial)
  assert.equal(countingFlowStatus(saved(give), 5), 'finished')
  // 「わかる」で始めたものに、解説のページは保存されていない
  assert.deepEqual(
    restoreCountingProgress(saved({ page: 'count', checkOnly: true }), 5),
    initial,
  )

  // 「わかる」で始めたときの、たしかめのページの文。まだ数えていないので、「こんどは」とは言わない
  const { CountingFlow } = await import('../src/components/CountingFlow.tsx')
  const { ScriptControls } = await import('../src/components/scriptControls.ts')
  const path = '/problems/counting'
  const router = createMemoryRouter(
    [
      {
        path,
        element: createElement(
          ScriptControls.Provider,
          { value: { finish() {}, startFrom: 'check' } },
          createElement(CountingFlow, { n: 4 }),
        ),
      },
    ],
    { initialEntries: [path] },
  )
  let html
  try {
    html = renderToString(createElement(RouterProvider, { router })).replace(
      /<!-- -->/g,
      '',
    )
  } finally {
    router.dispose()
  }
  const text = (from, to) =>
    html
      .slice(html.indexOf(from), to ? html.indexOf(to) : undefined)
      .replace(/<[^>]*>/g, '')
  assert.match(html, /data-slide="recount" data-active="true"/)
  assert.ok(html.includes('1 / 2ページ'))
  const recount = text('data-slide="recount"', 'data-slide="give"')
  assert.ok(recount.includes('身近なものを4個、横1列に並べて'))
  assert.ok(
    recount.includes('こっちのはしから、1こずつ数えてみよう。全部で何こかな？'),
  )
  assert.ok(!recount.includes('こんどは'))
  assert.ok(recount.includes('「4」と答えたら'))
  assert.ok(recount.includes('解説にもどる'))
  const giveText = text('data-slide="give"')
  assert.ok(giveText.includes('この中から、2こちょうだい。'))
  assert.ok(giveText.includes('解説にもどる'))
  assert.ok(giveText.includes('終わる'))
  assert.ok(!html.includes('\n') && !html.includes('**'))
})
