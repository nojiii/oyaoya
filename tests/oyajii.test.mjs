import { test } from 'vitest'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'

// 声かけのカードでは、セリフの見出しの前に、おやじいを飾りとして置く（読み上げない）
test('a speech card shows Oyajii before its heading, hidden from screen readers', async () => {
  const { TeachingStep } = await import('../src/components/TeachingStep.tsx')
  const html = renderToString(
    createElement(TeachingStep, { step: { say: 'いくつあるかな？' } }),
  )
  const canvas = html.match(/<canvas[^>]*data-oyajii[^>]*>/)
  assert.ok(canvas, 'Oyajii is drawn')
  assert.ok(canvas.index < html.indexOf('声がけしよう'), 'before the heading')
  assert.match(canvas[0], /aria-hidden="true"/)
})

// おやじい（oyajiiFile.ts）は、描画エンジンの wasm を @rive-app/canvas から読む。
// @rive-app/react-canvas の JS が使う @rive-app/canvas と別のもの（別の版）を読むと、動かない
test('the Rive wasm comes from the same @rive-app/canvas that the React runtime uses', () => {
  const fromApp = createRequire(
    new URL('../src/components/oyajiiFile.ts', import.meta.url),
  ).resolve('@rive-app/canvas/package.json')
  const reactCanvas = createRequire(
    new URL('../package.json', import.meta.url),
  ).resolve('@rive-app/react-canvas/package.json')
  const fromRuntime = createRequire(reactCanvas).resolve(
    '@rive-app/canvas/package.json',
  )
  assert.equal(fromApp, fromRuntime)
})
