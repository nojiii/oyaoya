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

// 大学祭用のサイトでは、横のナビにも大学祭のカテゴリだけを、URLの先頭に何も付けずに並べる
test('side navigation lists only the festival categories without a URL prefix', async () => {
  let router
  try {
    const { SideNavigation } =
      await import('../src/components/SideNavigation.tsx')
    const { festivalCurriculum } = await import('../src/curriculum.ts')
    router = createMemoryRouter([
      { path: '/', element: createElement(SideNavigation) },
    ])
    await router.navigate('/')
    // 文字と式の境目に React が入れる <!-- --> は、照合の前に取り除く
    const html = renderToString(
      createElement(RouterProvider, { router }),
    ).replaceAll('<!-- -->', '')
    for (const group of festivalCurriculum)
      assert.ok(html.includes(`href="/${group.slug}"`), group.slug)
    assert.ok(!html.includes('/festival'))
    assert.ok(!html.includes('grade-1'))
  } finally {
    router?.dispose()
  }
})
