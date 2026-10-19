import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { createServer } from 'vite'
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
  function visit(node) {
    if (ts.isJsxAttribute(node) && node.name.getText(ast) === 'onPointerDown')
      handler = node.initializer.expression.getText(ast)
    ts.forEachChild(node, visit)
  }
  visit(ast)
  assert.ok(handler)
  const gesture = { current: null }
  const { outputText } = ts.transpileModule(`return (${handler})`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  })
  const onPointerDown = new Function('gesture', outputText)(gesture)
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
    currentTarget: { setPointerCapture: () => captured++ },
  }
  // closest() also matches descendants of the preview, such as its bead illustration.
  onPointerDown(event)
  assert.equal(captured, 0)
  assert.equal(gesture.current, null)
  onPointerDown({ ...event, target: { closest: () => null } })
  assert.equal(captured, 1)
  assert.equal(gesture.current.id, 7)
})

test('side navigation reads breadcrumbs from the matched route loader data', async () => {
  const server = await createServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  })
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
