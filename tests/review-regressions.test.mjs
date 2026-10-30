import { test } from 'vitest'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { createMemoryRouter, RouterProvider } from 'react-router'

test('side navigation reads breadcrumbs from the matched route loader data', async () => {
  let router
  try {
    const { SideNavigation } =
      await import('../src/components/SideNavigation.tsx')
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
  }
})

// 横のメニューでも、ホーム・一覧と同じく、問題がない分類（じゅんび中）は押せない
test('side navigation links only to groups that have problems', async () => {
  let router
  try {
    const { SideNavigation } =
      await import('../src/components/SideNavigation.tsx')
    router = createMemoryRouter([
      { path: '/', element: createElement(SideNavigation) },
    ])
    await router.navigate('/')
    // 文字と式の境目に React が入れる <!-- --> は、照合の前に取り除く
    const html = renderToString(
      createElement(RouterProvider, { router }),
    ).replaceAll('<!-- -->', '')
    assert.ok(html.includes('href="/grade-1/math/addition-within-10"'))
    assert.ok(html.includes('href="/grade-1"'))
    for (const [slug, name] of [
      ['grade-1/math/subtraction-meaning', 'ひき算ってなに？'],
      ['grade-2', '小学2年生の一覧'],
    ]) {
      assert.ok(!html.includes(`href="/${slug}"`), slug + ': not a link')
      assert.match(
        html,
        new RegExp(`<span[^>]*data-empty[^>]*>${name}<span[^>]*>じゅんび中`),
        slug + ': shown as not ready',
      )
    }
  } finally {
    router?.dispose()
  }
})
