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
      // 大学祭用の問題（math- や puzzle- で始まるID）はテストを除外する。台本を作った問題だけ確かめる
      if (
        (id.startsWith('math-') || id.startsWith('puzzle-')) &&
        id !== 'math-hard-1'
      ) {
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
        // 台本はスワイプだけで送る。前へ・次へのボタンは置かず、キーボードでは台本の領域で ← → を使う
        assert.ok(
          !html.includes('aria-label="前のページ"') &&
            !html.includes('aria-label="次のページ"'),
          id + ': no page buttons',
        )
        assert.match(
          html,
          /aria-roledescription="カルーセル"[^>]*tabindex="0"/,
          id + ': the script can be moved with the keyboard',
        )
        // ページを分けた台本の各ページ：セリフがあれば、その後に教え方のポイントをたたんで置く。
        // 教え方のポイントは、** や \n の文字のまま出ない
        const slides = html
          .split(/(?=<section[^>]*data-slide=")/)
          .filter((chunk) => chunk.startsWith('<section'))
        for (const slide of slides) {
          const name = slide.match(/data-slide="(\w+)"/)?.[1]
          const say = slide.search(/class="[^"]*spokenWords/)
          const point = slide.search(/class="[^"]*parentNote/)
          if (say >= 0) {
            assert.ok(
              point > say,
              `${id}/${name}: teaching points after the line`,
            )
            assert.match(
              slide,
              /<details[^>]*class="[^"]*parentNote[^"]*"[^>]*data-folded/,
              `${id}/${name}: teaching points are folded`,
            )
          }
          if (point >= 0) {
            assert.ok(!slide.includes('**'), `${id}/${name}: no literal **`)
            assert.ok(!slide.includes('\\n'), `${id}/${name}: no literal \\n`)
          }
        }
        if (id === 'addition-within-10') {
          assert.match(html, /data-slide="read" data-active="true"/)
          assert.ok(html.includes('まずは問題を読んでみましょう'))
          assert.ok(html.includes('実物のおはじきを使う'))
          assert.ok(html.includes('アプリのおはじきを使う'))
          assert.ok(html.includes('教え方のポイント'))
          // 数は準備の画面で決める。台本の中では変えられない
          assert.ok(!html.includes('aria-label="最初の数"'))
          assert.ok(html.includes('台本の進み具合'))
          assert.ok(!html.includes('おはじきの案内'))
          continue
        }
        if (id === 'counting') {
          assert.match(html, /data-slide="read" data-active="true"/)
          assert.ok(html.includes('何こあるか、数えてみましょう'))
          assert.ok(html.includes('教え方のポイント'))
          // 数える数は準備の画面で選ぶ。台本の中では変えられない
          assert.ok(!html.includes('<legend>数える数</legend>'))
          assert.ok(!html.includes('aria-pressed'))
          assert.ok(html.includes('台本の進み具合'))
          continue
        }
        // 台本とデザインの見本（src/problems/sample）
        if (id === 'sample') {
          assert.match(html, /data-slide="read" data-active="true"/)
          assert.ok(html.includes('まずは問題を読んでみましょう'))
          assert.ok(html.includes('教え方のポイント'))
          // 食べる数は準備の画面で選ぶ。台本の中では変えられない
          assert.ok(!html.includes('<legend>食べる数</legend>'))
          assert.ok(html.includes('台本の進み具合'))
          // 「たしかめ」のページを見本に含める
          assert.ok(html.includes('たしかめ'))
          continue
        }
        // 大学祭の数学（難しい）第1問も、見本と同じページを分けた台本にする
        if (id === 'math-hard-1') {
          assert.match(html, /data-slide="read" data-active="true"/)
          assert.ok(html.includes('まずは問題を読んで、図をよく見てみましょう'))
          assert.ok(html.includes('台本の進み具合'))
          continue
        }
        // ページを分けない台本でも、数字は準備の画面で変える。台本の中には数字の欄を出さない
        assert.ok(
          !html.includes('aria-label="最初の数"'),
          id + ': numbers are not editable in the script',
        )
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
            /<(section|details)[^>]*class="[^"]*parentNote[^"]*"[^>]*>[\s\S]*?<\/\1>/g,
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
        const mascot = html.indexOf('/mascot.png')
        const start = html.indexOf(headings[0][0], mascot)
        const readingBox = html.indexOf('readingBox', start)
        const readingText = html.indexOf('readAloudText', readingBox)
        const point = html.indexOf('教え方のポイント', readingText)
        assert.ok(
          mascot < start &&
            start < readingBox &&
            readingBox < readingText &&
            readingText < point,
          id +
            ': mascot, speech cue, reading text and teaching points appear in order',
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
