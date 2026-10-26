import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { createTestServer } from './viteServer.mjs'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { createMemoryRouter, RouterProvider } from 'react-router'

test('tapping a preview does not let the carousel capture its pointer', () => {
  const source = readFileSync(
    new URL('../src/components/TeachingScript.tsx', import.meta.url),
    'utf8',
  )
  const ast = ts.createSourceFile(
    'TeachingScript.tsx',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
  let handler
  let moveHandler
  function visit(node) {
    if (ts.isJsxAttribute(node) && node.name.getText(ast) === 'onPointerDown')
      handler = node.initializer.expression.getText(ast)
    if (ts.isJsxAttribute(node) && node.name.getText(ast) === 'onPointerMove')
      moveHandler = node.initializer.expression.getText(ast)
    ts.forEachChild(node, visit)
  }
  visit(ast)
  assert.ok(handler)
  const gesture = { current: null }
  const { outputText } = ts.transpileModule(`return (${handler})`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  })
  const sliding = { current: false }
  let dragging = false
  const onPointerDown = new Function(
    'gesture',
    'sliding',
    'setDragging',
    'setSlideWidth',
    'track',
    outputText,
  )(
    gesture,
    sliding,
    (value) => {
      dragging = value
    },
    () => {},
    { current: { getBoundingClientRect: () => ({ width: 296 }) } },
  )
  let captured = 0
  const event = {
    isPrimary: true,
    button: 0,
    pointerId: 7,
    clientX: 120,
    clientY: 80,
    target: {
      closest: (selector) => (selector.includes('[role="button"]') ? {} : null),
    },
    currentTarget: { clientWidth: 360, setPointerCapture: () => captured++ },
  }
  // closest() also matches descendants of the preview, such as its bead illustration.
  onPointerDown(event)
  assert.equal(captured, 0)
  assert.equal(gesture.current, null)
  onPointerDown({ ...event, target: { closest: () => null } })
  assert.equal(captured, 1)
  assert.equal(gesture.current.id, 7)
  assert.equal(dragging, false)
  sliding.current = true
  onPointerDown({ ...event, target: { closest: () => null } })
  assert.equal(captured, 1)

  let dragX = 0
  const onPointerMove = new Function(
    'gesture',
    'setDragging',
    'setDragX',
    'canAdvance',
    'canBack',
    'slideWidth',
    ts.transpileModule(`return (${moveHandler})`, {
      compilerOptions: { target: ts.ScriptTarget.ES2022 },
    }).outputText,
  )(
    gesture,
    (value) => {
      dragging = value
    },
    (value) => {
      dragX = value
    },
    true,
    false,
    308,
  )
  // Finger jitter does not start a drag; a horizontal gesture stays horizontal.
  onPointerMove({ pointerId: 7, clientX: 117, clientY: 82 })
  assert.equal(dragging, false)
  onPointerMove({ pointerId: 7, clientX: 100, clientY: 85 })
  assert.equal(dragging, true)
  assert.equal(dragX, -20)
  onPointerMove({ pointerId: 7, clientX: 90, clientY: 120 })
  assert.equal(dragX, -30)
  onPointerMove({ pointerId: 7, clientX: -500, clientY: 120 })
  assert.equal(dragX, -308)
  // A gesture that starts vertically remains a scroll even if it moves sideways.
  gesture.current = { id: 8, x: 120, y: 80, axis: null }
  dragX = 0
  onPointerMove({ pointerId: 8, clientX: 122, clientY: 100 })
  onPointerMove({ pointerId: 8, clientX: 20, clientY: 110 })
  assert.equal(dragX, 0)
})

test('side navigation reads breadcrumbs from the matched route loader data', async () => {
  const server = await createTestServer()
  let router
  try {
    const { SideNavigation } = await server.ssrLoadModule(
      '/src/components/SideNavigation.tsx',
    )
    router = createMemoryRouter([
      { path: '/', element: createElement('p', null, 'home') },
      {
        path: '/lesson',
        loader: () => ({
          crumbs: [{ name: '戻り先の単元', url: '/unit-test-parent' }],
        }),
        element: createElement(SideNavigation),
      },
    ])
    await router.navigate('/lesson')
    const html = renderToString(createElement(RouterProvider, { router }))
    assert.ok(html.includes('今の学習から戻る'))
    assert.ok(html.includes('戻り先の単元'))
    assert.ok(html.includes('href="/unit-test-parent"'))
  } finally {
    router?.dispose()
    await server.close()
  }
})

test('counter results appear only after completion and disappear on undo or reset', () => {
  const source = readFileSync(
    new URL('../src/components/VisualPlayground.tsx', import.meta.url),
    'utf8',
  )
  const ast = ts.createSourceFile(
    'VisualPlayground.tsx',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
  const names = new Set([
    'addition',
    'subtraction',
    'split',
    'orangeCount',
    'greenCount',
    'moved',
    'targetCount',
    'progressKey',
    'wrongSide',
    'completed',
  ])
  const declarations = []
  function visit(node) {
    if (ts.isVariableDeclaration(node) && names.has(node.name.getText(ast))) {
      declarations.push('const ' + node.getText(ast) + ';')
    }
    ts.forEachChild(node, visit)
  }
  visit(ast)
  const { outputText } = ts.transpileModule(
    declarations.join('\n') +
      '\nreturn { completed, progressKey, orangeCount };',
    {
      compilerOptions: { target: ts.ScriptTarget.ES2022 },
    },
  )
  const evaluate = new Function(
    'problem',
    'pieces',
    'countedIds',
    'questionKey',
    outputText,
  )
  const check = (problem, pieces, questionKey = '') =>
    evaluate(problem, pieces, [], questionKey)
  for (const mode of ['add', 'carry', 'sub', 'borrow']) {
    const addition = mode === 'add' || mode === 'carry'
    const problem = {
      mode,
      a: mode === 'carry' ? 8 : mode === 'borrow' ? 12 : addition ? 3 : 7,
      b: 4,
    }
    const initial = Array.from(
      { length: addition ? problem.a + problem.b : problem.a },
      (_, index) => ({
        id: index,
        green: addition && index >= problem.a,
        side: addition && index >= problem.a ? 'right' : 'left',
      }),
    )
    assert.equal(check(problem, initial).completed, false, mode + ': initial')
    const finished = initial.map((piece, index) => ({
      ...piece,
      side: addition ? 'left' : index < 4 ? 'right' : 'left',
    }))
    const key = check(problem, finished).progressKey
    assert.equal(
      check(problem, finished).completed,
      false,
      mode + ': wait for completion feedback',
    )
    assert.equal(
      check(problem, finished, key).completed,
      true,
      mode + ': complete',
    )
    const undone = finished.map((piece, index) => ({
      ...piece,
      side:
        index === (addition ? problem.a : 0)
          ? addition
            ? 'right'
            : 'left'
          : piece.side,
    }))
    assert.equal(check(problem, undone, key).completed, false, mode + ': undo')
    assert.equal(check(problem, initial).completed, false, mode + ': reset')
    if (addition) {
      const incorrect = finished.map((piece, index) => ({
        ...piece,
        side: index === 0 ? 'right' : piece.side,
      }))
      const incorrectKey = check(problem, incorrect).progressKey
      assert.equal(
        check(problem, incorrect, incorrectKey).completed,
        false,
        mode + ': original group must stay on the left',
      )
    }
  }
})
